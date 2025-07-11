import { NextRequest, NextResponse } from 'next/server';
import RagService from '@/lib/ragService';
import { memoryService } from '@/lib/memoryService';

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

    // Get or create conversation context
    let conversationContext = null;
    if (sessionId && visitorId) {
      try {
        conversationContext = await memoryService.getConversationContext(sessionId, visitorId);
      } catch (error) {
        console.warn('Memory service not available, continuing without session:', error);
      }
    }

    // Add user message to conversation if memory service is available
    if (conversationContext) {
      try {
        memoryService.updateConversationContext(sessionId, {
          text: message,
          sender: 'user',
        });
      } catch (error) {
        console.warn('Failed to add message to memory service:', error);
      }
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

    // Add AI response to conversation if memory service is available
    if (conversationContext) {
      try {
        memoryService.updateConversationContext(sessionId, {
          text: ragResponse.message,
          sender: 'bot',
        });
      } catch (error) {
        console.warn('Failed to update memory service:', error);
      }
    }

    // Track property interaction if discussing specific property
    if (context?.propertyId && conversationContext) {
      try {
        await memoryService.addPropertyInteraction(visitorId, {
          propertyId: context.propertyId,
          interactionType: 'inquiry',
          details: {
            intent: ragResponse.intent,
            entities: ragResponse.entities,
            message: message,
            ragSources: ragResponse.sources,
            confidence: ragResponse.confidence,
          },
        });
      } catch (error) {
        console.warn('Failed to track property interaction:', error);
      }
    }

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