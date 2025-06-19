import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getOpts from "./_config"
import { getLangConfig } from "../../_lang"
import * as utils from '../../utils'

export type KeyPointsParams = {
  role?: string
  history?: string
  lang?: string
}

export function defineParams() : MissionParamsDefineMap {
  return {
    lang: {
      type: 'text',
      title: '內容語系',
      description: '請輸入內容的語系，例如：zh、en 等等',
      default: 'zh',
    },
    role: {
      type: 'text',
      title: '角色',
      description: '請輸入角色名稱(要和對話紀錄中的對象相同',
      default: '我',
    },
    history: {
      type: 'textarea',
      title: '對話紀錄',
      placeholder: '我: ..........\n對方: ..........\n我: ..........\n對方: ..........',
      default: '',
    },
  }
}

export function moduleOptions() : ModelOptions{
  return getOpts()
}

export function getMessages(params: KeyPointsParams){
  const lang = params.lang || 'zh';
  const role = params.role || 'user';
  const prompt1 = utils.translatePrompt(`
請參考分析規則，然後依據底下的對話，分別找出：
- sentences: 列出 "__role__" 說話的優點說得特別好的地方，例如：具有代表性情緒或資訊意涵的地方（必須融入具體引用對照評分標準的說明）
- problems: 列出 "__role__" 說話的缺點可能存在的溝通問題或不足之處（必須融入具體引用對照評分標準的說明）
  `.trim().replace(/__role__/g, role), 'zh', lang);
  const template = `
${prompt1}

注意：內容語系為 "${lang}"，且你的回應也需要用 "${lang}" 語系撰寫。

對話如下：
${params.history}
`.trim()

  const messages = [
    {
      role: 'user',
      content: template,
    },
  ];

  return messages;
}

export function expectSchema(params: KeyPointsParams){
  return {
    schema: {
      type: 'object',
      properties: {
        keyPoints: {
          type: 'object',
          properties: {
            sentences: {
              type: 'array',
              description: '優點',
              items: {
                type: 'string',
              },
            },
            problems: {
              type: 'array',
              description: '缺點',
              items: {
                type: 'string',
              },
            },
          },
          required: ['sentences', 'problems'],
        },
      },
      required: ['keyPoints'],
    }
  };
}