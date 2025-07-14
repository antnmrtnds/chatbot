import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs-node';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const audioStream = await elevenlabs.generate({
      voice: 'Rachel',
      text,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
    });
    
    // The stream is a Node.js Readable stream. We need to convert it to a Web Stream.
    const webStream = new ReadableStream({
      start(controller) {
        audioStream.on('data', (chunk: Buffer) => {
          controller.enqueue(chunk);
        });
        audioStream.on('end', () => {
          controller.close();
        });
        audioStream.on('error', (error: Error) => {
          controller.error(error);
        });
      },
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error('Error generating TTS audio:', error);
    return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 });
  }
} 