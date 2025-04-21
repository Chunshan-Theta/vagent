
export interface PromptMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  label?: string
  name?: string
}

export function emptyGradingContext(){
  return {
    lang: 'zh-TW',
    lastInput: '',
    history: [],

    userRole: '業務員',
    aiRole: '模擬演練客戶',

    // 評分資訊
    gradingTitles: [],
    gradingTypes: [],

    nowStepOpening: '',
    nowStepGrading: '',
    nowStepGradingInfo: '',
    nowStepGradingExamples: '',

    /** 整體情境描述 */
    contextDescription: '',
  }
}

export type GradingContext = ReturnType<typeof emptyGradingContext>

type _chatCompletionOptions = {
  model: string;
  messages: any[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[] | string;
}

export async function _chatCompletion(opts:_chatCompletionOptions) {
  const nOpts = {...opts};
  const response = await fetch("/api/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(nOpts),
  });

  if (!response.ok) {
    console.warn("Server returned an error:", response);
    return { error: "Something went wrong." };
  }

  const completion = await response.json();

  return {
    result: completion.choices[0].message.content,
    usage: completion.usage,
  }
}


export function historyToText(history: any[]) {
  return history
    .filter((item)=>item.data?.content)
    .map((item) => {
      const role = item.role === "user" ? "User" : item.role === "assistant" ? "Assistant" : "System";
      return `${role}: ${JSON.stringify(item.data.content)}`
    }).join("\n\n");
}

export function parseFlatChatMessages(text: string) {
  text = text.trim()
  // const text = data.toString()
  // match role label
  const reg = /={3,4}(system|user|assistant)([^=\n]*)=*/gm
  let start = 0
  let cRole = 'user' as PromptMessage['role']
  // let end = false
  let m: RegExpExecArray|null = null
  let t = 0
  const messages: PromptMessage[] = []
  while ((m = reg.exec(text))) {
    const content = text.substring(start, m.index).trim()
    if (content) {
      const item = {
        role: cRole,
        content
      }
      // console.log('msg', item)
      messages.push(item)
    }
    // 每當 match 到新的結果，把目前的範圍提交到 messages
    cRole = m[1] as PromptMessage['role']
    start = m.index + m[0].length
    t += 1
    if (t > 3000) {
      throw new Error('loop')
    }
  }
  const lastText = text.substring(start).trim()
  if (lastText) {
    const item = {
      role: cRole,
      content: lastText
    }
    messages.push(item)
  }
  return messages
}