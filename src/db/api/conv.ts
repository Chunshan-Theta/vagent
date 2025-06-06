import * as orm from '../orm'
import * as fs from 'fs';

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

export async function addConvMessage(
  convId: string,
  type: string,
  role: 'user' | 'assistant' | 'system',
  content: string
){
  const res = await M.ConvMessage.query().insert({
    convId: convId,
    type,
    role: role,
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

export async function uploadConvAudio(filepath: string, convId: string, mime: string, duration: number = 0){
  // 建立 ConvAudio 記錄
  const res = await conflitRetry(async () => {
    return await M.ConvAudio.query().insert({
      id: suuid.generate(),
      convId: convId,
      duration: 1000 * duration,
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
  // 這邊檢查一下目前用的環境連哪個 DB
  
  const storage = getStorage();
  return {
    storage,
    uriKey: storage.type,
    path: '/_upload/p_audios'
  }
}

