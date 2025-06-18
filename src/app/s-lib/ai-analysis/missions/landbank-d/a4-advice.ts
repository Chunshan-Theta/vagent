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
  goal?: string
  grading?: string
  gradingExamples?: string
  history?: string
  input?: string
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
      title: '評分類型',
      description: '沒特殊需求可以不用改，這邊要跟評分標準內的評分類型一致(記得照高->低的順序填)(換行或逗號分隔)',
      default: '非常好, 好, 普通, 不太好, 無法判斷',
    },
    titles: {
      type: 'textarea',
      title: '評分項目',
      description: '需要和評分標準內提到的項目一致(換行或逗號分隔)',
      default: '用淺白語言闡述財富價值\n梳理對話邏輯提升客戶信心\n回應客戶情緒建立信任關係\n針對客戶疑慮提供精準解方\n用數據佐證凸顯財富效益\n闡述風險對比凸顯保障優勢\n分享成功案例增強說服力\n順勢探詢意願促進財富規劃',
    },
    context: {
      type: 'textarea',
      title: '情境描述',
      description: '請輸入情境描述',
      default: d.context,
    },
    goal: {
      type: 'textarea',
      title: '對話目標',
      description: '請輸入對話的目標',
      default: '',
    },
    grading: {
      type: 'textarea',
      title: '評分項目',
      description: '請輸入內容的語系，例如：zh、en 等等',
      default: d.grading,
    },
    gradingExamples: {
      type: 'textarea',
      title: '評分範例',
      description: '請輸入評分範例，這些範例將用於輔助評分標準的理解。',
      default: d.examples,
    },
    history: {
      type: 'textarea',
      title: '對話紀錄(在 input 之前的所有對話內容',
      placeholder: 'user: ..........\nassistant: ..........\nuser: ..........\nassistant: ..........',
      default: '',
    },
    input: {
      type: 'text',
      title: '角色',
      description: '填入用戶最後一次說了什麼(會針對這句話做分析)',
      default: '',
    },
  }
}

export function moduleOptions() : ModelOptions{
  return getModuleOptions()
}

export async function getMessages(params: ContextParams){
  const d = getDefaultParams();
  const titles = splitTexts(params.titles || d.titles);
  const types = splitTexts(params.types || d.types);
  const template = `
# 參考資料

<對話目標>:
"""
${params.goal || ''}
"""

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

# 生成任務
你需要基於互動紀錄和參考資料，給予用戶對應的建議。
目標是訓練用戶，讓用戶能夠回答的更好。

- 依照評分標準產出3種回答方向建議
- 回答方向建議必須要回應對話紀錄中 assistant 最後說的話，並且要具體延伸舉例可以怎麼說
- 回答方向建議一定要是符合"步驟任務目標"範圍內
- 回答方向建議是用來引導舉例我可以怎麼回答"最後一段AI 提問內容"
- 切記回答方向建議的詞彙絕對必須跟"對話紀錄"的詞彙、句子、概念有超過70%以上的不同，因為這些都是練習過的內容，重複出現會讓使用者很挫折、重複犯錯，必須要持續用不同的方式來引導才會進步
- 回答方向建議內容盡可能原封不動保留、引用"對話紀錄"、"步驟任務目標"內的詞彙句子來回應補充
- 建議共3條，每一種150字以內

# 生成格式
使用繁體中文zh-tw
(有提到"學員"，都要直接說"你"
不能提到"評分標準"，要改成"學習目標"等詞彙
不能提到"評分"，都要改成"練習"、"學習"等詞彙)
建議共3條，每一種150字以內

## 生成範例
- 建議1：
- 建議2：
- 建議3：

# 互動紀錄

<對話紀錄>(在 user_say 之前的所有對話內容):
"""
${params.history || ''}
"""

<user_say>:
"""
${params.input || ''}
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
        output: {
          type: 'string',
        }
      },
      required: ['output'],
    }
  };
}





function splitTexts(text: string){
  return text.split(/[\t\n,，]/).map(t => t.trim()).filter(t => t.length > 0);
}