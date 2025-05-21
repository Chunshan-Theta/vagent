import { NextResponse } from 'next/server';
import { chatCompletion, AskRequest } from '@/app/s-lib/ai-analysis'


export async function POST(request: Request) {
  try {
    const body: AskRequest = await request.json();
    return NextResponse.json(await chatCompletion(body));
  } catch (error) {
    console.error('Error analyzing conversation:', error);
    return NextResponse.json(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    );
  }
} 