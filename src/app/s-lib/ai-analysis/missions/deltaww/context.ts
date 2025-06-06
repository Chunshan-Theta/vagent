import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getOpts from "./_config"
import { getLangConfig } from "../../_lang"
import * as utils from '../../utils'

export type ContextParams = {
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

export async function getMessages(params: ContextParams){
  const lang = params.lang || 'zh-TW';
  const prompt1 = await utils.translatePrompt(`
請針對以下小陳與主管的對話，分析當前的對話情境狀態，使用條列方式描述「目前的狀況」

分析的方向：
- 小陳目前的情緒或心理狀態為何？
- 主管的回應是否對應到情緒或需求？
- 對話是否已產生斷裂、誤解或情緒升溫？
- 是否有未解決的問題或情緒？

不需評論誰對誰錯，只需客觀描述狀況演變。
最後條列出「目前的情境狀況」(sentences)」

條列結果僅保留狀況描述，比如
- 主管建議每週或每月舉行一次跨部門會議，讓各部門能夠在同一個平台上分享進度、問題和需求。這樣可以減少誤解和信息不對稱。
- 小陳感到主管的回應沒有針對他的情緒和需求，導致他感到沮喪和不被理解。
- 主管的回應過於簡單，沒有深入了解小陳的情況和需求。

注意：內容語系為 "${lang}"，且你的回應也需要用 "${lang}" 語系撰寫。

待分析對話紀錄如下：
`.trim(), 'zh', lang);
  const template = `
${prompt1.text}

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

export function expectSchema(params: ContextParams){
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