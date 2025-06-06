import { Model, raw }  from 'objection'
import Knex from 'knex';

import * as models from './models';

export const knex = Knex({
  client: 'pg',
  connection: {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  pool: {
    min: 1,
    max: 3,
  },
});
Model.knex(knex);

export const fn = {
  now: knex.fn.now.bind(knex.fn),
}


export function getKnex(){
  return knex
}


export {
  raw,
  models
}