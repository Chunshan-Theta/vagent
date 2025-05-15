import type { Pool } from 'pg';

// Pool is class
type PoolConfig = ConstructorParameters<typeof Pool>[0];

export const config: NonNullable<PoolConfig> = {
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB
};