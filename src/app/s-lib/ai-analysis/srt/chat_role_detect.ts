import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../types"
export type MissionParams = {
  contextDescription?: string
  content?: string
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
    contextDescription: {
      type: 'text',
      title: '情境說明',
      description: '請輸入情境描述，包含有哪些角色，以及他們的關係和背景等等，以便AI區分角色',
      default: '',
    },
    content: {
      type: 'text',
      title: '對話內容',
      description: '請輸入SRT的內容',
      default: '',
    }
  }
}

export function moduleOptions() : ModelOptions{
  return {
    model: 'gpt-4.1',
    top_p: 0.7,
    temperature: 0.2,
    max_tokens: 2000,
  }
}

export function getMessages(params: MissionParams){
  const lang = params.lang || 'zh-TW';
  const template = `
底下會提供 SRT 字幕和情境描述，請你根據情境描述，找出每一句話的發言對象並標記。
然後根據情境描述，將每一句話的發言對象標記為對應的角色。

情境描述如下：
"""
${params.contextDescription}
"""

SRT 字幕內容如下：
"""
${params.content}
"""

內容語系為："${lang}"
回應內容格式為JSON，每個對象要保持原本的ID，然後用 role 欄位標記發言對象。
請注意，這裡的 role 欄位應該是對應情境描述中的角色名稱，而不是 SRT 中的 speaker ID。

`.trim()

  const messages = [
    {
      role: 'user',
      content: template,
    },
  ];

  return messages;
}

export function expectSchema(params: MissionParams){
  return {
    schema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              role: { type: 'string' },
            },
            required: ['role', 'content'],
          },
        },
      },
      required: ['messages'],
    }
  };
}