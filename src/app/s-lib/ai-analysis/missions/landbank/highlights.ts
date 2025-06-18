import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getOpts from "./_config"
import { getLangConfig } from "../../_lang"

export type HighlightsParams = {
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

export function getMessages(params: HighlightsParams){
  const lang = params.lang || 'zh-TW';
  const template = `
請根據以下對話，找出該段對話中的「情緒衝突點」、「關鍵情緒或立場表達句」、「可能導致誤解或加劇情緒的轉折點」等句子。

請以清單列出的重點（如：衝突爆點、情緒訊號、回應失誤）。

範例回應：
- 這句話表達了客戶對於保費金額的驚訝和不滿，顯示出對價格的敏感性和壓力。
- 這是一個不完整或不適當的回應，可能讓客戶感到被忽視或不被理解，進一步加劇情緒衝突。
- 這句話揭示了客戶的財務壓力和對未來儲蓄計畫的擔憂，可能導致對話中的情緒升溫。

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

export function expectSchema(params: HighlightsParams){
  return {
    schema: {
      type: 'object',
      properties: {
        sentences: {
          type: 'array',
          description: '情緒衝突點、關鍵情緒或立場表達句、可能導致誤解或加劇情緒的轉折點等句子的解析',
          items: {
            type: 'string',
          },
        },
      },
      required: ['sentiment'],
    }
  };
}