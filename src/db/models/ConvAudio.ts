import { Model } from 'objection';
import { Conv } from './Conv';
import { snakeCaseMappers } from 'objection';

export class ConvAudio extends Model {
  id!: string;
  convId!: string;
  name!: string;
  mime!: string;
  duration!: number;
  uri?: string;
  info?: string;
  state!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static tableName = 'conv_audio';

  static get columnNameMappers() {
    return snakeCaseMappers();
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['convId', 'mime', 'duration'],
      properties: {
        id: { type: 'string', maxLength: 64 },
        convId: { type: 'string', maxLength: 64 },
        mime: { type: 'string', maxLength: 32 },
        uri: { type: 'string', nullable: true },
        info: { type: 'string', nullable: true },
        duration: { type: 'number' },
        state: { type: 'string', maxLength: 24 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    };
  }

  static get relationMappings() {
    return {
      conv: {
        relation: Model.BelongsToOneRelation,
        modelClass: Conv,
        join: {
          from: 'conv_audio.conv_id',
          to: 'conv.id',
        },
      },
    };
  }
}

export default ConvAudio;
