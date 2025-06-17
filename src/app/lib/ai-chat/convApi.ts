import qq from 'querystring'
// src/app/lib/ai-chat/convApi.ts

export interface CreateConvParams {
  email?: string;
  uname?: string;
  agentType: string;
  agentId: string;
}

export interface Conv {
  id: string;
  uid?: number | null;
  email?: string | null;
  uname?: string | null;
  agentType: string;
  agentId: string;
  createdAt: string;
  // 其他欄位可依需求擴充
}

export interface ConvAudio {
  id: string
  convId: string
  name: string
  mime: string
  duration: number
  uri?: string
  info?: string
  state: string
  createdAt: Date
  updatedAt: Date
  url?: string; // 假設返回的音訊資料中包含 URL
}

/**
 * 建立新的 conv
 */
export async function createConv(params: CreateConvParams): Promise<Conv> {
  const res = await fetch('/api/conv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export interface UploadConvAudioResult {
  item: {
    id: string;
    createdAt: string;
  }
}

/**
 * 上傳 conv audio (新版，支援 type/duration/audio)
 * @param audio 音訊檔案
 * @param convId 對話 ID
 * @param type 檔案類型（如 audio/wav）
 * @param duration 音訊長度（秒，選填）
 */
export async function uploadConvAudio(
  audio: Blob | File,
  convId: string,
  name: string,
  type: string = 'audio/wav',
  duration?: number
): Promise<UploadConvAudioResult> {
  const formData = new FormData();
  formData.append('audio', audio);
  formData.append('name', name);
  formData.append('type', type);
  if (duration !== undefined) formData.append('duration', String(duration));
  const res = await fetch(`/api/conv/${convId}/audio`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}


type addConvMessageOptions = {
  type: string; // 如 'text', 'audio' 等
  role: 'user' | 'assistant' | 'system';
  content: string; // 對話內容或音訊 URL
  audioRef?: string | null; // 音訊檔案的引用 ID（如果有）
  audioStartTime?: number | null; // 音訊長度（豪秒，選填）
};

/**
 * 新增對話訊息
 */
export async function addConvMessage(convId: string, opts: addConvMessageOptions): Promise<any> {
  const { type, role, content, audioRef, audioStartTime } = opts;
  if (!type || !role) {
    throw new Error('type, role, and content are required fields');
  }
  const res = await fetch(`/api/conv/${convId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, role, content, audioRef, audioStartTime }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function updateConvMessageContent(convId: string, msgId: string, content: string): Promise<any> {
  const res = await fetch(`/api/conv/${convId}/message/${msgId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

/**
 * 取得對話訊息列表
 */
export async function getConvMessages(convId: string): Promise<any[]> {
  const res = await fetch(`/api/conv/${convId}/message`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function getConvAudioByIndex(convId: string, name: string, index: number) {
  const query = qq.encode({
    name,
    index
  })

  const res = await fetch(`/api/conv/${convId}/audio?${query}`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as { item: ConvAudio };
}


type getAudioByRefStringOptions = {
  convId?: string;
  name?: string;
};
export async function getAudioUrlByRefString(ref: string, opts: getAudioByRefStringOptions = {}): Promise<string | null> {
  if(!ref) {
    return null
  }
  if(ref.startsWith('http://') || ref.startsWith('https://')) {
    return ref; // 如果已經是完整的 URL，直接返回
  }
  if(ref.startsWith('conv:')) {
    const m = ref.match(/^conv:(\d+)$/);
    if(m){
      const indexStr = m[1];
      const index = parseInt(indexStr, 10);
      if(!opts.convId || !opts.name){
        throw new Error('convId and name are required for conv audio reference');
      }
      const convId = opts.convId;
      const audioData = await getConvAudioByIndex(convId, opts.name!, index); // 假設只取第一個音訊
      return audioData.item?.url || null; // 返回音訊 URL
    }
  }
  return null; // 如果不是有效的 ref，返回 null
}

export async function getAudioInfoByRefString(ref: string, opts: getAudioByRefStringOptions = {}): Promise<string | null> {
  if(ref.startsWith('conv:')) {
    const m = ref.match(/^conv:(\d+)$/);
    if(m){
      const indexStr = m[1];
      const index = parseInt(indexStr, 10);
      if(!opts.convId || !opts.name){
        throw new Error('convId and name are required for conv audio reference');
      }
      const convId = opts.convId;
      const audioData = await getConvAudioByIndex(convId, opts.name!, index); // 假設只取第一個音訊
      return audioData.item.info || null;  // 返回音訊 Info
    }
  }
  return null; // 如果不是有效的 ref，返回 null
}