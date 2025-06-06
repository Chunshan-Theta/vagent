import { Model, RelationMappings } from "objection";
import { Conv } from "./Conv";
import { snakeCaseMappers } from "objection";

export class ConvAnalysis extends Model {
  static tableName = "conv_analysis";

  convId!: string;
  name!: string;
  type!: string;

  /** JSON 格式分析結果 */
  analysis!: string;
  createdAt!: Date;

  conv?: Conv;
  
  static get idColumn() {
    // 複合主鍵
    return ["conv_id", "name"];
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["convId", "name", "type", "analysis"],
      properties: {
        convId: { type: "string", maxLength: 64 },
        name: { type: "string", maxLength: 64 },
        type: { type: "string", maxLength: 32 },
        analysis: { type: "string" },
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
          from: "conv_analysis.conv_id",
          to: "conv.id",
        },
      },
    };
  }
}
export default ConvAnalysis;