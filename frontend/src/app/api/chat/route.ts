import { type NextRequest, NextResponse } from "next/server";
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define Message type for the new history functionality
type Message = {
  text: string;
  sender: 'user' | 'bot';
};

export async function POST(request: NextRequest) {
  try {
    const { messages, flatId } = await request.json();

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


    // Generate embedding for the user's message
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: currentMessage,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Get developments from database - simple query for now
    let query = supabase
      .from('developments')
      .select('*');
    
    // If flatId is provided, filter by it first
    if (flatId) {
      query = query.eq('flat_id', flatId);
    }
    
    const { data: developments, error: searchError } = await query.limit(5);

    let context = '';

    if (searchError) {
      console.error('Supabase search error:', searchError);
      
      // Fallback: try to get developments directly, filtering by flatId if provided
      let fallbackData: any[] | null = null;
      let fallbackError: any = null;
      
      if (flatId) {
        // Try exact flat_id match first
        const { data: exactMatch, error: exactError } = await supabase
          .from('developments')
          .select('*')
          .eq('flat_id', flatId);
        
        if (exactMatch && exactMatch.length > 0) {
          fallbackData = exactMatch;
          fallbackError = exactError;
          console.log('Found exact flat_id match:', flatId, '- records found:', exactMatch.length);
        } else {
          // Try bloco and piso combination
          if (flatId.includes('_')) {
            const [bloco, piso] = flatId.split('_');
            const { data: blocoPisoMatch, error: blocoPisoError } = await supabase
              .from('developments')
              .select('*')
              .ilike('bloco', bloco)
              .eq('piso', piso);
            
            if (blocoPisoMatch && blocoPisoMatch.length > 0) {
              fallbackData = blocoPisoMatch;
              fallbackError = blocoPisoError;
              console.log('Found bloco/piso match:', bloco, piso, '- records found:', blocoPisoMatch.length);
            }
          }
        }
      } else {
        const { data: allData, error: allError } = await supabase
          .from('developments')
          .select('*')
          .limit(10);
        
        fallbackData = allData;
        fallbackError = allError;
      }
      
      if (fallbackError) {
        console.error('Fallback query error:', fallbackError);
        return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
      }
      
      console.log('Using fallback data, found', fallbackData?.length, 'records');
      
      // Debug: Show all available flat_id values in fallback data
      if (fallbackData && fallbackData.length > 0) {
        console.log('Available flat_ids in fallback data:', fallbackData.map((dev: any) => dev.flat_id));
        console.log('Available bloco/piso combinations:', fallbackData.map((dev: any) => `${dev.bloco}_${dev.piso}`));
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
        console.log('Available flat_ids in search results:', developments.map((dev: any) => dev.flat_id));
        console.log('Available bloco values:', developments.map((dev: any) => dev.bloco));
        console.log('Available piso values:', developments.map((dev: any) => dev.piso));
        console.log('Available tipologia values:', developments.map((dev: any) => dev.tipologia));
        
        // Debug: Compare with direct table query
        const { data: directQuery, error: directError } = await supabase
          .from('developments')
          .select('*')
          .limit(1);
        
        if (directQuery && directQuery.length > 0) {
          console.log('Direct query structure:', JSON.stringify(directQuery[0], null, 2));
        }
      }
      
      // Use developments directly since we already filtered in the query
      let filteredDevelopments = developments;
      
      console.log('Using', filteredDevelopments?.length, 'records for context');
      
      if (filteredDevelopments && filteredDevelopments.length > 0) {
        // Build context from search results
        context = filteredDevelopments?.map((dev: any) => {
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
    
    return NextResponse.json({ response: botResponse });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}