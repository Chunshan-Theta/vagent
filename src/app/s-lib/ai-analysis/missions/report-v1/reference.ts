import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../../types"
import getOpts from "./_config"

export type MissionParams = {
  content?: string
  reference?: string
  instruction?: string
}

const defaultInstruction = '請幫我生成更完整的內容，基於 content 和 reference'

export function defineParams() : MissionParamsDefineMap {
  return {
    content: {
      type: 'textarea',
      title: '原始內文',
      description: '',
      default: '',
    },
    reference: {
      type: 'textarea',
      title: '參考資料',
      placeholder: '',
      description: '請輸入參考資料，這些資料將用於補充原始內文的內容。',
      default: '',
    },
    instruction: {
      type: 'textarea',
      title: '生成指示',
      description: '請輸入生成指示，這些指示將用於生成基於原始內文和參考資料的文章。',
      default: defaultInstruction,
    }
  }
}

export function moduleOptions() : ModelOptions{
  return getOpts()
}

export function getMessages(params: MissionParams){
  const sysPrompt = `
你是一個文章檢閱者
你需要閱讀 content 和 reference，然後生成一個更完整的內容。
比如說 content 是一篇文章，而 reference 是一些相關的資料或參考文獻，這時候你要根據 content 的內容加入一些 reference 的資料，讓 content 更完整。
比如說 content 是一篇影片評論，而 reference 裡面提供了逐字稿，這時候你可以根據逐字稿的內容補充評論的細節。

註：可以想像 content 是基於 reference 和其他資料生成的文章。
`.trim();
  const prompt = `
## content:
"""
${params.content || ''}
"""

## reference:
"""
${params.reference || ''}
"""

${params.instruction || defaultInstruction}
`.trim()

  const messages = [
    {
      role: 'system',
      content: sysPrompt,
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  return messages;
}

export function expectSchema(params: MissionParams) : MissionResponseSchame{
  return {
    name: 'content_quotation',
    schema: {
      type: 'object',
      properties: {
        output: {
          type: 'string',
        },
      },
      additionalProperties: false,
      required: ['output'],
    },
    strict: true,
  };
}