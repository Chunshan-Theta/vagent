import * as convApi from '@/db/api/conv';
import { NextResponse } from 'next/server';

// 新增訊息
export async function POST(req: Request, { params }: AsyncRouteContext<{ convId: string }>) {
  try {
    const body = await req.json();
    const { convId } = await params;
    const { type, role, content, audioRef, audioStartTime } = body;
    const message = await convApi.addConvMessage({
      convId,
      type,
      role,
      audioRef,
      audioStartTime,
      content
    });
    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error adding conv message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: AsyncRouteContext<{ convId: string }>) {
  try {
    const { convId } = await params;
    const messages = await convApi.getConvMessages(convId);
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Error fetching conv messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}