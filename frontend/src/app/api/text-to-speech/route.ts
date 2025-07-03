import { type NextRequest, NextResponse } from "next/server";
import ElevenLabs from "elevenlabs-node";

const elevenlabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Replace with your desired voice ID

    const audioStream = await elevenlabs.textToSpeechStream({
      textInput: text,
      voiceId,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    });

    return new NextResponse(audioStream, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("ElevenLabs API error:", error);
    return NextResponse.json(
      { error: "Failed to synthesize speech" },
      { status: 500 }
    );
  }
} 