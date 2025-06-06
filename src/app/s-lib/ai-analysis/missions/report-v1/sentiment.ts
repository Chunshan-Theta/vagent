import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getOpts from "./_config"

export type SentimentParams = {
  role2?: string
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
    role2: {
      type: 'text',
      title: '對方的角色',
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

export function getMessages(params: SentimentParams){
  const lang = params.lang || 'zh';
  const template = `
你是一位專業的對話情緒分析師。請根據以下對話內容，判斷"${params.role2 || '對方'}"的主要情緒傾向，結果僅需回傳以下四種其中一種：

open（開放/接受）
neutral（中立/並無特別的情緒）
angry（生氣/不喜歡對方的答覆）
frustrated（沮喪/對當前的情況感到失望）

內容語系為："${lang}"
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

export function expectSchema(params: SentimentParams) : MissionResponseSchame{
  return {
    name: 'sentiment_analysis',
    schema: {
      type: 'object',
      properties: {
        sentiment: {
          type: 'string',
          enum: ['open', 'neutral', 'angry', 'frustrated'],
        },
      },
      additionalProperties: false,
      required: ['sentiment'],
    },
    strict: true,
  };
}