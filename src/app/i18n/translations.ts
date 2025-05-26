export const SUPPORTED_LANGUAGES = ['en', 'zh', 'es', 'fr', 'de', 'ja'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];
export type LanguageLabel = `${Language}_label`;

export const translations = {
  languages_label: {
    en_label: {
      en: 'English',
      zh: '英文',
      es: 'Inglés',
      fr: 'Anglais',
      de: 'Englisch',
      ja: '英語'
    },
    zh_label: {
      en: 'Chinese',
      zh: '中文',
      es: 'Chino',
      fr: 'Chinois',
      de: 'Chinesisch',
      ja: '中国語'
    },
    es_label: {
      en: 'Spanish',
      zh: '西班牙文',
      es: 'Español',
      fr: 'Espagnol',
      de: 'Spanisch',
      ja: 'スペイン語'
    },
    fr_label: {
      en: 'French',
      zh: '法文',
      es: 'Francés',
      fr: 'Français',
      de: 'Französisch',
      ja: 'フランス語'
    },
    de_label: {
      en: 'German',
      zh: '德文',
      es: 'Alemán',
      fr: 'Allemand',
      de: 'Deutsch',
      ja: 'ドイツ語'
    },
    ja_label: {
      en: 'Japanese',
      zh: '日文',
      es: 'Japonés',
      fr: 'Japonais',
      de: 'Japanisch',
      ja: '日本語'
    }
  },

  // UI Labels
  labels: {
    language: {
      en: 'Language',
      zh: '語言',
      es: 'Idioma',
      fr: 'Langue',
      de: 'Sprache',
      ja: '言語'
    }
  },

  // Error messages
  errors: {
    agent_not_found: {
      en: 'Agent not found',
      zh: '找不到代理',
      es: 'Agente no encontrado',
      fr: 'Agent non trouvé',
      de: 'Agent nicht gefunden',
      ja: 'エージェントが見つかりません'
    },
    failed_to_load: {
      en: 'Failed to load agent',
      zh: '無法載入代理',
      es: 'Error al cargar el agente',
      fr: 'Échec du chargement de l\'agent',
      de: 'Fehler beim Laden des Agenten',
      ja: 'エージェントの読み込みに失敗しました'
    }
  },

  // Info messages
  info: {
    try_to_load_agent: {
      en: 'Try to load agent...',
      zh: '嘗試載入代理...',
      es: 'Intentando cargar el agente...',
      fr: 'Essayer de charger l\'agent...',
      de: 'Versuche, den Agenten zu laden...',
      ja: 'エージェントを読み込んでいます...'
    }
  },

  // Analysis related messages
  analysis: {
    analyzing: {
      en: 'Analyzing conversation...',
      zh: '正在分析對話...',
      es: 'Analizando conversación...',
      fr: 'Analyse de la conversation...',
      de: 'Analysiere Konversation...',
      ja: '会話を分析中...'
    },
    failed: {
      en: 'Failed to analyze conversation. Please try again.',
      zh: '分析對話失敗。請重試。',
      es: 'Error al analizar la conversación. Por favor, inténtelo de nuevo.',
      fr: 'Échec de l\'analyse de la conversation. Veuillez réessayer.',
      de: 'Fehler bei der Analyse des Gesprächs. Bitte versuchen Sie es erneut.',
      ja: '会話の分析に失敗しました。もう一度お試しください。'
    }
  },

  // Actions
  ai_chatbot_action: {
    stop_call: {
      en: 'Stop call',
      zh: '停止通話',
      es: 'Detener llamada',
      fr: 'Arrêter appel',
      de: 'Anruf beenden',
      ja: '通話を終了'
    },
    wait_for_response: {
      en: 'System is responding, please wait for the response to complete before pausing.',
      zh: '系統回應中，需等待回應完成後再暫停對話。',
      es: 'El sistema está respondiendo, espere a que se complete la respuesta antes de pausar.',
      fr: 'Le système répond, veuillez attendre la fin de la réponse avant de mettre en pause.',
      de: 'Das System antwortet, bitte warten Sie auf den Abschluss der Antwort bevor Sie pausieren.',
      ja: 'システムが応答中です。応答が完了するまでお待ちください。'
    },
    sttPrompt: {
      en: 'The speaker of the following audio is a native English speaker. Please convert the audio to text.',
      zh: '以下語音的說話者是台灣人，請將語音轉換為文字。',
      es: 'El hablante del siguiente audio es un hablante nativo de español. Por favor, convierta el audio a texto.',
      fr: 'Le locuteur de l\'audio suivant est un locuteur natif de français. Veuillez convertir l\'audio en texte.',
      de: 'Der Sprecher des folgenden Audios ist ein nativer Sprecher von deutsch. Bitte konvertieren Sie den Audio in Text.',
      ja: '以下の音声は日本語ネイティブスピーカーです。音声をテキストに変換してください。'
    }
  },

  // Chat view states
  chat_view: {
    not_started: {
      en: 'Not Started',
      zh: '對話未開始',
      es: 'No iniciado',
      fr: 'Non démarré',
      de: 'Nicht gestartet',
      ja: '開始していません'
    },
    enter_message: {
      en: 'Please enter here...',
      zh: '請輸入對話',
      es: 'Por favor, escriba aquí...',
      fr: 'Veuillez écrire ici...',
      de: 'Bitte hier eingeben...',
      ja: 'ここに入力してください...'
    },
    end_and_analyze: {
      en: 'End and Start Analysis',
      zh: '結束並開始分析',
      es: 'Finalizar y comenzar análisis',
      fr: 'Terminer et commencer l\'analyse',
      de: 'Beenden und Analyse starten',
      ja: '終了して分析を開始'
    }
  }

} as const;

export type NestedTranslationKeys<T> = T extends object ? {
  [K in keyof T]: `${string & K}${T[K] extends object ? `.${NestedTranslationKeys<T[K]>}` : ''}`
}[keyof T] : never;

export type TranslationKey = NestedTranslationKeys<typeof translations>;

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let result: any = translations;
  
  // Special handling for language labels
  if (keys[0] === 'languages_label') {
    const langKey = `${keys[1]}_label` as LanguageLabel;
    if (langKey in translations.languages_label) {
      return translations.languages_label[langKey][lang];
    }
  }
  
  // Normal translation lookup
  for (const k of keys) {
    if (!(k in result)) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    result = result[k];
  }
  
  if (typeof result === 'object' && lang in result) {
    return result[lang];
  }
  
  console.warn(`No translation found for language ${lang} with key ${key}`);
  return key;
} 