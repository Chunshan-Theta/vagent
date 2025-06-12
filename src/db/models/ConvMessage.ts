import { Model, RelationMappings } from "objection";
import { snakeCaseMappers } from "objection";
import { Conv } from "./Conv";

export class ConvMessage extends Model {
  static tableName = "conv_message";

  id!: number;
  convId!: string;
  type!: string;
  role!: string;
  content!: string;
  audioRef?: string | null; // 音訊檔案的引用 ID
  audioStartTime?: number | null; // 音訊長度（豪秒，選填）
  createdAt!: Date;

  conv?: Conv;

  static get idColumn() {
    return "id";
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["convId", "type", "role", "content"],
      properties: {
        id: { type: "integer" },
        convId: { type: "string", maxLength: 64 },
        type: { type: "string", maxLength: 32 },
        role: { type: "string", maxLength: 24 },
        content: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
    };
  }

  static get relationMappings(): RelationMappings {
    return {
      conv: {
        relation: Model.BelongsToOneRelation,
        modelClass: Conv,
        join: {
          from: "conv_message.conv_id",
          to: "conv.id",
        },
      },
    };
  }
}
export default ConvMessage;