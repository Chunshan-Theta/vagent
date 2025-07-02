import * as convApi from '@/db/api/conv';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentType = searchParams.get('agentType') || undefined;
    const agentId = searchParams.get('agentId') || undefined;
    const convIds = searchParams.getAll('convId') || [];

    const opts: any = {};
    if (agentType) opts.agentType = agentType;
    if (agentId) opts.agentIds = [agentId];
    if (Array.isArray(convIds) && convIds.length > 0) opts.convIds = convIds;

    // 呼叫 db/api/conv 的 searchConvLogs
    const result = await convApi.searchConvLogs(opts);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error searching conv logs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
