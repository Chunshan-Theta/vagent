
import * as landbankSentiment from './landbank/sentiment'
import { MissionModule, ModelOptions, AskRequest } from './types'
import OpenAI from 'openai';

import { missionModules } from './missions'

export type {
  AskRequest
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const defaultModelOptions: ModelOptions = {
  platform: 'openai',
  model: 'gpt-4o',
  temperature: 0.2,
  top_p: 0.7,
  max_tokens: 2000,
}


export async function chatCompletion(req: AskRequest){

  const mModule = missionModules[req.missionId] as MissionModule
  if(!mModule){
    throw new Error(`Module ${req.missionId} not found`)
  }
  const responseFormat = req.responseType || 'text'
  if(responseFormat === 'json_schema' && !mModule.expectSchema){
    throw new Error(`Module ${req.missionId} does not support response format ${responseFormat}`)
  }
  const params = req.params || {}
  if(typeof params !== 'object'){
    throw new Error(`Module ${req.missionId} params must be an object`)
  }
  const options = completeOptions([req.modelOptions], defaultModelOptions)
  
  const jsonSchema = mModule.expectSchema ? await mModule.expectSchema(params) : null

  if(responseFormat === 'json_schema' && !jsonSchema){
    throw new Error(`Module ${req.missionId} does not support response format ${responseFormat}`)
  }
  if(jsonSchema && !jsonSchema.name){
    jsonSchema.name = 'ai_response'
  }

  const responseFormatObj = responseFormat === 'json_schema' ? 
    { type: "json_schema", json_schema: { name: jsonSchema!.name, schema: jsonSchema!.schema, strict: !!jsonSchema!.strict } } :
    { type: responseFormat }


  const messages = await mModule.getMessages(params)
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: options.model!,
    temperature: options.temperature,
    top_p: options.top_p,
    max_tokens: options.max_tokens,
    stream: false,
    response_format: responseFormatObj as any
  });


  const output = completion.choices[0].message.content || '';
  const json = responseFormat !== 'text' ? tryJSONParse(output) : null

  return {
    missionId: req.missionId,
    output,
    json
  }
}



/**
 * 
 * 假如某個參數希望帶入預設值，請填 null
 * 
 * @param optList 
 * @param defaultOption 
 * @returns 
 */
export function completeOptions(optList: Array<ModelOptions|null|undefined>, defaultOption: ModelOptions): ModelOptions {
  const opts = {...defaultOption} as ModelOptions;

  for(const opt of optList){
    if(!opt) continue;
    for(const key in opt){
      const optKey = key as keyof ModelOptions;
      if(optKey in opts && opt[optKey] !== undefined){
        if ( opt[optKey] === null ){
          opts[optKey] = defaultOption[optKey] as any;
        } else {
          opts[optKey] = opt[optKey] as any;
        }
      }
    }
  }

  return opts
}

function tryJSONParse(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}