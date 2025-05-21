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
請針對以下客戶與業務員的對話，分析當前的對話情境狀態，使用條列方式描述「目前發生了什麼」

分析方式：
- 客戶目前的情緒或心理狀態為何？
- 業務員的回應是否對應到情緒或需求？
- 對話是否已產生斷裂、誤解或情緒升溫？

不需評論誰對誰錯，只需客觀描述狀況演變。

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
        sentences: {
          type: 'array',
          items: {
            type: 'string',
            description: '當前的情境狀況 item',
          },
        }
      },
      required: ['sentences'],
    }
  };
}