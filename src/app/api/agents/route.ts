import { NextResponse } from 'next/server';
import { getPool } from '../db';

const pool = getPool();

// GET /api/agents - List all agents
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM agents ORDER BY created_at DESC');
    return NextResponse.json({ success: true, agents: result.rows });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: Request) {
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
      tools,
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
      `INSERT INTO agents (
        name, public_description, prompt_name, prompt_personas,
        prompt_customers, prompt_tool_logics, prompt_voice_styles,
        prompt_conversation_modes, prompt_prohibited_phrases, tools
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        tools || [],
      ]
    );

    return NextResponse.json({ success: true, agent: result.rows[0] });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { success: false, error: `Failed to create agent: ${error}` },
      { status: 500 }
    );
  }
} 