import { Model, snakeCaseMappers } from 'objection';

export class AgentSettings extends Model {
  static tableName = 'agents_settings';

  agentId!: string;
  dataKey!: string;
  dataVal!: string;
  createdAt?: string;
  updatedAt?: string;

  static get idColumn() {
    return ['agent_id', 'data_key'];
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['agentId', 'dataKey', 'dataVal'],
      properties: {
        agentId: { type: 'string', maxLength: 64 },
        dataKey: { type: 'string', maxLength: 128 },
        dataVal: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    };
  }
}

export default AgentSettings;
