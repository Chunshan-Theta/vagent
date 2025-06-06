import { Model, RelationMappings } from "objection";
import { snakeCaseMappers } from "objection";
import { ConvMessage } from "./ConvMessage";
import { ConvAnalysis } from "./ConvAnalysis";

export class Conv extends Model {
  static tableName = "conv";

  id!: string;
  uid?: number | null;
  agentType!: string;
  agentId!: string;
  createdAt!: Date;
  email?: string | null;
  uname?: string | null;

  messages?: ConvMessage[];
  analysis?: ConvAnalysis[];

  static get idColumn() {
    return "id";
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["id", "agentType", "agentId"],
      properties: {
        id: { type: "string", maxLength: 64 },
        uid: { type: ["integer", "null"] },
        email: { type: ["string", "null"] },
        uname: { type: ["string", "null"], maxLength: 64 },
        agentType: { type: "string", maxLength: 64 },
        agentId: { type: "string", maxLength: 64 },
        createdAt: { type: "string", format: "date-time" },
      },
    };
  }

  static get relationMappings(): RelationMappings {
    return {
      messages: {
        relation: Model.HasManyRelation,
        modelClass: ConvMessage,
        join: {
          from: "conv.id",
          to: "conv_message.conv_id",
        },
      },
      analysis: {
        relation: Model.HasManyRelation,
        modelClass: ConvAnalysis,
        join: {
          from: "conv.id",
          to: "conv_analysis.conv_id",
        },
      },
    };
  }
}
export default Conv;