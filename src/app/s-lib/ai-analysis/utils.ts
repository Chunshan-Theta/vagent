import { getLangConfig } from './_lang'

export type quickTranslateOptions = {
  sourceLang?: string;
  instructions?: string;
  langInstructions?: string;
}

export async function simpleTranslate(text: string, targetLang: string, opts: quickTranslateOptions) {
  const { chatCompletion } = await import('./ai-analysis')
  try {
    const {
      sourceLang = 'auto',
      instructions = '',
      langInstructions = ''
    } = opts;
    const res = await chatCompletion({
      missionId: 'translate/simple',
      params: {
        text,
        targetLang,
        sourceLang,
        instructions,
        langInstructions
      } as quickTranslateOptions
    })

    const translatedText = res.json?.translatedText || '';
    return {
      success: true,
      text: translatedText
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      text: text, // Fallback to original text if translation fails
    }
  }
}

export async function translatePrompt(text: string, sourceLang: string, targetLang: string) {
  if(sourceLang === targetLang) {
    return {
      success: true,
      text: text
    }
  }

  const res = await simpleTranslate(text, targetLang, {
    sourceLang,
    instructions: [
      '請翻譯底下的 Prompt 內容，將其翻譯成對應語系。',
      '注意事項：',
      '- 確保換行或空白或其他符號都要維持原狀',
      '- 當內容出現類似 __VAR__ 的格式時，請將期維持原狀',
      '- 最後將翻譯結果以 JSON 格式回傳',
    ].join('\n'),
    langInstructions: getLangConfig(targetLang).instructions || ''
  });
  return res
}