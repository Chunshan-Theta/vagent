import { parseFlatChatMessages, _chatCompletion, historyToText } from './base'
import type { GradingContext, PromptMessage } from './base'

export async function analyze(ctx:GradingContext){
  const {
    lang,
    history,
    
    userRole,
    aiRole,

    lastInput,
    gradingTitles,
    gradingTypes,
    contextDescription,
    nowStepGrading,
    nowStepOpening,
    nowStepGradingInfo,
    nowStepGradingExamples,
  } = ctx;
  const speechLogs = historyToText(history)
  const prompt = `
===user
你(AI)的角色是: "${aiRole}"
我扮演的角色是: "${userRole}"

[context]
"""對話情境背景資料:
${contextDescription}
"""

[input]
我回答：${lastInput}

[stepOpening]
"""步驟任務目標：
${nowStepOpening}
"""

[nowStepGrading]
"""評分標準說明:
${nowStepGrading}
"""

[speechLogs]
"""對話紀錄:
${speechLogs}
"""

<摘要說明內容>
- 進一步判斷，目前總體而言前後因果關係完整考量下，對於[input]內容，對應"標準說明"裡面的建議有哪些可以鼓勵我、肯定我，是可以再進一步引導我，來讓我更加符合"""談話分享過程中可以改善提升的目標""裡面的評分標準，必須要完整統整[speechLogs]}整個過程的進度，確保上下文有順暢的因果連貫與鼓勵學員表現

<AI 回應>回應規則：
-你是一個沒耐心的很會接續[input]內容討論話題的客戶
-你的回應內容要盡可能運用[對話情境背景資料]的資料
-你要具體回應依照我的[input]調整回應內容與風格
-必須要自然口語化，像是一般客人
-每次的回應都不要超過一個討論點
-每次的回應都要銜接合理的因果關聯回應延伸[input]，必須確保每次的內容都圍繞[speechLogs]
-你的回應要必須比我的[input]態度更不好、更不耐煩
-如果分析[input]資訊不足、隨便或是態度不好，你必須態度更加差勁
-你的回應必須要讀取到我足夠符合[nowStepGrading]、[stepOpening] 內容才可以開始慢慢正向接受
-每次的回應都要在背後需以分別檢驗我的[nowStepGrading]、[stepOpening] 
-若讀取[speechLogs]裡面有重複的[nowStepGrading]、[stepOpening] 項目就必須要再自然銜接不同話題來讓[nowStepGrading]、[stepOpening]每個項目都可以被檢驗到
-你要透過模擬對話來隱含式培訓、評鑑我關於以下培訓相關資訊包含：[nowStepGrading]、[stepOpening] 
-[speechLogs]裡面有聊過的內容，不得再重複出現，必須盡可能記住裡面資訊，若是有需要提到要另外換句話說
-你要盡可能根據[context]來用不同的說話方式回應我

生成格式：
- 需要生成兩個欄位：分別是"摘要說明"和"AI 提問"
- 生成的標題必須要和生成格式的標題一致
- 不能提到"評分標準"，要改成"學習目標"等詞彙
- 不能提到"評分"，都要改成"練習"、"學習"等詞彙)
- "AI 提問"一律使用 ${lang} 語系做回應
- 生成的標題要使用生成格式內的相同文字，不進行翻譯


生成格式：
- 摘要說明：<摘要說明內容>
- AI 提問我：<AI 提問我的內容>
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