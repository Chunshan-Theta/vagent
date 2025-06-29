import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getOpts, { defaultCriteria } from "./_config"
import { getLangConfig } from "../../_lang"
import * as utils from '../../utils'

export type ContextParams = {
  analysis?: string
  context?: string
  criteria?: string
  role?: string
  prompt?: string
  history?: string
  lang?: string
}

const basePromptTemplate = `

請參考分析標準，然後依據對話紀錄，給出對於 __role__ 的相關建議。
輸出結果請嚴格依照回應格式，給出 3 到 5 條建議，然後轉換成 json 格式。
回應格式：
- <建議內容>
- <建議內容>
- <建議內容>
`.trim();


export function defineParams() : MissionParamsDefineMap {
  const criteria = defaultCriteria
  return {
    lang: {
      type: 'text',
      title: '內容語系',
      description: '請輸入內容的語系，例如：zh、en 等等',
      default: 'zh',
    },
    analysis: {
      type: 'textarea',
      title: '分析方向',
      default: `請詳細分析對話紀錄，並根據分析方向和規則給我建議。`.trim()
    },
    context: {
      type: 'textarea',
      title: '情境描述',
      description: '請輸入情境描述',
      default: '我的角色是小陳的主管，在對話中我希望能夠幫助小陳釐清目標、現況、選項和行動計畫，並給予他適當的建議和支持。',
    },
    criteria: {
      type: 'textarea',
      title: '分析標準',
      description: '請在此貼上完整的評分規則或分析的方向描述。',
      default: criteria.join('\n'),
    },
    prompt: {
      type: 'textarea',
      title: '提示語',
      description: '這是用於生成分析的提示語，請根據需要進行修改。',
      default: basePromptTemplate
    },
    role: {
      type: 'text',
      title: '要分析的角色(role)',
      description: '請輸入角色名稱(要和對話紀錄中的對象相同',
      default: 'user',
    },
    history: {
      type: 'textarea',
      title: '對話紀錄',
      placeholder: 'user: ..........\nassistant: ..........\nuser: ..........\nassistant: ..........',
      default: '',
    },
  }
}

export function moduleOptions() : ModelOptions{
  return getOpts()
}

export async function getMessages(params: ContextParams){
  const lang = params.lang || 'zh';
  const langConfig = getLangConfig(lang, 'zh');
  const basePrompt = (params.prompt ||  basePromptTemplate).replace('__role__', params.role || 'user');
  const prompt1 = await utils.translatePrompt(`
你的任務是根據相關條件，分析對話紀錄然後給出相關建議。

情境描述：
"""
${params.context || ''}
"""

分析標準：
"""
${params.criteria || ''}
"""

分析方向或目標：
"""
${params.analysis || ''}
"""

`.trim(), 'zh', lang);

  const template = `
待分析對話紀錄如下：
"""
${params.history}
"""

${basePrompt}

注意：內容語系為 "${lang}"，且你的回應也需要用 "${lang}" 語系撰寫。
${langConfig.instructions || ''}
`.trim()

  const messages = [
    {
      role: 'system',
      content: prompt1.text,
    },
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
            description: '一條建議',
          },
        }
      },
      required: ['sentences'],
    }
  };
}