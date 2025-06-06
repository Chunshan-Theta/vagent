import * as convApi from '@/db/api/conv';
import { NextResponse } from "next/server";
import formidable, { File } from 'formidable';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

import suuid from 'short-uuid'

const tmpDir = './local/tmp';

export async function POST(req: Request, { params }: { params: { convId: string } }) {
  try {
    const { convId } = await params;
    const fd = await req.formData();
    const type = fd.get('type') || 'audio/wav';
    const duration = (getNumber(fd, 'duration') || 0);
    const audioData = fd.get('audio')
    if (!audioData || !(audioData instanceof File)) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    // 先暫存檔案到本地
    const filePath = path.join('./local/tmp', suuid.generate());
    await fs.mkdir(tmpDir, { recursive: true });
    const removeTmpFile = () => {
      fs.unlink(filePath).catch(err => console.error('Error deleting temp file:', err));
    }
    try{
      const res = await convApi.uploadConvAudio(filePath, convId, type as string, duration);
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

function getNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  if (value === null) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}