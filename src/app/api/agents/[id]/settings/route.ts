import { NextResponse } from 'next/server';

// GET /api/agents/[id]/settings?keys=key1,key2
export async function GET(request: Request, { params:paramsPromise }: AsyncRouteContext<{ id: any }>) {
  const orm = await import('@/db/orm');
  const AgentSettings = orm.models.AgentSettings;
  const url = new URL(request.url);
  const keysParam = url.searchParams.get('keys');
  const keys = keysParam ? keysParam.split(',') : [];
  const params = await paramsPromise;
  if (!params.id || !Array.isArray(keys) || keys.length === 0) {
    return NextResponse.json({ success: false, error: 'Invalid agent id or keys' }, { status: 400 });
  }
  try {
    const rows = await AgentSettings.query()
      .where('agent_id', params.id)
      .whereIn('data_key', keys);
    const values: Record<string, string> = {};
    for (const row of rows) {
      values[row.dataKey] = row.dataVal;
    }
    return NextResponse.json({ success: true, values });
  } catch (error) {
    console.error('Error fetching agent settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
  }
}

// POST /api/agents/[id]/settings
export async function POST(request: Request, { params:paramsPromise }: AsyncRouteContext<{ id: any }>) {
  const orm = await import('@/db/orm');
  const AgentSettings = orm.models.AgentSettings;
  const params = await paramsPromise;
  if (!params.id) {
    return NextResponse.json({ success: false, error: 'Invalid agent id' }, { status: 400 });
  }
  try {
    const { values } = await request.json();
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      return NextResponse.json({ success: false, error: 'Invalid settings format' }, { status: 400 });
    }
    const updates = Object.entries(values);
    if (updates.length === 0) {
      return NextResponse.json({ success: true }, { status: 204 });
    }
    for (const [key, val] of updates) {
      await AgentSettings.query()
        .insert({ agentId: params.id, dataKey: key, dataVal: String(val), updatedAt: new Date().toISOString() })
        .onConflict(['agent_id', 'data_key'])
        .merge({ dataKey: key, dataVal: String(val), updatedAt: new Date().toISOString() });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving agent settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
