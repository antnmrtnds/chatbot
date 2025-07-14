import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const visitorId = searchParams.get('visitorId');

  if (!visitorId) {
    return NextResponse.json({ error: 'visitorId is required' }, { status: 400 });
  }

  try {
    // Step 1: Find the most recent session_id for the given visitor_id
    const { data: recentSession, error: sessionError } = await supabase
      .from('chat_messages')
      .select('session_id')
      .eq('visitor_id', visitorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !recentSession) {
      // No history found, which is not an error
      return NextResponse.json({ messages: [] }, { status: 200 });
    }

    const { session_id } = recentSession;

    // Step 2: Fetch all messages for that session_id
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching chat history:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }

    return NextResponse.json({ messages, sessionId: session_id }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error fetching chat history:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 