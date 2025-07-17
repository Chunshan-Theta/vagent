-- pg sql

CREATE TABLE IF NOT EXISTS test_cases (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  input_text TEXT NOT NULL,
  comparison_method VARCHAR(20) NOT NULL DEFAULT 'contains' CHECK (comparison_method IN ('contains', 'similar')),
  expected_parameters TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_test_cases__agent_id ON test_cases(agent_id);
CREATE INDEX IF NOT EXISTS idx_test_cases__is_active ON test_cases(is_active);
CREATE INDEX IF NOT EXISTS idx_test_cases__created_at ON test_cases(created_at); 