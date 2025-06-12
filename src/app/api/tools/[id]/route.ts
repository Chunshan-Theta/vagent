import { NextResponse } from 'next/server';
import { getPool } from '../../db';

const pool = getPool();

export async function GET(
  request: Request,
  { params:paramsPromise }: AsyncRouteContext<any>
) {
  const params = await paramsPromise;
  try {
    const result = await pool.query('SELECT * FROM tools WHERE tool_id = $1', [params.id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tool: result.rows[0] });
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tool' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params:paramsPromise }: AsyncRouteContext<any>
) {
  const params = await paramsPromise;
  try {
    const { name, tool_type, api_url, api_key, agent_id, session_id } = await request.json();

    if (!name || !tool_type) {
      return NextResponse.json(
        { success: false, error: 'Name and tool type are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE tools 
       SET name = $1, tool_type = $2, api_url = $3, api_key = $4, 
           agent_id = $5, session_id = $6, updated_at = CURRENT_TIMESTAMP
       WHERE tool_id = $7
       RETURNING *`,
      [name, tool_type, api_url, api_key, agent_id, session_id, params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tool: result.rows[0] });
  } catch (error) {
    console.error('Error updating tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tool' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params:paramsPromise }: AsyncRouteContext<any>
) {
  const params = await paramsPromise;
  try {
    const result = await pool.query(
      'DELETE FROM tools WHERE tool_id = $1 RETURNING *',
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tool: result.rows[0] });
  } catch (error) {
    console.error('Error deleting tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tool' },
      { status: 500 }
    );
  }
} 