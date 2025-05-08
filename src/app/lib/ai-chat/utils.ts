
import type { TranscriptItem } from "@/app/types";

import { sharedConfig } from "@/app/agentConfigs";


const { sttPrompt, startAsk } = sharedConfig;
  /**
   * 確保文字並不是直接重複 stt prompt 的內容
   * @param text 
   * @returns 
   */
export function sttTextValid(text:string){
  text = (text || '').trim();
  const invalid = text === "接著繼續" ||
    text === "以下是來自於台灣人的對話" ||
    text === startAsk ||
    text === sttPrompt || 
    text.length < 1;
  return !invalid;
}
  
type getChatHistoryTextOptions = {
  roleMap?: {[role:string]: string};
}
export function getChatHistoryText(transcriptItems: TranscriptItem[], opts: getChatHistoryTextOptions = {}){
  const roleMap = opts.roleMap || {}
  
  const chatHistory = transcriptItems
    .filter(item => item.type === 'MESSAGE')
    .filter(item => {
      // Skip messages that should be hidden
      const content = item.title || '';
      return sttTextValid(content);
    })
    .map(item => {
      const content = (item.title || '').replace(/\n/g, ' ').trim();
      const role = item.role || 'user';
      const roleName = roleMap[role] || role;
      return `${roleName}: ${content}`;
    })
    .join('\n\n');
  return chatHistory;
}

type handleAnalysisExamplesOptions = {
  roleMap?: {[role:string]: string};
}
export function handleAnalysisExamples(examples:string[], opts: handleAnalysisExamplesOptions = {}){
  const roleMap = opts.roleMap || {}
  examples = examples || [];
  return examples.map((example)=>{
    example = example || '';
    if(roleMap.user){
      example = example.replace(/^[uU]ser[:：]/, `${roleMap.user}: `)
    } else if(roleMap.assistant){
      example = example.replace(/^[aA]ssistant[:：]/, `${roleMap.assistant}: `)
    }

    return example
  })
}