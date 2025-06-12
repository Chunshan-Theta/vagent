-- pg sql

CREATE TABLE IF NOT EXISTS agents_settings (
  agent_id VARCHAR(64) NOT NULL,
  data_key VARCHAR(128) NOT NULL,
  data_val TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (agent_id, data_key),
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agents_settings__agent_id ON agents_settings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_settings__data_key ON agents_settings(data_key);