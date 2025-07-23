import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/lib/rag/types';
import { processQuery, extractFiltersFromQuery } from '@/lib/rag/ragChain';
import { similaritySearch } from '@/lib/rag/vectorStore';
import {
  addMessageToHistory,
  getRelevantChatHistory,
} from '@/lib/rag/chatHistoryStore';
import { sendGAEvent } from '@/lib/ga-server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, visitorId, sessionId, onboardingAnswers, onboardingComplete } = body;

  if (onboardingComplete) {
    // Save onboarding answers to the visitors table
    try {
      const { error } = await supabaseAdmin
        .from('visitors')
        .upsert({
          visitor_id: visitorId,
          onboarding_answers: onboardingAnswers,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'visitor_id' });
      
      if (error) throw error;
      
      return NextResponse.json({ success: true, message: "Onboarding answers saved." });

    } catch (error) {
      console.error('Error saving onboarding answers:', error);
      return NextResponse.json({ error: 'Failed to save onboarding answers.' }, { status: 500 });
    }
  }

  try {
    let chatHistory: ChatMessage[] = [];

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId is required' }, { status: 400 });
    }

    const currentSessionId = sessionId || uuidv4();

    // Fetch recent chat history from Supabase (short-term memory)
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(10); // Get last 10 messages

    if (error) {
      console.error('Error fetching chat history:', error);
    } else if (data) {
      chatHistory = data.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));
    }

    // Fetch relevant long-term history from Pinecone
    const relevantHistory = await getRelevantChatHistory(message, visitorId, 5);

    // Combine recent and relevant history
    const combinedHistory = [
      ...new Map(
        [...relevantHistory, ...chatHistory].map(item => [item.content, item])
      ).values(),
    ];

    // 1. Save user's message to Supabase
    const userMessage: ChatMessage = { role: 'user', content: message };
    await supabaseAdmin.from('chat_messages').insert({
      visitor_id: visitorId,
      session_id: currentSessionId,
      role: userMessage.role,
      content: userMessage.content,
    });

    // Add user message to Pinecone history
    await addMessageToHistory(userMessage, visitorId, currentSessionId);

    // Process the query to get the chatbot's response
    const response = await processQuery(
      message,
      combinedHistory, // Pass the combined history here
      body.onboardingAnswers || {}
    );

    // 2. Save assistant's response to Supabase
    const assistantMessage: ChatMessage = { role: 'assistant', content: response };
    await supabaseAdmin.from('chat_messages').insert({
      visitor_id: visitorId,
      session_id: currentSessionId,
      role: assistantMessage.role,
      content: assistantMessage.content,
    });

    // Add assistant's message to Pinecone history
    await addMessageToHistory(assistantMessage, visitorId, currentSessionId);
    
    // Get relevant properties for context
    const filters = extractFiltersFromQuery(message);
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
    const { data: sessionData, error: sessionError } = await supabaseAdmin
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
    const { data: messagesData, error: messagesError } = await supabaseAdmin
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