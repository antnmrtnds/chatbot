import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// It's recommended to use environment variables for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, eventName, details, path } = body;

    if (!visitorId || !eventName) {
      return NextResponse.json(
        { error: 'Missing required fields: visitorId and eventName' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('interactions').insert({
      visitor_id: visitorId,
      event_name: eventName,
      details,
      path,
    });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to record interaction', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error processing tracking request:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
} 