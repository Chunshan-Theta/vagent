import * as convApi from '@/db/api/conv';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: RouteContext<{ convId: string; msgId: string }>) {
  try {
    const body = await req.json();
    const { convId, msgId } = await params;
    const { content } = body;

    const message = await convApi.patchConvMessageContent(
      msgId,
      content
    );
    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error updating conv message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}