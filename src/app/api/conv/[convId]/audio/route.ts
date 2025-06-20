import * as convApi from '@/db/api/conv';
import { NextResponse } from "next/server";
import formidable, { File } from 'formidable';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { analyzeAudioEmotion } from '@/lib/audio-emotion-analyzer';

import suuid from 'short-uuid'

const tmpDir = './local/tmp';

/**
 * 上傳 conv 的音訊檔案
 * @param req 
 * @param param1 
 * @returns 
 */
export async function POST(req: Request, { params }: AsyncRouteContext<{ convId: string }>) {
  try {
    const { convId } = await params;
    const fd = await req.formData();
    const name = fd.get('name') as string | null;
    if (!name) {
      return NextResponse.json({ error: '"name" parameter is required' }, { status: 400 });
    }
    const type = fd.get('type') || 'audio/wav';
    const duration = (getNumber(fd, 'duration') || 0);
    const audioData = fd.get('audio') as Blob | null
    // console.log('Received audio data:', audioData);
    if (!audioData) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    // 先暫存檔案到本地
    const filePath = path.join('./local/tmp', suuid.generate());
    await fs.mkdir(tmpDir, { recursive: true });

    // 將 audioData 寫入本地檔案
    const arrayBuffer = await audioData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const removeTmpFile = () => {
      fs.unlink(filePath).catch(err => console.error('Error deleting temp file:', err));
    }
    
    // 進行語音分析
    let analysisInfo: string | undefined;
    try {
      const [emotionResult, analysisResult] = await Promise.allSettled([
        analyzeAudioEmotion(buffer, type as string),
        analyzeAudioEmotion(buffer, type as string, "你是一位專業語音表現評估員，請根據下列規則，針對每一句音訊內容進行逐句評分。 請務必逐句回傳，且每句都針對下列15項指標分別給出：1. 評分理由（簡明扼要、用括號包裹），2. 0-100分的分數。 所有回覆必須以結構化格式呈現，格式如下，且不可省略任何欄位或更動順序。 「<第n句內容>」 - 語速控制：[<0-100>]（<評分理由簡述>） - 音量穩定性：[<0-100>]（<評分理由簡述>） - 語音清晰度：[<0-100>]（<評分理由簡述>） - 停頓運用：[<0-100>]（<評分理由簡述>） - 言語流暢性：[<0-100>]（<評分理由簡述>） - 簡潔性：[<0-100>]（<評分理由簡述>） - 關鍵訊息傳遞：[<0-100>]（<評分理由簡述>） - 語調表達：[<0-100>]（<評分理由簡述>） - 聲音能量：[<0-100>]（<評分理由簡述>） - 友善的語調：[<0-100>]（<評分理由簡述>） - 沉著穩定：[<0-100>]（<評分理由簡述>） - 正向情緒傳達：[<0-100>]（<評分理由簡述>） - 聲音個性：[<0-100>]（<評分理由簡述>） - 聲音穩定性：[<0-100>]（<評分理由簡述>） - 聲音表現力：[<0-100>]（<評分理由簡述>）")
      ]);

      const mergedAnalysis: any = {};

      if (emotionResult.status === 'fulfilled') {
        mergedAnalysis.emotion = emotionResult.value.analysis;
        console.log('Audio emotion analysis completed:', emotionResult.value.analysis);
      } else {
        console.warn('Audio emotion analysis failed:', emotionResult.reason);
      }

      if (analysisResult.status === 'fulfilled') {
        mergedAnalysis.transcription = analysisResult.value.analysis;
        console.log('Audio analysis completed:', analysisResult.value.analysis);
      } else {
        console.warn('Audio analysis failed:', analysisResult.reason);
      }

      if (Object.keys(mergedAnalysis).length > 0) {
        analysisInfo = JSON.stringify(mergedAnalysis);
      }
    } catch (error) {
      console.warn('Audio analysis failed:', error);
    }

    try{
      const res = await convApi.uploadConvAudio(filePath, convId, name, type as string, duration, analysisInfo);
      removeTmpFile();
      return NextResponse.json({
        item: {
          id: res.id,
          createdAt: res.createdAt,
        }
      });
    } catch (e) {
      console.error('Error uploading conv audio:', e);
      removeTmpFile();
      return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 });
    }
    // 移除暫存檔案
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * get conv audio
 * 根據參數，回傳的可能是連結或是音訊檔案本身
 * 
 * 預設回傳連結，如果需要音訊檔案本身，則需要在 URL 中加上 `?raw=true` 參數。
 * 
 * @param req 
 * @param param1 
 */
export async function GET(req: Request, { params }: AsyncRouteContext<{ convId: string }>) {
  const { convId } = await params;
  const url = new URL(req.url);
  const audioName = url.searchParams.get('name');
  const audioIndex = url.searchParams.get('index');
  if (!audioName) {
    return NextResponse.json({ error: '"name" parameter is required' }, { status: 400 });
  }
  if (!audioIndex) {
    return NextResponse.json({ error: '"index" parameter is required' }, { status: 400 });
  }
  const index = parseInt(audioIndex, 10);
  if (isNaN(index) || index < 0) {
    return NextResponse.json({ error: '"index" must be a non-negative integer' }, { status: 400 });
  }
  try {
    const audio = await convApi.getConvAudioByIndex(convId, audioName, index);
    if (!audio) {
      return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
    }

    const reply = (audioUrl: string)=>{
      return url.searchParams.get('raw') === 'true' ? replyStream(audioUrl) : replyURL(audioUrl);
    }

    const replyStream = async (url: string) => {
      // 從 url 獲取 stream
      const res = await fetch(url);
      if (!res.body) throw new Error('No response body');
      return new Response(res.body, {
        headers: {
          'Content-Type': 'audio/wav'
        },
      });
    }

    const replyURL = (url: string)=>{
      return NextResponse.json({ item: { ...audio.toJSON(), url} }, { status: 200 });
    }

    // 根據前綴判斷檔案存在哪裡
    if(audio.uri?.match(/^vstorage:/)){ 
      // vstorage 支援
      const destPath = audio.uri.replace(/^vstorage:[\/]+/, '');
      const url = 'https://storage.googleapis.com/vagent/' + destPath;

      return await reply(url);
    } else {
      // no support
      return NextResponse.json({ error: 'Unsupported audio storage type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  

}

function getNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  if (value === null) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}