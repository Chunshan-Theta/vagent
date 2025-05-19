INSERT INTO tools (
  tool_id,
  name,
  tool_type,
  api_url,
  api_key,
  agent_id,
  session_id,
  created_at,
  updated_at
) VALUES (
  1,    
  'Land Bank Sales RAG',
  'function',
  'https://api.vagent.ai/v1/rag/landbank',
  'sk_lb_rag_2025',
  'agent_001',
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
); 