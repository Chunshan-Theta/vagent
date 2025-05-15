import { NextResponse } from 'next/server';
import { getPool } from '../db';

const pool = getPool();

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM tools ORDER BY created_at DESC');
    return NextResponse.json({ success: true, tools: result.rows });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, tool_type, api_url, api_key, agent_id, session_id } = await request.json();

    if (!name || !tool_type) {
      return NextResponse.json(
        { success: false, error: 'Name and tool type are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO tools (tool_id, name, tool_type, api_url, api_key, agent_id, session_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, tool_type, api_url, api_key, agent_id, session_id]
    );

    return NextResponse.json({ success: true, tool: result.rows[0] });
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tool' },
      { status: 500 }
    );
  }
} 