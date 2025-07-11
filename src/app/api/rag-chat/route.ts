import { NextRequest, NextResponse } from 'next/server';
import RagService from '@/lib/ragService';

const ragService = RagService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      context,
      visitorId,
      sessionId,
      conversationHistory,
      ragEnabled = true
    } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Process query through RAG service
    const ragResponse = await ragService.processQuery({
      message,
      context,
      conversationHistory,
      visitorId,
      sessionId,
      ragEnabled,
    });

    return NextResponse.json({
      message: ragResponse.message,
      sources: ragResponse.sources,
      confidence: ragResponse.confidence,
      intent: ragResponse.intent,
      entities: ragResponse.entities,
      navigationCommand: ragResponse.navigationCommand,
      highIntent: ragResponse.highIntent,
    });

  } catch (error) {
    console.error('RAG Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}