import { NextRequest, NextResponse } from 'next/server';
import { analyzeAudioEmotion } from '@/lib/audio-emotion-analyzer';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audioFile') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await analyzeAudioEmotion(buffer, "audio/mpeg");

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in Gemini API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process with Gemini' },
      { status: 500 }
    );
  }
} 