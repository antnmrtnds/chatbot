import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/lib/rag/types';
import { processQuery, extractFiltersFromQuery } from '@/lib/rag/ragChain';
import { similaritySearch } from '@/lib/rag/vectorStore';
import { sendGAEvent } from '@/lib/ga-server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { message, chatHistory = [], visitorId, sessionId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId is required' }, { status: 400 });
    }

    const currentSessionId = sessionId || uuidv4();

    // If there is a sessionId, fetch the chat history from the database
    if (sessionId) {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
        // Continue with history from request body or empty on error
      } else {
        chatHistory = data.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }));
      }
    }

    // 1. Save user's message
    await supabase.from('chat_messages').insert({
      visitor_id: visitorId,
      session_id: currentSessionId,
      role: 'user',
      content: message,
    });

    // Process the query to get the chatbot's response
    const filters = extractFiltersFromQuery(message);
    const response = await processQuery(
      message,
      chatHistory, // Pass the chat history here
      filters
    );

    // 2. Save assistant's response
    await supabase.from('chat_messages').insert({
      visitor_id: visitorId,
      session_id: currentSessionId,
      role: 'assistant',
      content: response,
    });
    
    // Get relevant properties for context
    const searchResults = await similaritySearch(message, filters, 5);
    const relevantProperties = searchResults.map(result => ({
      id: result.id,
      content: result.content,
      flat_id: result.metadata.flat_id,
      price: result.metadata.price,
      location: result.metadata.location,
      typology: result.metadata.typology,
      bedrooms: result.metadata.bedrooms,
      floor_level: result.metadata.floor_level,
      outdoor_space: result.metadata.outdoor_space,
      outdoor_area_sqm: result.metadata.outdoor_area_sqm,
      position: result.metadata.position,
      parking: result.metadata.parking,
    }));
    
    // Legacy GA event (can be removed if you prefer the new system)
    sendGAEvent(
      {
        name: 'property_inquiry',
        params: {
          user_message: message,
          property_ids: relevantProperties.map(p => p.flat_id).join(','),
        },
      },
      visitorId
    );
    
    return NextResponse.json({
      response,
      relevantProperties,
      sessionId: currentSessionId, // Send back the session ID
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const visitorId = request.nextUrl.searchParams.get('visitorId');

  if (!visitorId) {
    return NextResponse.json({ error: 'visitorId is required' }, { status: 400 });
  }

  try {
    // Find the most recent session for the visitor
    const { data: sessionData, error: sessionError } = await supabase
      .from('chat_messages')
      .select('session_id')
      .eq('visitor_id', visitorId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError || !sessionData || sessionData.length === 0) {
      console.log(`No chat history found for visitor: ${visitorId}`);
      return NextResponse.json({ messages: [] }, { status: 200 });
    }

    const sessionId = sessionData[0].session_id;

    // Fetch all messages for that session
    const { data: messagesData, error: messagesError } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching chat history:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }

    console.log(`Fetched ${messagesData.length} messages for visitor ${visitorId} in session ${sessionId}`);

    return NextResponse.json(
      { messages: messagesData, sessionId },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}