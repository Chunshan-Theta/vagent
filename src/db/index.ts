import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

export interface Tool {
  id: number;
  tool_id: string;
  name: string;
  api_url: string | null;
  api_key: string | null;
  agent_id: string | null;
  session_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function getToolConfig(toolId: string): Promise<Tool | null> {
  const result = await pool.query(
    'SELECT * FROM tools WHERE tool_id = $1',
    [toolId]
  );
  return result.rows[0] || null;
}

export async function updateToolConfig(
  toolId: string, 
  config: Partial<Pick<Tool, 'api_url' | 'api_key' | 'agent_id' | 'session_id'>>
): Promise<Tool> {
  const updates = Object.entries(config)
    .map(([key, _], i) => `${key} = $${i + 2}`)
    .join(', ');
  
  const values = [toolId, ...Object.values(config)];
  const result = await pool.query(
    `UPDATE tools SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE tool_id = $1 RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function createTool(
  toolId: string, 
  name: string, 
  config: Partial<Pick<Tool, 'api_url' | 'api_key' | 'agent_id' | 'session_id'>>
): Promise<Tool> {
  const columns = ['tool_id', 'name', ...Object.keys(config)];
  const values = [toolId, name, ...Object.values(config)];
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  
  const result = await pool.query(
    `INSERT INTO tools (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return result.rows[0];
} 