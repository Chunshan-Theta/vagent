
CREATE TABLE IF NOT EXISTS key_quota (
  "group" VARCHAR(64) NOT NULL,
  "key" TEXT NOT NULL,
  usage BIGINT NOT NULL DEFAULT 0,
  quota BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("group", "key")
);

CREATE INDEX IF NOT EXISTS idx_key_quota__group ON key_quota("group");
CREATE INDEX IF NOT EXISTS idx_key_quota__key ON key_quota("key");