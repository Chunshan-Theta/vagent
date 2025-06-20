import { NextRequest, NextResponse } from 'next/server';
import * as keyQuotaDb from '@/db/api/key_quota';

// POST /api/key_quota?group=...&key=...
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const group = searchParams.get('group');
  const key = searchParams.get('key');
  const { quota } = await req.json();
  if (!group || !key || typeof quota !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const result = await keyQuotaDb.createKeyQuota(group, key, quota);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/key_quota?group=...&key=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const group = searchParams.get('group');
  const key = searchParams.get('key');
  if (!group || !key) {
    return NextResponse.json({ error: 'Missing group or key' }, { status: 400 });
  }
  try {
    const result = await keyQuotaDb.getKeyQuota(group, key);
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/key_quota?group=...&key=...
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const group = searchParams.get('group');
  const key = searchParams.get('key');
  const { patch } = await req.json();
  if (!group || !key || !patch) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const result = await keyQuotaDb.updateKeyQuota(group, key, patch);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
