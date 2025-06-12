
import { getTranslation, Language } from "@/app/i18n/translations";
import { AgentConfig, Tool, TranscriptItem } from "@/app/types";

import * as utils from '@/app/class/utils';

export async function setAgentSettings(agentId:string, keyVal: Record<string, string>): Promise<void> {
  if(Array.isArray(keyVal) || typeof keyVal !== 'object') {
    throw new Error(getTranslation('en', 'errors.invalid_settings_format'));
  }
  const response = await fetch(`/api/agents/${agentId}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: keyVal }),
  });

  if (!response.ok) {
    throw new Error(getTranslation('en', 'errors.failed_to_save_settings'));
  }
}

export async function getAgentSettings(agentId: string, keys:string[]): Promise<{ success:boolean, values: Record<string, string> }> {
  const response = await fetch(`/api/agents/${agentId}/settings?keys=${keys.join(',')}`);
  if (!response.ok) {
    throw new Error(getTranslation('en', 'errors.failed_to_load_settings'));
  }
  const data = await response.json();
  return {
    success: !!data.success,
    values: data.values || {},
  };
}

export async function fetchAgentConfig(agentId: string, clientLanguage: Language): Promise<AgentConfig> {
  const response = await fetch(`/api/agents/${agentId}`);
  if (!response.ok) {
    throw new Error(getTranslation(clientLanguage, 'errors.failed_to_load'));
  }
  const data = await response.json();
  const agentConfig = await createAgentConfig(data.agent, clientLanguage);
  return agentConfig;
}

export async function translateToLanguage(text: string, targetLang: Language): Promise<string> {
  // Only use cache in browser environment
  const isBrowser = typeof window !== 'undefined';
  // Generate a cache key based on text and target language
  const cacheKey = `translation_${targetLang}_${encodeURIComponent(text)}`;

  if (isBrowser) {
    // Check cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const result = await response.json();
    // Cache the result only in browser
    if (isBrowser) {
      localStorage.setItem(cacheKey, result.translatedText);
    }
    return result.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text if translation fails
  }
}

async function createAgentConfig(apiResult: any, lang?: Language): Promise<AgentConfig> {
  // Convert tools to full Tool objects and build toolLogic
  const toolConfig = utils.handleApiTools(apiResult.tools)

  const promptName = apiResult.prompt_name;
  const promptPersonas = apiResult.prompt_personas;
  const promptCustomers = apiResult.prompt_customers;
  const promptToolLogics = apiResult.prompt_tool_logics;
  const promptVoiceStyles = apiResult.prompt_voice_styles;
  const promptConversationModes = apiResult.prompt_conversation_modes;
  const promptProhibitedPhrases = apiResult.prompt_prohibited_phrases;

  let instructions = `
  Now, please play the role of ${promptName}, here are your role and more details:
  ## Your Role: ${promptName}
  ${promptPersonas}
  ## Your Conversation Partner
  ${promptCustomers}
  ## Your Tool Usage Rules and Instructions
  ${promptToolLogics}
  ## Your Voice Style
  ${promptVoiceStyles}
  ## Your Conversation Mode
  ${promptConversationModes}
  ## Your Prohibited Phrases
  ${promptProhibitedPhrases}

  !Note: You will speak in ${lang} language, please respond in ${lang} language.
  `;
  console.log('instructions source', instructions);

  instructions = await translateToLanguage(instructions, lang || 'zh');
  console.log('instructions translated', instructions);


  return {
    ...apiResult,
    name: apiResult.name,
    publicDescription: apiResult.public_description,
    instructions,
    tools: toolConfig.tools,
    toolLogic: toolConfig.toolLogic,
    lang: lang || "zh",
  };
}
