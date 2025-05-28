import type { ModelOptions, MissionResponseSchame, MissionParamsDefineMap } from "../types"
export type MissionParams = {
  instructions?: string
  content?: string
  lang?: string
  langInstructions?: string
}

export function defineParams() : MissionParamsDefineMap {
  return {
    lang: {
      type: 'text',
      title: '翻譯語系',
      description: '請輸入要翻譯成的語系，例如：zh、en 等等',
      default: 'zh',
    },
    content: {
      type: 'text',
      title: '內容Prompt',
      description: '請輸入要翻譯的內容',
      default: '',
    }
  }
}

export function moduleOptions() : ModelOptions{
  return {
    model: 'gpt-4.1',
    top_p: 0.7,
    temperature: 0.2,
    max_tokens: 8000,
  }
}

export function getMessages(params: MissionParams){
  const lang = params.lang || 'zh';
  const instructions = (params.instructions || '').trim() || '請翻譯以下內容，並將翻譯結果以 JSON 格式回傳。';
  const langInstructions = (params.langInstructions || '').trim();
  const pContent = (params.content || '')
  .trim()
  .split('\n').map((line)=>{
    if(line){
      return '  ' + line;
    }
    return '';
  })
  .join('\n');
  const template = `
${instructions}
翻譯成 "${lang}" 語系。

${langInstructions ? `補充說明：\n${langInstructions}` : ''}

要翻譯的內容如下：
"""
${pContent}
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

export function expectSchema(params: MissionParams){
  return {
    schema: {
      type: 'object',
      properties: {
        translatedText: {
          type: 'string',
        },
      },
      additionalProperties: false,
      required: ['translatedText'],
    },
    strict: true,
  };
}