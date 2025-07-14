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
    const { message, chatHistory = [], visitorId, sessionId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId is required' }, { status: 400 });
    }

    const currentSessionId = sessionId || uuidv4();

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

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST to send chat messages' },
    { status: 200 }
  );
}