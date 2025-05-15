
import { config } from './db.config';
import { Pool } from 'pg';

const pool = new Pool(config);

export function getPool(){
  return pool;
}