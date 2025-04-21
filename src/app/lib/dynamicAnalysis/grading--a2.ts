import { parseFlatChatMessages, _chatCompletion, historyToText } from './base'
import type { GradingContext, PromptMessage } from './base'

export async function analyze(ctx:GradingContext){
  const {
    lang,
    history,
    lastInput,
    gradingTitles,
    gradingTypes,
    nowStepGrading,
    nowStepGradingInfo,
    nowStepGradingExamples,
  } = ctx;
  const speechLogs = historyToText(history)
  const prompt = `
===user
根據"學習目標效益說明"
說明"最後一段我回答"
相較於"之前的對話紀錄的內容"來說
有甚麼改變進步，對於我有甚麼樣更進一步的幫助
你的說明必須要具體舉例"最後一段我回答"和"之前的對話紀錄的內容"有甚麼不同
為甚麼又更符合"本步驟學習目標"
要嚴格比較，如果沒有比較好的地方，絕對不能杜撰、不能捏造生成
只能講真正有更好的地方

(
所有提到"學員"，都要改成"你"
所有提到"之前的對話紀錄的內容"，都要改成"你之前的練習紀錄"等詞彙
所有提到"最後一段話"都要改成"你這次的練習"
)

本步驟學習目標:
"""
${nowStepGradingInfo}
"""

學習目標效益說明:
"""
${nowStepGrading}
"""

之前的對話紀錄:
"""
${speechLogs}
"""

生成格式必須要依照以下格式：
使用 ${lang} 語系回答
- 進步的內容說明：
`.trim()
  const messages = parseFlatChatMessages(prompt)
  return await _chatCompletion({
    model: 'gpt-4o',
    messages,
    top_p: 0.8,
    temperature: 0.2,
    max_tokens: 2000,
  })
}