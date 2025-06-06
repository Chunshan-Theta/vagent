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
  const prompt1 = utils.translatePrompt(`
請依據底下的對話，分別找出：
- 小陳說話中具有情緒或資訊意涵的關鍵句（請列出實際原句）
- 主管回應中可能存在的溝通問題或不足之處
  `.trim(), 'zh', lang);
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
              items: {
                type: 'string',
              },
            },
            problems: {
              type: 'array',
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