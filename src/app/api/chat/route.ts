import { type NextRequest, NextResponse } from "next/server";
import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabaseClient";

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
}

export async function POST(request: NextRequest) {
  try {
    const { messages, flatId, visitorId, leadData, leadScore } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }
    
    const currentMessage = messages[messages.length - 1].text;

    if (!currentMessage) {
      return NextResponse.json({ error: 'The last message is empty' }, { status: 400 });
    }

    console.log('Received message:', currentMessage);
    console.log('Flat ID:', flatId);
    console.log('Lead data:', leadData);
    console.log('Lead score:', leadScore);
    console.log('Conversation history length:', messages.length);

    // Check if we should start lead qualification
    const shouldQualifyLead = (messages.length >= 3 && (!leadData || Object.keys(leadData).length === 0));
    const userShowsInterest = currentMessage.toLowerCase().includes('interessado') || 
                            currentMessage.toLowerCase().includes('preço') ||
                            currentMessage.toLowerCase().includes('comprar') ||
                            currentMessage.toLowerCase().includes('visita');

    let developments: Development[] = [];
    let contextText: string = "";

    if (flatId) {
      console.log(`Searching for flat with ID: ${flatId}`);

      // Try to find the flat using the flatId directly first
      const { data, error } = await supabase
        .from('developments')
        .select('*')
        .eq('flat_id', flatId);

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
          .ilike('flat_id', `%${flatId}%`);

        if (!searchError && searchData && searchData.length > 0) {
          developments = searchData;
          console.log(`Found ${searchData.length} flats with pattern search`);
        }
      }
    }

    if (developments.length > 0) {
      console.log('Search successful, found', developments.length, 'records');
      contextText = developments
        .map(d => `Descrição Geral: ${d.content}\n\nDetalhes Específicos: ${d.texto_bruto}`)
        .join("\n\n---\n\n");
    } else {
      console.log(`Could not find a match for flatId: ${flatId}, even after fallback.`);
      contextText = "No context found for the given flatId.";
    }

    console.log('Context length:', contextText.length);
    
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

Key instructions:
- Answer in Portuguese (PT-PT)
- Be friendly, professional, and helpful
- Use the provided apartment context to answer specific questions about areas, typology, features, etc.
- When asked about prices, always say "Para informações sobre preços, por favor contacte-nos" and include [LEAD_FORM]
- For questions you cannot answer with the provided context, offer to connect with a human agent using [LEAD_FORM]
- If user shows interest, naturally ask qualifying questions about budget, timeline, family needs, etc.
- Keep responses concise and direct
- Always refer to apartments by their reference (e.g., "apartamento A_0", "apartamento E_1")

${flatId && developments.length > 0 ? `
CURRENT APARTMENT CONTEXT: You are specifically discussing apartment ${flatId}.
Use the detailed information provided below to answer questions about this specific apartment.
` : ''}

${shouldQualifyLead && userShowsInterest ? `
IMPORTANT: The user seems interested and this is a good time to qualify them as a lead. 
After answering their question, ask ONE of these qualification questions naturally:
- "Qual é o seu orçamento aproximado para este investimento?"
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
      qualification_step: qualificationStep
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}