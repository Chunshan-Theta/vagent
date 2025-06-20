import { NextRequest, NextResponse } from 'next/server';
import * as keyQuota from '@/db/api/key_quota';

// POST /api/key_quota/use?group=...&key=...
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const group = searchParams.get('group');
  const key = searchParams.get('key');
  const { usage } = await req.json();
  if (!group || !key || typeof usage !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    if(usage <= 0) {
      return NextResponse.json({ error: 'Usage must be a positive number' }, { status: 400 });
    }
    const result = await keyQuota.increaseKeyQuotaUsage(group, key, usage);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

