import * as convApi from '@/db/api/conv';
import { NextResponse } from 'next/server';

// 新增訊息
export async function POST(req: Request, { params }: { params: { convId: string } }) {
  try {
    const body = await req.json();
    const { convId } = await params;
    const { type, role, content } = body;
    const message = await convApi.addConvMessage(
      convId,
      type,
      role,
      content
    );
    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error adding conv message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
