import { parseFlatChatMessages, _chatCompletion } from './base'
import type { GradingContext, PromptMessage } from './base'

export async function analyze(ctx:GradingContext){
  const {
    lang,
    history,
    lastInput,
    gradingTitles,
    gradingTypes,
    nowStepGrading,
    nowStepGradingExamples,
  } = ctx;
  const prompt = `
===user
每一個練習步驟的評分標準說明

評分標準說明:
"""
${nowStepGrading}
"""

每個練習步驟評分標準的示範句子(分成好的和壞的):
"""
${nowStepGradingExamples}
"""

你的任務是根據標準和範例分析[input]的評分
- 請依序判斷每個評分標準的說明和範例，並給出每一個評分標準的分析結果
- 對於任何標準，無論有無符合都要列出標題和類型和原因，如果是很不符合的標準就分類為"無法評分"

每一個標準的分析結果產出格式：
- 評分標準標題：___
- 屬於評分標準的哪一種：[___] (${gradingTypes.join('、')})
- 屬於該評分標準的詳細原因：___
- 使用 "${lang}" 語系回答

[input]:
${lastInput}
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