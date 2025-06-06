import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getOpts, { defaultCriteria } from "./_config"
import { getLangConfig } from "../../_lang"
import * as utils from '../../utils'

export type KeyPointsParams = {
  context?: string
  criteria?: string
  role?: string
  role2?: string
  history?: string
  lang?: string
}

export function defineParams() : MissionParamsDefineMap {
  const criteria = defaultCriteria
  return {
    lang: {
      type: 'text',
      title: '內容語系',
      description: '請輸入內容的語系，例如：zh、en 等等',
      default: 'zh',
    },
    context: {
      type: 'text',
      title: '情境描述',
      description: '請輸入情境描述',
      default: '我的角色是小陳的主管，在對話中我希望能夠幫助小陳釐清目標、現況、選項和行動計畫，並給予他適當的建議和支持。',
    },
    criteria: {
      type: 'textarea',
      title: '分析方向',
      description: '請在此貼上完整的評分規則或分析的方向描述。',
      default: criteria.join('\n'),
    },
    role: {
      type: 'text',
      title: '我的角色',
      description: '請輸入角色名稱(要和對話紀錄中的對象相同',
      default: '我',
    },
    role2: {
      type: 'text',
      title: '對方角色',
      description: '請輸入角色名稱(要和對話紀錄中的對象相同',
      default: '對方',
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

分析情境：
"""
${params.context || ''}
"""

分析規則：
"""
${params.criteria || ''}
"""

請參考分析規則，然後依據底下的對話，分別找出：
- ${params.role2}說話中具有情緒或資訊意涵的關鍵句（請列出實際原句）
- ${params.role}回應中可能存在的溝通問題或不足之處
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