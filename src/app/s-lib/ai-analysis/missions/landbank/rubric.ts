import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getOpts from "./_config"
import { getLangConfig } from "../../_lang"
import * as utils from '../../utils'

export type RubricParams = {
  criteriaTitles?: string[]
  criteria?: string[]|string
  /** 注: 此處的 history 內講話的對象名稱必須是 user 和 assistant 而不是取代過後的其他字眼 */
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
    criteria: {
      type: 'textarea',
      title: '對話紀錄',
      placeholder: `評分標準標題 7：分享成功案例增強說服力
非常好：講述具體案例（「三年前投保，400 萬房貸還清」），細節豐富且具情感共鳴。
好：提及案例並點出效果，但缺乏細節，故事性稍弱。
普通：泛泛提及他人經驗，無具體內容，說服力不足。
不太好：僅空洞推薦，無案例支撐，難以建立信任。
無法判斷：未提及或無法判斷。
---
評分標準標題 8：順勢探詢意願促進財富規劃
非常好：以具體調整（如「每天 40 元」）為基礎，自然徵詢意見（如「這樣符合您的規劃嗎？」），過渡流暢。
好：提出調整後簡單詢問意願，語氣自然但吸引力稍弱。
普通：直接問看法，缺乏引導鋪陳，略顯突兀。
不太好：語氣急促或推銷感強（如「要不要試試」），易讓客戶抗拒。
無法判斷：未提及或無法判斷。`,
      default: '',
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

export async function getMessages(params: RubricParams){
  const lang = params.lang || 'zh';
  const langConfig = getLangConfig(lang);
  const criteria = typeof params.criteria === 'string' ? params.criteria.split('---') : (params.criteria || [])

  const prompt1 = await utils.translatePrompt(`
# 任務目標
根據這些標準(criteria)分析以下訊息：
對於每個標準(criteria)，請提供：
1. 1-100 分（100 分代表滿分，1 分代表最低分）
2. 關於給分的簡要原因說明，必須針對user的文字（而不是來自nassistant和criteria）。
3. examples要引用來自user的文字（而不是來自nassistant和criteria）來作為具體例子，支援您的評分和推理。
4. 針對此標準提出2-3個具體的改進建議，改進建議要包含引導例句。
5. 簡單概括整個對話（2-3 句）
6. 3-5條針對整個對話的整體改進建議，改進建議要包含引導例句。
`.trim(), 'zh', lang)
  const prompt2 = await utils.translatePrompt(`
# 重要提示：
1. 一切分析都應該以「user的文本」為基礎（忽略assistant的文字），主要著重分析使用者在當前對話中的表現。
2. examples中只包含user的文字。如果user的文字中沒有好的例子，就說「沒有找到相關的例子」並給出低分。
3. 所有內容都會使用繁體中文撰寫
4. 在建議與分析時，必須參照並引用 user 説的相關內容。
5. 若有提供建議，要加上具體的對話範例句子，讓內容更實用不籠統。
6. 分析應基於以下概念（以下概念是對話歷程之理解與思考分析的步驟，用來協助分析使用者內容，並不是criteria）：
  ## 羅傑斯對話分析
  運用卡爾羅傑斯溝通方法的原則分析以下對話。
  仔細執行每個步驟並提供深思熟慮的、以同理心為中心的評估。

  ### a. 閱讀並瞭解完整的對話
  - 仔細閱讀整個對話。
  - 確定背景和正在討論的主要主題。

  ### b. 確定每個人的核心觀點
  - 總結每個參與者表達的主要想法、信念和情感。
  - 他們潛在的擔憂或動機是什麼？

  ### c. 尋找共同點或潛在共識
  - 參與者之間是否有共同的目標、價值觀或觀點？
  - 強調任何隱含的協議或一致的利益。

  ### d. 分析理解與認同的表達
  - 每個人是否都理解或認同對方的觀點？
  - 即使他們不同意，他們是否在語言中表現出同理心或情感意識？

  ### e. 檢視問題是如何被提出的
  - 該主題或衝突是如何被引入和討論的？
  - 它是中立的嗎？還是帶有偏見、責備或對抗的語氣？
  - 如果需要，建議如何更有建設性地重新闡述這個問題。

  ### f.評估合作意願
  - 是否真誠地努力尋求共同的解決方案或加深理解？
  - 參與者是否對不同觀點表示開放或妥協？

  ### g. 總結關鍵見解
  - 簡要總結每個人的觀點、相互理解的程度以及任何一致的領域。
  - 評估對話與羅傑斯的同理心、真實性和尊重原則的契合程度。

  ### h. 提出改進建議
  - 根據分析，提出加強對話的具體方法。
  - 專注於促進同理心、相互理解和協作解決問題（例如，使用反思性傾聽、提出澄清問題、避免使用評判性語言）。
`.trim(), 'zh', lang)

  const template = `
${prompt1.text}

# criteria
${criteria.join(', ')}。

${prompt2.text}

# 以下是對話內容：
"""
${params.history || ''}
"""

注意：內容語系為 "${lang}"，且評分結果也需要用 "${lang}" 語系撰寫。
${langConfig.instructions || ''}

`.trim()

  const messages = [
    {
      role: 'user',
      content: template,
    },
  ];

  return messages;
}

export function expectSchema(params: RubricParams){

  const criterionAppend: any = {}
  if(params.criteriaTitles && params.criteriaTitles.length > 0){
    criterionAppend.enum = params.criteriaTitles
  }

  return {
    name: 'rubric',
    description: '根據這些標準(criteria)分析以下訊息',
    schema: {
      type: 'object',
      properties: {
        scores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: {
                type: 'string',
                description: '評分標準的名稱(標題)',
                ...criterionAppend
              },
              score: {
                type: 'number',
                description: '針對該標準的得分',
              },
              reason: {
                type: 'string',
              },
              examples: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              improvementTips: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
            additionalProperties: false,
            required: ['criterion', 'score', 'reason', 'examples', 'improvementTips'],
          },
        }
      },
      additionalProperties: false,
      required: ['scores'],
    },
    strict: true,
  };
}