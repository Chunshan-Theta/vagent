
export type LangConfig = { name: string, instructions?: string, alias?: string[] }
export const langConfig:{ [lang:string]: LangConfig } = {
  zh: { name: '中文', instructions: '另外請確保回應使用的是台灣人的說法。', alias: ['zh-TW'] },
  en: { name: 'English' },
  ja: { name: '日本語' },
  ko: { name: '한국어' },
  es: { name: 'Español' },
  fr: { name: 'Français' },
}

export type SupportedLang = string; // TODO: use a more specific type if possible

export function getLangConfig(lang: SupportedLang, defaultLang: SupportedLang = 'zh'): LangConfig {
  const found = findLangConfig(lang)
  if(found) {
    return found;
  }
  // 如果 defaultLang 直接寫 null，則不會有預設值
  if(!defaultLang){
    return null as any;
  }
  return langConfig[defaultLang] || langConfig.zh
}

function findLangConfig(lang: string): LangConfig | undefined {
  // 不區分大小寫
  lang = lang.toLowerCase();
  for (const key in langConfig) {
    const lcKey = key.toLowerCase();
    if(lcKey === lang) {
      return langConfig[key];
    }
    const config = langConfig[key];
    if (config.alias && config.alias.map(a => a.toLowerCase()).includes(lang)) {
      return config;
    }
  }
  return undefined;
}

export default langConfig;