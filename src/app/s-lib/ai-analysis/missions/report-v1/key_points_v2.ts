import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getOpts, { defaultCriteria } from "./_config"
import { getLangConfig } from "../../_lang"
import * as utils from '../../utils'

const textIndent = utils.textIndent

export type KeyPointsParams = {
  analysis1?: string
  analysis2?: string
  title1?: string
  title2?: string

  context?: string
  criteria?: string
  role?: string
  role2?: string
  history?: string
  lang?: string
}

const defaultAnalysis1 = '分析 __role__ 表現良好的部分，並列出具體的例子或關鍵句（請列出實際原句）';
const defaultAnalysis2 = '分析 __role__ 表現不佳的部分，並列出可能存在的溝通問題或不足之處（請列出實際原句）';


const injectParams = (text:string, datas: { role:string, role2: string })=>{
  return text
    .replace(/__role__/g, datas.role || 'user')
    .replace(/__role2__/g, datas.role2 || 'assistant')
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
    title1: {
      type: 'text',
      title: '生成項目1',
      description: '指定生成項目1裡面要放甚麼東西 (簡單寫就好，不用寫成句子)',
      default: '優點'
    },
    analysis1: {
      type: 'text',
      title: '生成指示1',
      description: '指定生成結果1的說明。(例："說話中具有情緒或資訊意涵的關鍵句（請列出實際原句）")',
      default: defaultAnalysis1
    },
    title2: {
      type: 'text',
      title: '生成項目1',
      description: '指定生成項目2裡面要放甚麼東西 (簡單寫就好，不用寫成句子)',
      default: '缺點'
    },
    analysis2: {
      type: 'text',
      title: '生成指示2',
      description: '指定生成結果2的說明。(例："回應中可能存在的溝通問題或不足之處")',
      default: defaultAnalysis2
    },
    role: {
      type: 'text',
      title: '要分析的角色(role)',
      description: '請輸入角色名稱(要和對話紀錄中的對象相同)',
      default: 'user',
    },
    role2: {
      type: 'text',
      title: '對方角色(role2)',
      description: '請輸入角色名稱(要和對話紀錄中的對象相同)',
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

  const basePromptTemplate = `
請參考分析規則，然後依據對話紀錄，分別進行分析：
- list1: ${params.analysis1 || defaultAnalysis1}
- list2: ${params.analysis2 || defaultAnalysis2}
`.trim();
  
  const basePrompt = injectParams(basePromptTemplate, { role, role2 });

  const prompt1 = await utils.translatePrompt(`

分析情境：
"""
${textIndent(params.context || '')}
"""

分析規則：
"""
${textIndent(params.criteria || '')}
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
  const inject = (text: string) => {
    return injectParams(text, {
      role: params.role || 'user',
      role2: params.role2 || 'assistant'
    });
  }
  return {
    schema: {
      type: 'object',
      properties: {
        keyPoints: {
          type: 'object',
          properties: {
            list1: {
              type: 'array',
              description: inject(params.analysis1 || defaultAnalysis1),
              items: {
                type: 'string',
                description: params.title1 || '優點',
              },
            },
            list2: {
              type: 'array',
              description: inject(params.analysis2 || defaultAnalysis2),
              items: {
                type: 'string',
                description: params.title2 || '缺點',
              },
            },
          },
          required: ['list1', 'list2'],
        },
      },
      required: ['keyPoints'],
    }
  };
}

