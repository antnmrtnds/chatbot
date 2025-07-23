import { NextRequest, NextResponse } from 'next/server';
import { getEventType } from '@/lib/calendly';

// TODO: Replace this with the actual property-to-agent mapping
const propertyToAgentMapping: { [key: string]: string } = {
  "bloco1_a": "30 Minute Meeting",
  "bloco1_b": "30 Minute Meeting",
  "bloco1_c": "30 Minute Meeting",
  "bloco1_d": "30 Minute Meeting",
  "bloco1_e": "30 Minute Meeting",
  "bloco1_f": "30 Minute Meeting",
  "bloco1_g": "30 Minute Meeting",
  "bloco1_h": "30 Minute Meeting",
  "bloco2_a": "30 Minute Meeting",
  "bloco2_b": "30 Minute Meeting",
  "bloco2_c": "30 Minute Meeting",
  "bloco2_d": "30 Minute Meeting",
  "bloco2_e": "30 Minute Meeting",
  "bloco2_f": "30 Minute Meeting",
  "bloco2_g": "30 Minute Meeting",
  "bloco2_h": "30 Minute Meeting",
  "general_consultation": "30 Minute Meeting",
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { propertyId } = body;

  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
  }

  const eventTypeName = propertyToAgentMapping[propertyId];
  console.log(`[Schedule API] Searching for Calendly event type: '${eventTypeName}' for propertyId: '${propertyId}'`);

  if (!eventTypeName) {
    return NextResponse.json({ error: 'No agent found for this property' }, { status: 404 });
  }

  try {
    const eventType = await getEventType(eventTypeName);
    if (eventType) {
      return NextResponse.json({ schedulingUrl: eventType.scheduling_url });
    } else {
      return NextResponse.json({ error: 'Could not find the specified Calendly event type' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching Calendly event type:', error);
    return NextResponse.json({ error: 'Failed to fetch Calendly event type' }, { status: 500 });
  }
} 