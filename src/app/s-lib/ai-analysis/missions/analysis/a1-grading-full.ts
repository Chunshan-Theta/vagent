import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getModuleOptions, { getDefaultParams } from "./_config"
import { getLangConfig } from "../../_lang"
import * as utils from '../../utils'

export type ContextParams = {
  role?: string
  role2?: string
  types?: string
  titles?: string
  context?: string
  grading?: string
  gradingExamples?: string
  history?: string

  instruction?: string
}


export function defineParams() : MissionParamsDefineMap {
  const d = getDefaultParams();
  return {
    role:{
      type: 'text',
      title: '角色',
      description: '請輸入user的角色',
      default: '業務員',
    },
    role2: {
      type: 'text',
      title: '角色2',
      description: '請輸入assistant的角色',
      default: '模擬演練客戶',
    },
    types: {
      type: 'textarea',
      title: '*評分類型',
      description: '沒特殊需求可以不用改，這邊要跟評分標準內的評分類型一致(記得照高->低的順序填)(換行或逗號分隔)',
      default: '非常好, 好, 普通, 不太好, 無法判斷',
    },
    titles: {
      type: 'textarea',
      title: '*評分項目',
      description: '需要和評分標準內提到的項目一致(換行或逗號分隔)',
      default: '用淺白語言闡述財富價值\n梳理對話邏輯提升客戶信心\n回應客戶情緒建立信任關係\n針對客戶疑慮提供精準解方\n用數據佐證凸顯財富效益\n闡述風險對比凸顯保障優勢\n分享成功案例增強說服力\n順勢探詢意願促進財富規劃',
    },
    context: {
      type: 'textarea',
      title: '*情境描述',
      description: '請輸入情境描述',
      default: d.context,
    },
    grading: {
      type: 'textarea',
      title: '*評分項目',
      description: '請輸入內容的語系，例如：zh、en 等等',
      default: d.grading,
    },
    gradingExamples: {
      type: 'textarea',
      title: '*評分示範',
      description: '請輸入評分示範，這些範例將用於輔助評分標準的理解。',
      default: d.examples,
    },
    reference: {
      type: 'textarea',
      title: '評分結果參考資料',
      description: '假設原本已經有評分了，這些資料可以用來輔助總結最終結果。',
    },
    history: {
      type: 'textarea',
      title: '*對話紀錄(在 user_say 之前的所有對話內容',
      placeholder: 'user: ..........\nassistant: ..........\nuser: ..........\nassistant: ..........',
      default: '',
    },
    instruction: {
      type: 'textarea',
      title: '生成指示',
      description: '請輸入生成指示，這些指示將用於生成基於對話紀錄和參考資料的建議。',
      placeholder: `
你的任務是根據"評分標準"和"評分示範"等相關資料來分析對話紀錄中用戶回答的評分

詳細規則：
- 用戶的角色是 __role__
- 請依序判斷每個評分標準的說明和範例，並給出每一個評分標準的分析結果
- 對於任何標準，無論有無符合都要列出標題和類型和原因，如果是很不符合的標準就分類為"無法判斷"
- 評分時要盡量提到因為用戶說了哪些導致符合或不符合的原因

每一個標準的分析結果產出格式：
- 評分標準標題：___
- 屬於評分標準的哪一種：[___]
- 屬於該評分標準的詳細原因：___`
    }
  }
}

export function moduleOptions() : ModelOptions{
  return getModuleOptions()
}

export async function getMessages(params: ContextParams){
  const d = getDefaultParams();
  const titles = splitTexts(params.titles || d.titles);
  const types = splitTexts(params.types || d.types);

const defaultInstruction = `
你的任務是根據"評分標準"和"評分示範"來分析<user_say>裡面回答的評分
- 請依序判斷每個評分標準的說明和範例，並給出每一個評分標準的分析結果
- 對於任何標準，無論有無符合都要列出標題和類型和原因，如果是很不符合的標準就分類為"${types[types.length - 1] || '無法判斷'}"
- 評分時要盡量提到因為用戶說了哪些導致符合或不符合的原因

每一個標準的分析結果產出格式：
- 評分標準標題：___ (${titles.join('、')})
- 屬於評分標準的哪一種：[___] (${types.join('、')})
- 屬於該評分標準的詳細原因：___
`.trim();

  const template = `
你(AI)的角色是: "${params.role2 || d.role2}"
我扮演的角色是: "${params.role || d.role}"

<情境描述>:
"""
${params.context || d.context}
"""

<評分標準>:
"""
${params.grading || d.grading}
"""

<評分示範>:
"""
${params.gradingExamples || d.examples}
"""

${params.instruction || defaultInstruction}

<對話紀錄>:
"""
${params.history || ''}
"""
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
        scores: {
          type: 'string',
        }
      },
      required: ['scores'],
    }
  };
}





function splitTexts(text: string){
  return text.split(/[\t\n,，]/).map(t => t.trim()).filter(t => t.length > 0);
}