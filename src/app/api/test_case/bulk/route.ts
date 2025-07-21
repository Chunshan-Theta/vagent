import { NextResponse } from 'next/server';
import { getPool } from '../../db';

const pool = getPool();

// POST /api/test_case/bulk - Create multiple test cases
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { testCases } = data;

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json(
        { success: false, error: 'testCases must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate all test cases
    for (const testCase of testCases) {
      const { agent_id, name, input_text, comparison_method = 'contains' } = testCase;
      
      if (!agent_id || !name || !input_text) {
        return NextResponse.json(
          { success: false, error: 'Each test case must have agent_id, name, and input_text' },
          { status: 400 }
        );
      }

      if (!['contains', 'similar'].includes(comparison_method)) {
        return NextResponse.json(
          { success: false, error: 'comparison_method must be either "contains" or "similar"' },
          { status: 400 }
        );
      }
    }

    // Verify all agents exist
    const agentIds = [...new Set(testCases.map(tc => tc.agent_id))];
    const agentCheck = await pool.query(
      'SELECT id FROM agents WHERE id = ANY($1)',
      [agentIds]
    );

    if (agentCheck.rows.length !== agentIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more agents not found' },
        { status: 404 }
      );
    }

    // Insert all test cases
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertedTestCases = [];
      for (const testCase of testCases) {
        const {
          agent_id,
          name,
          input_text,
          comparison_method = 'contains',
          expected_parameters = [],
          is_active = true,
        } = testCase;

        const result = await client.query(
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

        insertedTestCases.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, testCases: insertedTestCases });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating test cases:', error);
    return NextResponse.json(
      { success: false, error: `Failed to create test cases: ${error}` },
      { status: 500 }
    );
  }
}

// PUT /api/test_case/bulk - Update multiple test cases
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { updates } = data;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'updates must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate all updates
    for (const update of updates) {
      const { id, ...fields } = update;
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Each update must have an id' },
          { status: 400 }
        );
      }

      if (fields.comparison_method && !['contains', 'similar'].includes(fields.comparison_method)) {
        return NextResponse.json(
          { success: false, error: 'comparison_method must be either "contains" or "similar"' },
          { status: 400 }
        );
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updatedTestCases = [];
      for (const update of updates) {
        const { id, ...fields } = update;

        // Check if test case exists
        const existingResult = await client.query(
          'SELECT id FROM test_cases WHERE id = $1',
          [id]
        );

        if (existingResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { success: false, error: `Test case with id ${id} not found` },
            { status: 404 }
          );
        }

        // Build update query dynamically
        const updateFields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(fields).forEach(([key, value]) => {
          if (value !== undefined && key !== 'updated_at') { // Skip updated_at from input
            updateFields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        });

        if (updateFields.length === 0) {
          continue; // Skip if no fields to update
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const query = `
          UPDATE test_cases 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = await client.query(query, values);
        updatedTestCases.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, testCases: updatedTestCases });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating test cases:', error);
    return NextResponse.json(
      { success: false, error: `Failed to update test cases: ${error}` },
      { status: 500 }
    );
  }
}

// DELETE /api/test_case/bulk - Delete multiple test cases
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json(
        { success: false, error: 'ids parameter is required' },
        { status: 400 }
      );
    }

    const idArray = ids.split(',').map(id => id.trim()).filter(id => id);
    
    if (idArray.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one valid id is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM test_cases WHERE id = ANY($1) RETURNING *',
      [idArray]
    );

    return NextResponse.json({ success: true, testCases: result.rows });
  } catch (error) {
    console.error('Error deleting test cases:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete test cases: ${error}` },
      { status: 500 }
    );
  }
} 