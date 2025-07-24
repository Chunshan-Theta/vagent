import * as convApi from '@/db/api/conv';
import { NextResponse } from 'next/server';

// 新增訊息
export async function GET(req: Request, { params }: AsyncRouteContext<{ convId: string }>) {
  try {
    const { convId } = await params;
    const [conv] = await convApi.searchConv({
      ids: [convId],
    });
    if (!conv) {
      return NextResponse.json({ error: 'Conv not found' }, { status: 404 });
    }
    return NextResponse.json(conv);
  } catch (error: any) {
    console.error('Error adding conv message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
