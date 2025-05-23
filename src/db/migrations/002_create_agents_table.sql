CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    public_description TEXT NOT NULL,
    prompt_name TEXT NOT NULL,
    prompt_personas TEXT NOT NULL,
    prompt_customers TEXT NOT NULL,
    prompt_tool_logics TEXT NOT NULL,
    prompt_voice_styles TEXT,
    prompt_conversation_modes TEXT,
    prompt_prohibited_phrases TEXT,
    criteria TEXT,
    tools JSONB[] DEFAULT '{}',
    voice VARCHAR(255) DEFAULT 'echo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agents_name ON agents(name); 