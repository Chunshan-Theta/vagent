import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../types"
import getOpts from "./_config"
import { getLangConfig } from "../_lang"
import * as utils from '../utils'

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
請針對以下客戶與業務員的對話，分析當前的對話情境狀態，使用條列方式描述「目前的狀況」

分析的方向：
- 客戶目前的情緒或心理狀態為何？
- 業務員的回應是否對應到情緒或需求？
- 對話是否已產生斷裂、誤解或情緒升溫？

不需評論誰對誰錯，只需客觀描述狀況演變。
最後條列出「目前的情境狀況」(sentences)」

範例回應：
- 客戶表現出對財務壓力的擔憂和焦慮
- 對話中出現了客戶對業務員的質疑和不滿

注意：內容語系為 "${lang}"，且你的回應也需要用 "${lang}" 語系撰寫。

`.trim(), 'zh', lang);
  const template = `
${prompt1.text}

待分析對話紀錄如下：
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