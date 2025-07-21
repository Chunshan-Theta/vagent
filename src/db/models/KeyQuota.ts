import { Model, snakeCaseMappers } from 'objection';

export class KeyQuota extends Model {
  static tableName = 'key_quota';

  group!: string;
  key!: string;
  usage!: string;
  quota!: string;
  createdAt?: string;
  updatedAt?: string;

  static get idColumn() {
    return ['group', 'key'];
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['group', 'key', 'usage', 'quota'],
      properties: {
        group: { type: 'string', maxLength: 64 },
        key: { type: 'string', maxLength: 128 },
        usage: { type: 'string' },
        quota: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    };
  }
}

export default KeyQuota;
