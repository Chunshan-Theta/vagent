import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getOpts from "./_config"
import { getLangConfig } from "../../_lang"

export type ProblemsParams = {
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

export function getMessages(params: ProblemsParams){
  const lang = params.lang || 'zh-TW';
  const template = `
根據以下對話，請分析業務員的回應是否合適，並簡要說明理由。請根據以下判斷方向進行：

- 業務員是否有回應客戶的情緒？
- 業務員是否有掌握對話的核心問題？
- 回應是否可能引發客戶反感或誤解？

如果回應的不合適，請條列出原因。
如果回應合適，請簡要說明為什麼合適。

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

export function expectSchema(params: ProblemsParams){
  return {
    schema: {
      type: 'object',
      properties: {
        keyPoints: {
          type: 'array',
          items: {
            type: 'string',
            description: '互動狀況與問題點',
          },
        },
      },
      required: ['problems'],
    }
  };
}