import { NextRequest, NextResponse } from 'next/server';

// Mock response for now - you'll need to integrate with your actual backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, visitorId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId is required' }, { status: 400 });
    }

    // For now, return a simple response
    // In production, you'll want to integrate with your actual chatbot backend
    const response = `Olá! Recebi a sua mensagem: "${message}". Como posso ajudar a encontrar o seu próximo imóvel?`;

    return NextResponse.json({
      response,
      visitorId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json({ 
      response: 'Desculpe, ocorreu um erro. Tente novamente mais tarde.',
      error: 'An error occurred' 
    }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 