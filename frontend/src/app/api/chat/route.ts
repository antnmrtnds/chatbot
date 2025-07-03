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
    const { messages, flatId, visitorId } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }
    
    const currentMessage = messages[messages.length - 1].text;

    if (!currentMessage) {
      return NextResponse.json({ error: 'The last message is empty' }, { status: 400 });
    }

    console.log('Received message:', currentMessage);
    console.log('Flat ID:', flatId);
    console.log('Conversation history length:', messages.length);

    // This embedding is not used in the logic, so we can comment it out to fix the unused variable error.
    // If you plan to use semantic search later, you can uncomment this section.
    // const embeddingResponse = await openai.embeddings.create({
    //   model: 'text-embedding-ada-002',
    //   input: currentMessage,
    // });
    // const embedding = embeddingResponse.data[0].embedding;

    let developments: Development[] = [];
    let contextText: string = "";

    if (flatId) {
      // Try an exact match first
      const { data: exactMatch } = await supabase
        .from('developments')
        .select('*')
        .eq('flat_id', flatId.toUpperCase());

      if (exactMatch && exactMatch.length > 0) {
        developments = exactMatch;
      } else {
        // Fallback to block/floor parsing if exact match fails
        const match = flatId.match(/^([A-Z])(\d+)$/);
        if (match) {
          const block = match[1];
          const floor = match[2];
          console.log(`Fallback Search: block='${block}', floor='${floor}'`);

          const { data: fallbackData } = await supabase
            .from("developments")
            .select("*")
            .eq("bloco", block)
            .eq("piso", parseInt(floor, 10) - 1);

          if (fallbackData && fallbackData.length > 0) {
            developments = fallbackData;
          }
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
You are a helpful virtual assistant for Viriato, a real estate company.
Your primary goal is to answer user questions about a specific apartment, using the context provided below.
When asked for information, you MUST use the provided context. Do not use any external knowledge.

If the context does not contain the answer, state that you don't have the information and offer to connect the user with a human agent by including the special token [LEAD_FORM] in your response.

Key instructions:
- If the user asks for the price, and it's not in the context, say "O preço é sob consulta." and include [LEAD_FORM].
- If you use the [LEAD_FORM] token, it MUST be the very last part of your response.
- Be friendly and professional.
- Answer in Portuguese (PT-PT).
- Mantenha as respostas concisas e diretas.
Aqui está o contexto do nosso banco de dados:
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
              details: { message: userMessage.text },
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
    
    return NextResponse.json({ response: botResponse });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}