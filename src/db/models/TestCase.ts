import { Model, snakeCaseMappers } from 'objection';

export class TestCase extends Model {
  static tableName = 'test_cases';

  id!: number;
  agentId!: string;
  name!: string;
  inputText!: string;
  comparisonMethod!: 'contains' | 'similar';
  expectedParameters!: string[];
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static get idColumn() {
    return 'id';
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['agentId', 'name', 'inputText', 'comparisonMethod'],
      properties: {
        id: { type: 'integer' },
        agentId: { type: 'string', maxLength: 64 },
        name: { type: 'string', maxLength: 255 },
        inputText: { type: 'string' },
        comparisonMethod: { type: 'string', enum: ['contains', 'similar'] },
        expectedParameters: { type: 'array', items: { type: 'string' } },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    };
  }
} 