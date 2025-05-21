import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../types"
import getOpts from "./_config"

export type SentimentParams = {
  role?: string
  history?: string
}

export function defineParams() : MissionParamsDefineMap {
  return {
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

export function getMessages(params: SentimentParams){
  const template = `
請依據以下對話，找出：

客戶說話中具有情緒或資訊意涵的關鍵句（請列出實際原句）

業務回應中可能存在的溝通問題或不足之處

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

export function expectSchema(params: SentimentParams){
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