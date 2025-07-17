import { NextResponse } from 'next/server';
import { getPool } from '../../db';

const pool = getPool();

// GET /api/test_case/[id] - Get a specific test case
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await pool.query(
      'SELECT * FROM test_cases WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Test case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, testCase: result.rows[0] });
  } catch (error) {
    console.error('Error fetching test case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test case' },
      { status: 500 }
    );
  }
}

// PUT /api/test_case/[id] - Update a test case
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    const {
      name,
      input_text,
      comparison_method,
      expected_parameters,
      is_active,
    } = data;

    // Check if test case exists
    const existingResult = await pool.query(
      'SELECT id FROM test_cases WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Test case not found' },
        { status: 404 }
      );
    }

    // Validation
    if (comparison_method && !['contains', 'similar'].includes(comparison_method)) {
      return NextResponse.json(
        { success: false, error: 'comparison_method must be either "contains" or "similar"' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (input_text !== undefined) {
      updateFields.push(`input_text = $${paramIndex}`);
      values.push(input_text);
      paramIndex++;
    }

    if (comparison_method !== undefined) {
      updateFields.push(`comparison_method = $${paramIndex}`);
      values.push(comparison_method);
      paramIndex++;
    }

    if (expected_parameters !== undefined) {
      updateFields.push(`expected_parameters = $${paramIndex}`);
      values.push(expected_parameters);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE test_cases 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    return NextResponse.json({ success: true, testCase: result.rows[0] });
  } catch (error) {
    console.error('Error updating test case:', error);
    return NextResponse.json(
      { success: false, error: `Failed to update test case: ${error}` },
      { status: 500 }
    );
  }
}

// DELETE /api/test_case/[id] - Delete a test case
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if test case exists
    const existingResult = await pool.query(
      'SELECT id FROM test_cases WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Test case not found' },
        { status: 404 }
      );
    }

    const result = await pool.query(
      'DELETE FROM test_cases WHERE id = $1 RETURNING *',
      [id]
    );

    return NextResponse.json({ success: true, testCase: result.rows[0] });
  } catch (error) {
    console.error('Error deleting test case:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete test case: ${error}` },
      { status: 500 }
    );
  }
} 