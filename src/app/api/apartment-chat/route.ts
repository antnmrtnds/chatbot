import { NextRequest, NextResponse } from 'next/server';

// Simplified apartment chat API
export async function POST(request: NextRequest) {
  try {
    const { message, apartmentId } = await request.json();

    if (!message || !apartmentId) {
      return NextResponse.json(
        { error: 'Message and apartment ID are required' },
        { status: 400 }
      );
    }

    // Create apartment-specific context
    const apartmentContext = {
      apartmentId,
      query: message,
      pageType: 'apartment',
      propertyId: apartmentId,
    };

    // Call simplified RAG service for apartment queries
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/rag-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context: apartmentContext,
        ragEnabled: true,
        apartmentSpecific: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get RAG response');
    }

    const data = await response.json();

    return NextResponse.json({
      message: data.message,
      apartmentId,
    });

  } catch (error) {
    console.error('Error in apartment chat API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process apartment chat request',
        message: 'Desculpe, ocorreu um erro. Por favor, tente novamente.'
      },
      { status: 500 }
    );
  }
}