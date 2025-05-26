import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
} 