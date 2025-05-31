import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import redis from '@/lib/redis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CACHE_TTL = 60 * 60 * 24; // 24 hours

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = `translate:${targetLang}:${text}`;

    // Try to get from cache
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json({ translatedText: cachedResult, info: "from cache" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a Translate API, translate the following text to ${targetLang}. Keep the formatting and structure intact. Only output the translated text, nothing else.`
        },
        {
          role: "user",
          content: `Translate the all of following text, keep the formatting and structure intact: \n\n${text}`
        }
      ],
      temperature: 0.3,
    });

    const translatedText = completion.choices[0].message.content || text;

    // Cache the result
    await redis.setex(cacheKey, CACHE_TTL, translatedText);

    return NextResponse.json({ translatedText, info: "from openai" });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
} 