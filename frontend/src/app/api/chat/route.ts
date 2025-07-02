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

    // Get developments from database
    const query = supabase
      .from('developments')
      .select('*');
    
    // If flatId is provided, filter by it first
    if (flatId) {
      query.eq('flat_id', flatId);
    }
    
    const { data: developments, error: searchError } = await query.limit(5);

    let context = '';

    if (searchError) {
      console.error('Supabase search error:', searchError);
      
      let fallbackData: Development[] | null = null;
      
      if (flatId) {
        // Try exact flat_id match first
        const { data: exactMatch } = await supabase
          .from('developments')
          .select('*')
          .eq('flat_id', flatId)
          .returns<Development[]>();
        
        if (exactMatch && exactMatch.length > 0) {
          fallbackData = exactMatch;
          console.log('Found exact flat_id match:', flatId, '- records found:', exactMatch.length);
        } else {
          // Try bloco and piso combination
          if (flatId.includes('_')) {
            const [bloco, piso] = flatId.split('_');
            const { data: blocoPisoMatch } = await supabase
              .from('developments')
              .select('*')
              .ilike('bloco', bloco)
              .eq('piso', piso)
              .returns<Development[]>();
            
            if (blocoPisoMatch && blocoPisoMatch.length > 0) {
              fallbackData = blocoPisoMatch;
              console.log('Found bloco/piso match:', bloco, piso, '- records found:', blocoPisoMatch.length);
            }
          }
        }
      } else {
        const { data: allData } = await supabase
          .from('developments')
          .select('*')
          .limit(10)
          .returns<Development[]>();
        
        fallbackData = allData;
      }
      
      console.log('Using fallback data, found', fallbackData?.length, 'records');
      
      // Debug: Show all available flat_id values in fallback data
      if (fallbackData && fallbackData.length > 0) {
        console.log('Available flat_ids in fallback data:', fallbackData.map((dev) => dev.flat_id));
        console.log('Available bloco/piso combinations:', fallbackData.map((dev) => `${dev.bloco}_${dev.piso}`));
      }
      
      // Use fallback data with more detailed context
      context = fallbackData?.map(dev => {
        const areaInfo = dev.texto_bruto || '';
        return `Apartamento ${dev.tipologia} no Bloco ${dev.bloco}, piso ${dev.piso}:
${dev.content}
Detalhes das áreas: ${areaInfo}`;
      }).join('\n\n') || '';
    } else {
      console.log('Search successful, found', developments?.length, 'records');
      
      // Debug: Log the full structure of the first record
      if (developments && developments.length > 0) {
        console.log('First record structure:', JSON.stringify(developments[0], null, 2));
        console.log('Available flat_ids in search results:', developments.map((dev) => dev.flat_id));
        console.log('Available bloco values:', developments.map((dev) => dev.bloco));
        console.log('Available piso values:', developments.map((dev) => dev.piso));
        console.log('Available tipologia values:', developments.map((dev) => dev.tipologia));
        
        // Debug: Compare with direct table query
        const { data: directQuery } = await supabase
          .from('developments')
          .select('*')
          .limit(1);
        
        if (directQuery && directQuery.length > 0) {
          console.log('Direct query structure:', JSON.stringify(directQuery[0], null, 2));
        }
      }
      
      // Use developments directly since we already filtered in the query
      const filteredDevelopments = developments;
      
      console.log('Using', filteredDevelopments?.length, 'records for context');
      
      if (filteredDevelopments && filteredDevelopments.length > 0) {
        // Build context from search results
        context = filteredDevelopments?.map((dev) => {
          const areaInfo = dev.texto_bruto || '';
          return `Apartamento ${dev.tipologia} no Bloco ${dev.bloco}, piso ${dev.piso}:
${dev.content}
Detalhes das áreas: ${areaInfo}`;
        }).join('\n\n') || '';
      }
    }

    console.log('Context length:', context.length);

    // Format messages for OpenAI API
    const formattedMessages = messages.map((msg: Message) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));
    
    // Generate response using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especializado em imóveis da empresa Viriato.
          Seu objetivo é responder a perguntas sobre nossas propriedades com base no contexto fornecido.
          Se o usuário estiver em uma página de apartamento específica (indicada por um flatId), concentre suas respostas nesse apartamento.
          Seja sempre educado e prestativo. Se você não tiver a resposta no contexto, responda apenas com o texto "[LEAD_FORM]". Não adicione mais nenhum texto.
          Mantenha as respostas concisas e diretas.
          Aqui está o contexto do nosso banco de dados:
          ${context}`,
        },
        ...formattedMessages,
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    const botResponse = response.choices[0].message.content;
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