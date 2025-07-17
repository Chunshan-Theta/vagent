import { NextResponse } from 'next/server';
import { getPool } from '../db';
import { v4 as uuidv4 } from 'uuid';

const pool = getPool();

// GET /api/test_case - List all test cases with optional agent_id filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const isActive = searchParams.get('is_active');

    let query = 'SELECT * FROM test_cases';
    const params: any[] = [];
    let paramIndex = 1;

    if (agentId || isActive !== null) {
      query += ' WHERE';
      
      if (agentId) {
        query += ` agent_id = $${paramIndex}`;
        params.push(agentId);
        paramIndex++;
      }
      
      if (isActive !== null) {
        if (agentId) query += ' AND';
        query += ` is_active = $${paramIndex}`;
        params.push(isActive === 'true');
        paramIndex++;
      }
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return NextResponse.json({ success: true, testCases: result.rows });
  } catch (error) {
    console.error('Error fetching test cases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test cases' },
      { status: 500 }
    );
  }
}

// POST /api/test_case - Create a new test case
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      agent_id,
      name,
      input_text,
      comparison_method = 'contains',
      expected_parameters = [],
      is_active = true,
    } = data;

    // Validation
    if (!agent_id || !name || !input_text) {
      return NextResponse.json(
        { success: false, error: 'agent_id, name, and input_text are required' },
        { status: 400 }
      );
    }

    if (!['contains', 'similar'].includes(comparison_method)) {
      return NextResponse.json(
        { success: false, error: 'comparison_method must be either "contains" or "similar"' },
        { status: 400 }
      );
    }

    // Verify agent exists
    const agentCheck = await pool.query('SELECT id FROM agents WHERE id = $1', [agent_id]);
    if (agentCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `INSERT INTO test_cases (
        agent_id, name, input_text, comparison_method, expected_parameters, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        agent_id,
        name,
        input_text,
        comparison_method,
        expected_parameters,
        is_active,
      ]
    );

    return NextResponse.json({ success: true, testCase: result.rows[0] });
  } catch (error) {
    console.error('Error creating test case:', error);
    return NextResponse.json(
      { success: false, error: `Failed to create test case: ${error}` },
      { status: 500 }
    );
  }
} 