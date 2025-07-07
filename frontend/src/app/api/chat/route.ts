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
      // Convert flatId from 'A01' to 'A_0'
      const match = flatId.toUpperCase().match(/^([A-Z])(\d+)$/);

      if (match) {
        const block = match[1];
        const number = parseInt(match[2], 10);
        // The URL 'A01' corresponds to floor 0, 'A02' to 1, etc.
        const floor = number > 0 ? number - 1 : 0;
        const formattedFlatId = `${block}_${floor}`;
        
        console.log(`Searching for flat with ID: ${formattedFlatId}`);

        const { data, error } = await supabase
          .from('developments')
          .select('*')
          .eq('flat_id', formattedFlatId)

        if (error) {
          console.error("Error fetching development data:", error);
        }

        if (data && data.length > 0) {
          developments = data;
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

Key instructions:
- Answer in Portuguese (PT-PT)
- Be friendly, professional, and helpful
- Use the provided context to answer questions about specific apartments
- When you don't have information, offer to connect with a human agent using [LEAD_FORM]
- If user shows interest, naturally ask qualifying questions about budget, timeline, family needs, etc.
- For price inquiries without context, say "O preço é sob consulta" and include [LEAD_FORM]
- Keep responses concise and direct

${shouldQualifyLead && userShowsInterest ? `
IMPORTANT: The user seems interested and this is a good time to qualify them as a lead. 
After answering their question, ask ONE of these qualification questions naturally:
- "Qual é o seu orçamento aproximado para este investimento?"
- "Quando está a pensar fazer a compra?"
- "Quantas pessoas vão viver no apartamento?"
- "Já tem financiamento aprovado ou precisa de ajuda com o processo?"
` : ''}

Context from our database:
${contextText}`;

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