const ElevenLabs = require("elevenlabs-node");
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text) {
    return new NextResponse("Missing text", { status: 400 });
  }

  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
  if (!elevenLabsApiKey) {
    return new NextResponse("Missing ElevenLabs API key", { status: 500 });
  }

  const elevenlabs = new ElevenLabs({
    apiKey: elevenLabsApiKey,
  });

  try {
    const response = await elevenlabs.textToSpeechStream({
      textInput: text,
      voiceId: "21m00Tcm4TlvDq8ikWAM",
      modelId: "eleven_multilingual_v2",
    });

    return new NextResponse(response, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("ElevenLabs API error:", error);
    return new NextResponse("Error from ElevenLabs API", { status: 500 });
  }
} 