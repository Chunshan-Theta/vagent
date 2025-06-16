import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from 'crypto';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
if (!genAI) {
  throw new Error('Google Generative AI is not initialized');
}

// Simple in-memory cache
const emotionCache = new Map<string, any>();

// Cache settings
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_SIZE = 100;

function createCacheKey(buffer: Buffer, mimeType: string): string {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return `${hash}-${mimeType}`;
}

function cleanupCache() {
  if (emotionCache.size > MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(emotionCache.keys()).slice(0, emotionCache.size - MAX_CACHE_SIZE);
    keysToDelete.forEach(key => emotionCache.delete(key));
  }
}

export async function analyzeAudioEmotion(buffer: Buffer, mimeType: string) {
  // Check cache first
  const cacheKey = createCacheKey(buffer, mimeType);
  const cached = emotionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Cache hit for audio emotion analysis');
    return cached.data;
  }

  const prompt = `Please transcribe the audio and label the emotion of each sentence. label the emotion example: [Emotion: Aggressive, Friendly]`;

  // Initialize the model with generation config
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,  // 降低溫度使輸出更穩定
      maxOutputTokens: 2048,
    }
  });

  // Create audio part
  const audioPart = {
    data: buffer.toString('base64'),
    mimeType: mimeType
  };

  // Generate content
  const result = await model.generateContent([
    { text: prompt },
    { inlineData: audioPart }
  ]);

  const response = await result.response;
  const text = response.text();

  // Split the text into lines and process each line
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  const emotions = [];
  let currentEmotion = '';
  
  for (const line of lines) {
    // Check if this line contains an emotion tag
    const emotionMatch = line.match(/\((.*?)\)|\[Emotion:\s*(.*?)\]/);
    
    if (emotionMatch) {
      // This is an emotion line or line with emotion tag
      const emotion = (emotionMatch[1] || emotionMatch[2]).trim();
      const sentence = line.replace(/\s*\([^)]*\)|\s*\[Emotion:[^\]]*\]/, '').trim();
      
      if (sentence) {
        // Emotion tag is in the same line as the sentence
        emotions.push({
          sentence,
          emotion
        });
      } else {
        // Standalone emotion tag
        currentEmotion = emotion;
      }
    } else {
      // This is a sentence line
      if (currentEmotion) {
        emotions.push({
          sentence: line,
          emotion: currentEmotion
        });
        currentEmotion = '';
      } else {
        emotions.push({
          sentence: line,
          emotion: '未標記'  // or any default emotion you want to use
        });
      }
    }
  }

  // Combine all sentences for transcription
  const transcriptionSection = emotions
    .map(e => e.sentence)
    .join('\n');

  const resultData = {
    result: text,
    analysis: {
      transcription: transcriptionSection,
      emotions,
    }
  };

  // Cache the result
  emotionCache.set(cacheKey, {
    data: resultData,
    timestamp: Date.now()
  });
  
  // Cleanup cache if needed
  cleanupCache();
  
  console.log('Cache miss - stored new result for audio emotion analysis');
  return resultData;
}

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