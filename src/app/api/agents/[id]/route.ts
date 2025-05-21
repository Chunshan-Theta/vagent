import { NextResponse } from 'next/server';
import { getPool } from '../../db';

const pool = getPool();

// GET /api/agents/:id - Get a single agent
export async function GET(
  request: Request,
  { params }: { params: any }
) {
  try {
    const result = await pool.query('SELECT * FROM agents WHERE id = $1', [params.id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, agent: result.rows[0] });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch agent: ${error}` },
      { status: 500 }
    );
  }
}

// PUT /api/agents/:id - Update an agent
export async function PUT(
  request: Request,
  { params }: { params: any }
) {
  try {
    const data = await request.json();
    const {
      name,
      public_description,
      prompt_name,
      prompt_personas,
      prompt_customers,
      prompt_tool_logics,
      prompt_voice_styles,
      prompt_conversation_modes,
      prompt_prohibited_phrases,
      criteria,
      tools,
      voice,
    } = data;

    // Validate tools format
    if (tools && !Array.isArray(tools)) {
      return NextResponse.json(
        { success: false, error: 'Tools must be an array' },
        { status: 400 }
      );
    }

    if (tools && tools.some((tool: { name: string; description: string; id: string }) => !tool.name || !tool.description || !tool.id)) {
      return NextResponse.json(
        { success: false, error: 'Each tool must have name, description, and id' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE agents 
       SET name = $1, public_description = $2, prompt_name = $3,
           prompt_personas = $4, prompt_customers = $5, prompt_tool_logics = $6,
           prompt_voice_styles = $7, prompt_conversation_modes = $8,
           prompt_prohibited_phrases = $9, criteria = $10, tools = $11, voice = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        name,
        public_description,
        prompt_name,
        prompt_personas,
        prompt_customers,
        prompt_tool_logics,
        prompt_voice_styles,
        prompt_conversation_modes,
        prompt_prohibited_phrases,
        criteria,
        tools || [],
        voice || 'echo',
        params.id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, agent: result.rows[0] });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/:id - Delete an agent
export async function DELETE(
  request: Request,
  { params }: { params: any }
) {
  try {
    const result = await pool.query(
      'DELETE FROM agents WHERE id = $1 RETURNING *',
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
} 