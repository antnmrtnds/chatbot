import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: { visitorId: string } }
) {
  const { visitorId } = params;

  if (!visitorId) {
    return NextResponse.json({ error: 'Visitor ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('visitors')
      .select('onboarding_answers')
      .eq('visitor_id', visitorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error for "No rows found"
        return NextResponse.json({ onboarding_answers: null }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ onboarding_answers: data.onboarding_answers });

  } catch (error: any) {
    console.error('Error fetching visitor data:', error);
    return NextResponse.json({ error: 'An error occurred while fetching visitor data.' }, { status: 500 });
  }
} 