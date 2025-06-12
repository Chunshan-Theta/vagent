-- pg sql

CREATE TABLE IF NOT EXISTS conv (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  uid INT DEFAULT NULL,
  email TEXT DEFAULT NULL,
  uname VARCHAR(64) DEFAULT NULL,
  agent_type VARCHAR(64) NOT NULL DEFAULT '',
  agent_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conv__created_at ON conv(created_at);
CREATE INDEX IF NOT EXISTS idx_conv__email ON conv(email);
CREATE INDEX IF NOT EXISTS idx_conv__uname ON conv(uname);
CREATE INDEX IF NOT EXISTS idx_conv__agent_type ON conv(agent_type);
CREATE INDEX IF NOT EXISTS idx_conv__agent_id ON conv(agent_id);

CREATE TABLE IF NOT EXISTS conv_message (
  id SERIAL PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  conv_id VARCHAR(64) NOT NULL,
  role VARCHAR(24) NOT NULL,
  content TEXT NOT NULL,
  audio_ref VARCHAR(64) DEFAULT NULL, -- 參考 audio.id , 格式: "conv:<audio_id>"
  audio_start_time DECIMAL(10, 2) DEFAULT NULL, -- <開始秒數>
  audio_end_time DECIMAL(10, 2) DEFAULT NULL, -- <開始秒數>
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conv_id) REFERENCES conv(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conv_message__conv_id ON conv_message(conv_id);
CREATE INDEX IF NOT EXISTS idx_conv_message__audio_ref ON conv_message(audio_ref);

CREATE TABLE IF NOT EXISTS conv_analysis (
  conv_id VARCHAR(64) NOT NULL,
  name VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL,
  analysis TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conv_id) REFERENCES conv(id) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (conv_id, name)
);

CREATE INDEX IF NOT EXISTS idx_conv_analysis__conv_id ON conv_analysis(conv_id);
CREATE INDEX IF NOT EXISTS idx_conv_analysis__name ON conv_analysis(name);

CREATE TABLE IF NOT EXISTS conv_audio (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  conv_id VARCHAR(64) NOT NULL,
  name VARCHAR(64) NOT NULL,
  mime VARCHAR(32) NOT NULL,
  duration DECIMAL(10, 2) NOT NULL, -- Duration in seconds
  uri TEXT DEFAULT NULL,
  state VARCHAR(24) NOT NULL DEFAULT 'pending',
  info TEXT DEFAULT NULL, -- 補充資料
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conv_id) REFERENCES conv(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conv_audio__conv_id ON conv_audio(conv_id);
CREATE INDEX IF NOT EXISTS idx_conv_audio__name ON conv_audio(name);
CREATE INDEX IF NOT EXISTS idx_conv_audio__created_at ON conv_audio(created_at);