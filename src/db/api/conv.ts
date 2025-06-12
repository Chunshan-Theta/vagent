import * as orm from '../orm'
import path from 'path';

import { getStorage } from '../storage'

import trimStart from 'lodash/trimStart';

import suuid from 'short-uuid';


const M = orm.models;

type createConvOptions = {
  uid?: number;
  email?: string;
  uname?: string;
  agentType?: string;
  agentId: string;
}

export async function createConv(opts: createConvOptions){
  const { uid, email = null, uname = null, agentType = 'default', agentId } = opts;
  const res = await conflitRetry(async () => {
    return await M.Conv.query().insert({
      id: suuid.generate(),
      uid: uid || null,
      email,
      uname,
      agentType,
      agentId,
      createdAt: orm.fn.now(),
    });
  });

  return res;
}

type addConvMessageOpts = {
  
  convId: string,
  type: string,
  role: 'user' | 'assistant' | 'system',
  audioRef?: string, // 音訊檔案的引用
  audioStartTime?: number, // 音訊長度（豪秒，選填）
  content: string
}
export async function addConvMessage(opts: addConvMessageOpts){
  const { convId, type, role, audioRef, audioStartTime, content } = opts;
  const res = await M.ConvMessage.query().insert({
    convId: convId,
    type,
    role: role,
    audioRef: audioRef || null,
    audioStartTime: audioStartTime ?? null,
    content: content,
    createdAt: orm.fn.now(),
  })
  return res;
}

export async function patchConvMessageContent(messageId: string, content: string){
  const res = await M.ConvMessage.query().findById(messageId).patch({
    content: content,
  });
  return res;
}

export async function setConvAnalysis(convId: string, name: string, analysis: string){
  // insert or update conv analysis
  const res = await M.ConvAnalysis.query().insert({
    convId: convId,
    name: name,
    analysis: analysis
  })
  return res;
}

export async function getConvAnalysis(convId: string, name: string){
  const res = await M.ConvAnalysis.query()
    .where('conv_id', convId)
    .where('name', name)
    .first();
  return res;
}

export async function uploadConvAudio(filepath: string, convId: string, name: string, mime: string, duration: number = 0){
  // 建立 ConvAudio 記錄
  const res = await conflitRetry(async () => {
    return await M.ConvAudio.query().insert({
      id: suuid.generate(),
      convId,
      name,
      duration,
      mime: mime || 'audio/wav',
      state: 'pending',
      createdAt: orm.fn.now(),
      updatedAt: orm.fn.now(),
    });
  });
  
  try{
    const dest = getAudioDest();
    const storage = dest.storage;
    
    // 上傳至 storage
    const destPath = `${dest.path}/${res.id}`;
    console.log(`Uploading audio file: ${path.basename(filepath)} to ${destPath}`);
    await storage.uploadFile(filepath, destPath, {
      contentType: mime,
    });
    
    // 紀錄上傳後的位置
    await M.ConvAudio.query().findById(res.id).patch({
      uri: `${dest.uriKey}://${trimStart(destPath, '/')}`,
      state: 'ready',
      updatedAt: orm.fn.now(),
    });

  }catch(e){
    // Handle error, e.g., set state to 'error'
    await M.ConvAudio.query().findById(res.id).patch({
      state: 'failed',
      updatedAt: orm.fn.now(),
    });
    throw e;
  }

  return res;
}


export async function getConvAudios(convId: string){
  const res = await M.ConvAudio.query().where('conv_id', convId).orderBy('created_at', 'asc');
  return res;
}

export async function getConvAudioByIndex(convId: string, name: string, index: number){
  const res = await M.ConvAudio.query()
    .where('conv_id', convId)
    .where('name', name)
    .orderBy('created_at', 'asc').offset(index).limit(1);
  if(res.length === 0){
    return null;
  }
  return res[0];
}

async function conflitRetry<T>(
  func: () => Promise<T>,
  retries: number = 3,
) : Promise<T> {
  let attempts = 0;
  while(attempts < retries){
    try{
      const res = await func();
      return res;
    }catch(err){
      const e = err as any;
      if(e.code === '23505' || (e.message && e.message.includes('unique'))) {
        attempts++;
        if(attempts >= retries){
          throw e;
        }
      }else{
        throw e;
      }
    }
  }
  // 不應該有任何可能執行到這邊
  throw new Error('系統異常，請稍後再試');
}

function getAudioDest(){
  const storage = getStorage();
  return {
    storage,
    uriKey: storage.type,
    path: '/_upload/p_audios'
  }
}

