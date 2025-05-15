CREATE TABLE IF NOT EXISTS tools (
    id SERIAL PRIMARY KEY,
    tool_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    tool_type VARCHAR(50) NOT NULL DEFAULT 'function',
    api_url VARCHAR(255),
    api_key VARCHAR(255),
    agent_id VARCHAR(255),
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tools_tool_id ON tools(tool_id); 