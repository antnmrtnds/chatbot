import { type NextRequest, NextResponse } from "next/server";
import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabaseClient";
import { nluService, NLUResult } from "@/lib/nlu";
import { memoryService } from "@/lib/memoryService";
import { sessionStateManager } from "@/lib/sessionStateManager";
import { calendarService, VisitScheduleData } from "@/lib/calendarService";
import { leadService, LeadData } from "@/lib/leadService";

let supabase_admin: SupabaseClient | null = null;
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase_admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
} else {
  console.warn("Supabase service key not found. Chat message scoring will be disabled.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
});

// Define Message type for the new history functionality
type Message = {
  text: string;
  sender: 'user' | 'bot';
};

interface Development {
  flat_id: string;
  bloco: string;
  piso: string;
  tipologia: string;
  content: string;
  texto_bruto?: string;
  price?: string;
}

// Add a function to transform URL flatId format to database format
function transformFlatIdForDatabase(urlFlatId: string): string {
  if (!urlFlatId) return urlFlatId;
  
  console.log('Transforming flatId:', urlFlatId);
  
  // Extract letter and number parts - more flexible regex
  const match = urlFlatId.match(/^([A-H])(\d*)$/i);
  if (!match) {
    console.log('No regex match for flatId:', urlFlatId);
    return urlFlatId; // Return original if no match
  }
  
  const letter = match[1].toUpperCase();
  const number = match[2];
  
  console.log('Extracted letter:', letter, 'number:', number);
  
  // Based on the actual database pattern:
  // Ground floor (A-D): A_0, B_0, C_0, D_0
  // First floor (E-G): E, F, G (just the letter!)
  // Duplex (H): H
  
  if (['A', 'B', 'C', 'D'].includes(letter)) {
    // Ground floor apartments - always append _0
    const result = `${letter}_0`;
    console.log('Transformed to (ground floor):', result);
    return result;
  } else if (['E', 'F', 'G'].includes(letter)) {
    // First floor apartments - just the letter
    const result = letter;
    console.log('Transformed to (first floor):', result);
    return result;
  } else if (letter === 'H') {
    // Duplex apartment - just H
    const result = 'H';
    console.log('Transformed to (duplex):', result);
    return result;
  }
  
  // Fallback - should not happen with valid apartment IDs
  const result = urlFlatId;
  console.log('Transformed to (fallback):', result);
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, flatId, visitorId, leadData, leadScore, sessionId } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }
    
    const currentMessage = messages[messages.length - 1].text;

    if (!currentMessage) {
      return NextResponse.json({ error: 'The last message is empty' }, { status: 400 });
    }

    console.log('=== CHAT API REQUEST ===');
    console.log('Received message:', currentMessage);
    console.log('Flat ID:', flatId);
    console.log('Lead data:', leadData);
    console.log('Lead score:', leadScore);
    console.log('Session ID:', sessionId);
    console.log('Conversation history length:', messages.length);

    // === MEMORY SERVICE INTEGRATION ===
    const actualSessionId = sessionId || `session-${visitorId}-${Date.now()}`;
    const conversationContext = await memoryService.getConversationContext(actualSessionId, visitorId);
    const userProfile = await memoryService.getUserProfile(visitorId);
    
    console.log('=== MEMORY CONTEXT ===');
    console.log('User preferences:', userProfile.preferences);
    console.log('Recent contextual references:', conversationContext.contextualReferences.slice(-3));
    console.log('Current topic:', conversationContext.currentTopic);
    console.log('Multi-step flow:', conversationContext.multiStepFlow);

    // === SESSION STATE MANAGEMENT ===
    const flowStatus = await sessionStateManager.getFlowStatus(actualSessionId, visitorId);
    console.log('=== FLOW STATUS ===');
    console.log('Active flow:', flowStatus.active);
    console.log('Flow type:', flowStatus.flowType);
    console.log('Current step:', flowStatus.currentStep);
    console.log('Progress:', flowStatus.progress);

    // === HANDLE ACTIVE MULTI-STEP FLOWS ===
    if (flowStatus.active && flowStatus.flowType) {
      console.log('=== PROCESSING ACTIVE FLOW ===');
      
      // Check if this is an interruption (user asking something unrelated to the flow)
      const nluResult: NLUResult = nluService.analyze(currentMessage);
      const isFlowRelated = isMessageFlowRelated(currentMessage, flowStatus.flowType);
      
      if (!isFlowRelated && flowStatus.canInterrupt) {
        console.log('Flow interruption detected');
        
        // Handle the interruption
        const interruptionResult = await sessionStateManager.handleInterruption(
          actualSessionId,
          visitorId,
          currentMessage
        );
        
        if (interruptionResult.canResume) {
          // Process the interrupting message normally, but offer to resume later
          // Continue with normal NLU processing below
        }
      } else {
        // Process as part of the active flow
        const flowResult = await sessionStateManager.processFlowInput(
          actualSessionId,
          visitorId,
          currentMessage
        );
        
        if (flowResult) {
          // Update conversation context
          memoryService.updateConversationContext(actualSessionId, {
            text: currentMessage,
            sender: 'user',
            intent: 'flow_response',
            entities: [],
          });
          
          memoryService.updateConversationContext(actualSessionId, {
            text: flowResult.message,
            sender: 'bot',
          });
          
          // If flow completed, update user preferences with collected data and handle transactional completion
          if (flowResult.completed && flowResult.data) {
            await updateUserPreferencesFromFlowData(visitorId, flowStatus.flowType!, flowResult.data);
            
            // Handle transactional workflow completion
            await handleTransactionalCompletion(flowStatus.flowType!, flowResult.data, actualSessionId, visitorId);
          }
          
          return NextResponse.json({
            response: flowResult.message,
            flowActive: !flowResult.completed,
            flowStep: flowResult.flowStep,
            flowOptions: flowResult.options,
            flowCompleted: flowResult.completed,
            flowData: flowResult.data,
            nlu_result: {
              intent: 'flow_response',
              confidence: 1.0,
              entities: [],
              response_type: 'flow_step'
            }
          });
        }
      }
    }

    // === NLU PROCESSING ===
    console.log('=== NLU ANALYSIS ===');
    const nluResult: NLUResult = nluService.analyze(currentMessage);
    console.log('Detected intent:', nluResult.intent.name, 'confidence:', nluResult.intent.confidence);
    console.log('Extracted entities:', nluResult.entities);
    
    // Update conversation context with current message
    memoryService.updateConversationContext(actualSessionId, {
      text: currentMessage,
      sender: 'user',
      intent: nluResult.intent.name,
      entities: nluResult.entities,
    });
    
    // Generate structured response based on NLU analysis
    const responseContext = nluService.generateResponse(nluResult);
    console.log('Response context:', responseContext);
    
    // Extract lead qualification data from entities and update user profile
    const extractedLeadData = nluService.extractLeadQualificationData(nluResult.entities);
    console.log('Extracted lead data:', extractedLeadData);
    
    // Update user preferences if new data was extracted
    if (Object.keys(extractedLeadData).length > 0) {
      const preferencesToUpdate: any = {};
      if (extractedLeadData.budget_range) preferencesToUpdate.priceRange = extractedLeadData.budget_range;
      if (extractedLeadData.unit_type) preferencesToUpdate.propertyType = extractedLeadData.unit_type;
      if (extractedLeadData.timeline) preferencesToUpdate.timeline = extractedLeadData.timeline;
      
      if (Object.keys(preferencesToUpdate).length > 0) {
        await memoryService.updateUserPreferences(visitorId, preferencesToUpdate);
        console.log('Updated user preferences:', preferencesToUpdate);
      }
    }

    // === CHECK FOR FLOW TRIGGERS ===
    const flowTrigger = detectFlowTrigger(nluResult, currentMessage);
    if (flowTrigger && !flowStatus.active) {
      console.log('=== STARTING NEW FLOW ===');
      console.log('Flow trigger detected:', flowTrigger);
      
      const flowResult = await sessionStateManager.startFlow(
        actualSessionId,
        visitorId,
        flowTrigger,
        { intent: nluResult.intent.name, entities: nluResult.entities }
      );
      
      if (flowResult) {
        // Update conversation context
        memoryService.updateConversationContext(actualSessionId, {
          text: flowResult.message,
          sender: 'bot',
        });
        
        return NextResponse.json({
          response: flowResult.message,
          flowActive: true,
          flowStep: flowResult.flowStep,
          flowOptions: flowResult.options,
          nlu_result: {
            intent: nluResult.intent.name,
            confidence: nluResult.intent.confidence,
            entities: nluResult.entities,
            response_type: 'flow_start'
          }
        });
      }
    }

    // Check for contextual response based on conversation history
    const contextualResponse = memoryService.generateContextualResponse(actualSessionId, currentMessage);
    
    if (contextualResponse) {
      console.log('Generated contextual response:', contextualResponse);
      
      // Update conversation context with bot response
      memoryService.updateConversationContext(actualSessionId, {
        text: contextualResponse,
        sender: 'bot',
      });
      
      return NextResponse.json({
        response: contextualResponse,
        contextual: true,
        nlu_result: {
          intent: nluResult.intent.name,
          confidence: nluResult.intent.confidence,
          entities: nluResult.entities,
          response_type: responseContext.responseType
        },
        suggestions: memoryService.getContextualSuggestions(actualSessionId, visitorId)
      });
    }

    // Check if we should start lead qualification
    const shouldQualifyLead = (messages.length >= 3 && (!leadData || Object.keys(leadData).length === 0));
    const userShowsInterest = currentMessage.toLowerCase().includes('interessado') || 
                            currentMessage.toLowerCase().includes('preço') ||
                            currentMessage.toLowerCase().includes('comprar') ||
                            currentMessage.toLowerCase().includes('visita');

    let developments: Development[] = [];
    let contextText: string = "";

    if (flatId) {
      console.log(`=== APARTMENT SEARCH ===`);
      console.log(`Searching for flat with ID: ${flatId}`);
      
      // Transform the flatId from URL format to database format
      const dbFlatId = transformFlatIdForDatabase(flatId);
      console.log(`Transformed flatId from ${flatId} to ${dbFlatId}`);

      // Try to find the flat using the transformed flatId directly first
      const { data, error } = await supabase
        .from('developments')
        .select('*')
        .eq('flat_id', dbFlatId);

      if (error) {
        console.error("Error fetching development data:", error);
      }

      if (data && data.length > 0) {
        developments = data;
        console.log('Found flat with direct match');
      } else {
        // If no direct match, try to search by matching patterns in flat_id
        console.log('No direct match, trying pattern search');
        const { data: searchData, error: searchError } = await supabase
          .from('developments')
          .select('*')
          .ilike('flat_id', `%${dbFlatId}%`);

        if (!searchError && searchData && searchData.length > 0) {
          developments = searchData;
          console.log(`Found ${searchData.length} flats with pattern search`);
        } else {
          // Also try with original flatId as fallback
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('developments')
            .select('*')
            .ilike('flat_id', `%${flatId}%`);
            
          if (!fallbackError && fallbackData && fallbackData.length > 0) {
            developments = fallbackData;
            console.log(`Found ${fallbackData.length} flats with fallback search`);
          }
        }
      }
    }

    if (developments.length > 0) {
      console.log('Search successful, found', developments.length, 'records');
      contextText = developments
        .map(d => {
          let priceInfo = d.price ? `Preço: ${d.price}\n` : '';
          return `${priceInfo}Descrição Geral: ${d.content}\n\nDetalhes Específicos: ${d.texto_bruto || ''}`;
        })
        .join("\n\n---\n\n");
    } else {
      console.log(`Could not find a match for flatId: ${flatId}, even after fallback.`);
      contextText = "No context found for the given flatId.";
    }

    console.log('Context length:', contextText.length);
    
    // Helper function to get intent-specific instructions
    const getIntentSpecificInstructions = (intentName: string, context: any): string => {
      switch (intentName) {
        case 'project_info':
          return `- Focus on providing comprehensive information about the Evergreen Pure project
- Highlight key features, location benefits, and construction timeline
- Mention available typologies and general pricing range if appropriate`;
          
        case 'payment_plans':
          return `- Provide detailed information about financing options
- Mention available payment plans and mortgage assistance
- If budget range was detected, tailor recommendations accordingly
- Always offer to connect with a financial advisor for personalized options`;
          
        case 'register_interest':
          return `- Prioritize lead capture - this user is ready to engage
- Collect contact information and preferences
- Offer immediate next steps like scheduling a visit or callback
- Use [LEAD_FORM] to trigger the contact form`;
          
        case 'apartment_inquiry':
          return `- Provide specific apartment details if apartment ID was detected
- Compare different unit types if requested
- Focus on features, areas, and availability
- Suggest viewing options or additional apartments`;
          
        case 'greeting':
          return `- Provide a warm welcome
- Offer clear next steps and options
- Ask about their specific interests or needs`;
          
        default:
          return `- Provide helpful general information
- Try to understand their specific needs
- Guide them toward relevant information or actions`;
      }
    };
    
    // Build enhanced system prompt with memory context
    const recentReferences = conversationContext.contextualReferences.slice(-5);
    const userPreferences = userProfile.preferences;
    const conversationHistory = conversationContext.messages.slice(-6); // Last 3 exchanges
    
    const systemPrompt = `
You are a helpful virtual assistant for Viriato, a real estate company specializing in property development in Aveiro.
Your primary goal is to answer user questions about apartments and qualify potential leads.

About Evergreen Pure Development:
- Located in Santa Joana, Aveiro
- Composed of two blocks with 8 apartments each
- Offers T1, T2, T3 and T3 duplex typologies
- Areas range from 56m² to 117m²
- Minimalist design with high-quality finishes
- Construction completion expected by end of 2025
- All apartments are currently under construction ("em planta")

=== CONVERSATION CONTEXT & MEMORY ===
Current Topic: ${conversationContext.currentTopic || 'general_inquiry'}
Last User Intent: ${conversationContext.lastUserIntent || 'none'}

User Profile & Preferences:
${Object.keys(userPreferences).length > 0 ? `
- Price Range: ${userPreferences.priceRange || 'not specified'}
- Property Type: ${userPreferences.propertyType || 'not specified'}
- Timeline: ${userPreferences.timeline || 'not specified'}
- Family Size: ${userPreferences.familySize || 'not specified'}
- Financing: ${userPreferences.financing || 'not specified'}
` : '- No specific preferences recorded yet'}

Recent Contextual References:
${recentReferences.length > 0 ? recentReferences.map(ref => `- ${ref.type}: ${ref.value}`).join('\n') : '- None'}

Recent Conversation History:
${conversationHistory.length > 0 ? conversationHistory.map(msg => `${msg.sender}: ${msg.text}`).join('\n') : '- This is the start of the conversation'}

Multi-Step Flow Status:
${conversationContext.multiStepFlow ? `
- Flow Type: ${conversationContext.multiStepFlow.flowType}
- Current Step: ${conversationContext.multiStepFlow.currentStep}
- Collected Data: ${JSON.stringify(conversationContext.multiStepFlow.collectedData)}
- Next Step: ${conversationContext.multiStepFlow.nextStep || 'to be determined'}
` : '- No active multi-step flow'}

=== NLU ANALYSIS RESULTS ===
Detected Intent: ${nluResult.intent.name} (confidence: ${nluResult.intent.confidence.toFixed(2)})
Response Type: ${responseContext.responseType}
Extracted Entities: ${nluResult.entities.map(e => `${e.type}: ${e.value}`).join(', ') || 'None'}

Key instructions based on detected intent:
${getIntentSpecificInstructions(nluResult.intent.name, responseContext)}

CONTEXT-AWARE INSTRUCTIONS:
- Use the conversation history to provide continuity and avoid repeating information
- Reference previous topics and user preferences when relevant
- If the user mentioned specific preferences before (like "properties near the park"), remember and build upon that context
- For follow-up questions like "Any with a pool?", understand they're referring to the previously discussed topic
- Maintain conversation flow by acknowledging what was discussed before
- If user preferences are known, tailor suggestions accordingly
- Handle interruptions gracefully by resuming previous topics when appropriate

General instructions:
- Answer in Portuguese (PT-PT)
- Be friendly, professional, and helpful
- Use the provided apartment context to answer specific questions about areas, typology, features, etc.
- If the price is present in the context, you may answer with the actual price. If the price is missing, say "Para informações sobre preços, por favor contacte-nos" and include [LEAD_FORM]
- For questions you cannot answer with the provided context, offer to connect with a human agent using [LEAD_FORM]
- If user shows interest, naturally ask qualifying questions about budget, timeline, family needs, etc.
- Keep responses concise and direct
- Always refer to apartments by their display reference (e.g., "apartamento A01", "apartamento E02", "apartamento H01")
- Use the original flatId parameter for display purposes, but search using the transformed database format

${flatId && developments.length > 0 ? `
CURRENT APARTMENT CONTEXT: You are specifically discussing apartment ${flatId}.
Use the detailed information provided below to answer questions about this specific apartment.
` : ''}

${shouldQualifyLead && userShowsInterest ? `
IMPORTANT: The user seems interested and this is a good time to qualify them as a lead.
After answering their question, ask ONE of these qualification questions naturally:
- "Qual é o seu orçamento aproximado para este investimento? Por exemplo, está a considerar uma faixa entre 100k-200k€, 200k-300k€, 300k-400k€, ou acima de 400k€?"
- "Quando está a pensar fazer a compra?"
- "Quantas pessoas vão viver no apartamento?"
- "Já tem financiamento aprovado ou precisa de ajuda com o processo?"
` : ''}

${contextText ? `
Apartment Information:
${contextText}
` : 'No specific apartment information available.'}`;

    const formattedMessages = messages.map((msg: Message) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    // Create a completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...formattedMessages,
      ],
      temperature: 0.5,
      max_tokens: 400,
    });

    const botResponse = completion.choices[0].message.content;
    console.log('Generated response:', botResponse);

    if (botResponse?.trim() === '[LEAD_FORM]') {
      return NextResponse.json({ action: 'collect_lead' });
    }

    // Update conversation context with bot response
    memoryService.updateConversationContext(actualSessionId, {
      text: botResponse || '',
      sender: 'bot',
    });

    // Track property interaction if discussing specific apartment
    if (flatId && nluResult.intent.name === 'apartment_inquiry') {
      await memoryService.addPropertyInteraction(visitorId, {
        propertyId: flatId,
        interactionType: 'inquiry',
        details: {
          intent: nluResult.intent.name,
          entities: nluResult.entities,
          message: currentMessage,
        }
      });
    }

    // Determine if we should include qualification step
    let qualificationStep = null;
    if (shouldQualifyLead && userShowsInterest) {
      // Determine which qualification question to ask based on what we don't have
      if (!leadData?.budget_range) {
        qualificationStep = 'budget';
      } else if (!leadData?.timeline) {
        qualificationStep = 'timeline';
      } else if (!leadData?.family_size) {
        qualificationStep = 'family_size';
      } else if (!leadData?.financing_needs) {
        qualificationStep = 'financing';
      }
    }

    if (visitorId && supabase_admin) {
      try {
        const { data: lead } = await supabase_admin
          .from("leads_tracking")
          .select("id")
          .eq("visitor_id", visitorId)
          .single();

        if (lead) {
          const leadId = lead.id;
          const userMessage = messages[messages.length - 1];

          const { error: interactionError } = await supabase_admin
            .from("visitor_interactions")
            .insert({
              lead_id: leadId,
              visitor_id: visitorId,
              interaction_type: "chat_message",
              points_awarded: 5,
              details: { message: userMessage.text, leadScore: leadScore },
            });

          if (interactionError) {
            console.error("Error creating interaction for chat message:", interactionError);
          } else {
            const { error: scoreError } = await supabase_admin.rpc('calculate_lead_score', { lead_uuid: leadId });
            if (scoreError) {
              console.error("Error calculating lead score after chat:", scoreError);
            }
          }
        }
      } catch (e) {
        console.error("Error during scoring for chat message:", e)
      }
    }
    
    return NextResponse.json({
      response: botResponse,
      qualification_step: qualificationStep,
      nlu_result: {
        intent: nluResult.intent.name,
        confidence: nluResult.intent.confidence,
        entities: nluResult.entities,
        response_type: responseContext.responseType
      },
      suggestions: memoryService.getContextualSuggestions(actualSessionId, visitorId),
      context: {
        currentTopic: conversationContext.currentTopic,
        userPreferences: userProfile.preferences,
        multiStepFlow: conversationContext.multiStepFlow,
      }
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions for flow management
function isMessageFlowRelated(message: string, flowType: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  switch (flowType) {
    case 'property_search':
      return lowerMessage.includes('orçamento') ||
             lowerMessage.includes('budget') ||
             lowerMessage.includes('tipologia') ||
             lowerMessage.includes('quando') ||
             /^(t[0-9]|até|entre|acima|imediatamente|próximos)/i.test(lowerMessage);
             
    case 'lead_qualification':
      return lowerMessage.includes('decido') ||
             lowerMessage.includes('investimento') ||
             lowerMessage.includes('habitação') ||
             lowerMessage.includes('prazo');
             
    case 'visit_scheduling':
      return lowerMessage.includes('visita') ||
             lowerMessage.includes('contacto') ||
             lowerMessage.includes('telefone') ||
             lowerMessage.includes('email');
             
    default:
      return false;
  }
}

function detectFlowTrigger(nluResult: NLUResult, message: string): string | null {
  const intent = nluResult.intent.name;
  const lowerMessage = message.toLowerCase();
  
  // Property search flow triggers
  if (intent === 'apartment_inquiry' &&
      (lowerMessage.includes('ver apartamentos') ||
       lowerMessage.includes('apartamentos disponíveis') ||
       lowerMessage.includes('procuro'))) {
    return 'property_search';
  }
  
  // Lead qualification flow triggers
  if (intent === 'register_interest' ||
      (lowerMessage.includes('interessado') && lowerMessage.includes('comprar'))) {
    return 'lead_qualification';
  }
  
  // Visit scheduling flow triggers
  if (lowerMessage.includes('agendar visita') ||
      lowerMessage.includes('marcar visita') ||
      lowerMessage.includes('visitar')) {
    return 'visit_scheduling';
  }
  
  return null;
}

async function updateUserPreferencesFromFlowData(visitorId: string, flowType: string, flowData: any): Promise<void> {
  const preferences: any = {};
  
  switch (flowType) {
    case 'property_search':
      if (flowData.budget) {
        preferences.priceRange = flowData.budget;
      }
      if (flowData.property_type) {
        preferences.propertyType = flowData.property_type;
      }
      if (flowData.timeline) {
        preferences.timeline = flowData.timeline;
      }
      break;
      
    case 'lead_qualification':
      if (flowData.budget_qualification) {
        preferences.priceRange = flowData.budget_qualification;
      }
      if (flowData.need) {
        preferences.purpose = flowData.need;
      }
      if (flowData.timeline_qualification) {
        preferences.timeline = flowData.timeline_qualification;
      }
      break;
      
    case 'visit_scheduling':
      if (flowData.contact_preference) {
        preferences.contactPreference = flowData.contact_preference;
      }
      break;
  }
  
  if (Object.keys(preferences).length > 0) {
    await memoryService.updateUserPreferences(visitorId, preferences);
    console.log('Updated user preferences from flow:', preferences);
  }
}

/**
 * Handle transactional workflow completion
 */
async function handleTransactionalCompletion(
  flowType: string,
  flowData: any,
  sessionId: string,
  visitorId: string
): Promise<void> {
  console.log('=== TRANSACTIONAL COMPLETION ===');
  console.log('Flow type:', flowType);
  console.log('Flow data:', flowData);

  try {
    switch (flowType) {
      case 'visit_scheduling':
        await handleVisitSchedulingCompletion(flowData, sessionId, visitorId);
        break;
        
      case 'lead_qualification':
        await handleLeadQualificationCompletion(flowData, sessionId, visitorId);
        break;
        
      default:
        console.log('No transactional completion handler for flow type:', flowType);
    }
  } catch (error) {
    console.error('Error in transactional completion:', error);
  }
}

/**
 * Handle visit scheduling completion - generate calendar invites
 */
async function handleVisitSchedulingCompletion(
  flowData: any,
  sessionId: string,
  visitorId: string
): Promise<void> {
  console.log('Processing visit scheduling completion...');
  
  // Extract contact information from the flow data
  const contactInfo = extractContactFromFlowData(flowData.contact_info);
  
  const scheduleData: VisitScheduleData = {
    visitorName: contactInfo.name,
    visitorEmail: contactInfo.email,
    visitorPhone: flowData.phone_number,
    visitType: flowData.visit_type,
    preferredDate: flowData.preferred_date,
    preferredTime: flowData.preferred_time,
    propertyId: 'Evergreen Pure',
    propertyAddress: 'Santa Joana, Aveiro'
  };

  // Generate calendar invite
  const icsContent = calendarService.generateCalendarInvite(scheduleData);
  const googleUrl = calendarService.generateGoogleCalendarUrl(scheduleData);
  const outlookUrl = calendarService.generateOutlookCalendarUrl(scheduleData);

  console.log('Calendar invite generated for:', contactInfo.email);
  console.log('Google Calendar URL:', googleUrl);
  console.log('Outlook Calendar URL:', outlookUrl);

  // Store the calendar invite data in memory for potential retrieval
  await memoryService.updateConversationContext(sessionId, {
    text: `Calendar invite generated for visit on ${scheduleData.preferredDate} at ${scheduleData.preferredTime}. Google: ${googleUrl}`,
    sender: 'bot'
  });

  // In a real implementation, this would send an email with the calendar invite
  console.log('Visit scheduling completed - calendar invite ready for:', {
    name: scheduleData.visitorName,
    email: scheduleData.visitorEmail,
    visitType: scheduleData.visitType,
    date: scheduleData.preferredDate,
    time: scheduleData.preferredTime
  });
}

/**
 * Handle lead qualification completion - process and score lead
 */
async function handleLeadQualificationCompletion(
  flowData: any,
  sessionId: string,
  visitorId: string
): Promise<void> {
  console.log('Processing lead qualification completion...');
  
  const leadData: LeadData = {
    contact_collection: flowData.contact_collection,
    phone_collection: flowData.phone_collection,
    budget_qualification: flowData.budget_qualification,
    authority: flowData.authority,
    need: flowData.need,
    timeline_qualification: flowData.timeline_qualification,
    sessionId: sessionId,
    timestamp: new Date().toISOString(),
    source: 'chatbot'
  };

  // Process the lead through the lead service
  const processedLead = await leadService.processLead(leadData);
  
  console.log('Lead processed successfully:', {
    id: processedLead.id,
    name: processedLead.contactInfo.name,
    email: processedLead.contactInfo.email,
    grade: processedLead.qualification.grade,
    priority: processedLead.qualification.priority,
    score: processedLead.qualification.total,
    assignedAgent: processedLead.assignedAgent
  });

  // Store the processed lead data in memory
  await memoryService.updateConversationContext(sessionId, {
    text: `Lead qualification completed - Grade ${processedLead.qualification.grade}, Priority ${processedLead.qualification.priority}, Agent: ${processedLead.assignedAgent}`,
    sender: 'bot'
  });

  // Update user profile with lead information (only valid preference fields)
  await memoryService.updateUserPreferences(visitorId, {
    priceRange: leadData.budget_qualification,
    timeline: leadData.timeline_qualification
  });
}

/**
 * Extract contact information from flow data string
 */
function extractContactFromFlowData(contactString: string): { name: string; email: string } {
  const emailMatch = contactString.match(/([^\s]+@[^\s]+\.[^\s]+)/);
  const email = emailMatch ? emailMatch[1] : '';
  
  // Extract name (everything before the email)
  const name = contactString.replace(/\s*-\s*[^\s]+@[^\s]+\.[^\s]+.*/, '').trim();
  
  return {
    name: name || 'Nome não fornecido',
    email: email
  };
}