import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage, ChatSession, SearchFilters } from '@/lib/rag/types';
import { processQuery, extractFiltersFromQuery } from '@/lib/rag/ragChain';
import { similaritySearch } from '@/lib/rag/vectorStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, chatHistory = [] } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Extract filters from the query
    const filters = extractFiltersFromQuery(message);
    
    // Process the query
    const response = await processQuery(
      message,
      chatHistory as ChatMessage[],
      filters
    );
    
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
    
    return NextResponse.json({
      response,
      relevantProperties,
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST to send chat messages' },
    { status: 200 }
  );
}