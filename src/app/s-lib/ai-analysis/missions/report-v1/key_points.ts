import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getOpts, { defaultCriteria } from "./_config"
import { getLangConfig } from "../../_lang"
import * as utils from '../../utils'

export type KeyPointsParams = {
  analysis?: string
  context?: string
  criteria?: string
  role?: string
  role2?: string
  history?: string
  lang?: string
}


const basePromptTemplate = `
請參考分析規則，然後依據底下的對話，分別找出：
- __role2__ 說話中具有情緒或資訊意涵的關鍵句（請列出實際原句）
- __role__ 回應中可能存在的溝通問題或不足之處
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
      title: '分析規則',
      description: '請在此貼上完整的評分規則或分析的方向描述。',
      default: criteria.join('\n'),
    },
    prompt: {
      type: 'textarea',
      title: '提示語',
      description: '這是用於生成分析的提示語，請根據需要進行修改。\n(如果有把關鍵句整理和問題的名稱意義改掉，最好告知 agent 你想把哪個資料放入 sentences 哪個資料放入 problems)',
      default: basePromptTemplate
    },
    role: {
      type: 'text',
      title: '要分析的角色(role)',
      description: '請輸入角色名稱(要和對話紀錄中的對象相同',
      default: 'user',
    },
    role2: {
      type: 'text',
      title: '對方角色(role2)',
      description: '請輸入角色名稱(要和對話紀錄中的對象相同',
      default: 'assistant',
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

export async function getMessages(params: KeyPointsParams){
  const lang = params.lang || 'zh';
  const langConfig = getLangConfig(lang, 'zh');

  const role = params.role || 'user';
  const role2 = params.role2 || 'assistant';

  const basePrompt = basePromptTemplate
    .replace(/__role__/g, role)
    .replace(/__role2__/g, role2);

  const prompt1 = await utils.translatePrompt(`

分析情境：
"""
${textIndent(params.context || '')}
"""

分析規則：
"""
${textIndent(params.criteria || '')}
"""

分析方向或目標：
"""
${textIndent(params.analysis || '')}
"""
  `.trim(), 'zh', lang);

  const template = `
對話紀錄如下：
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
      content: prompt1.text
    },
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

function textIndent(text: string, indent: number = 2): string {
  const spaces = ' '.repeat(indent);
  return text.split('\n').map(line => spaces + line).join('\n');

}