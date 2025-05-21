import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { missionModules } from '@/app/s-lib/ai-analysis/missions';

// 讀取 src\app\s-lib\ai-analysis\missions 裡面的所有任務ID 並回傳


type Mission = {
  id: string;
}

export async function GET() {
  try {
    const missionIds: string[] = Object.keys(missionModules);
    const missionsP = missionIds.map(async (id)=>{
      const m = missionModules[id];
      return {
        id,
        paramsDefine: m.defineParams ? m.defineParams() : null,
      } as Mission
    })
    const missions = await Promise.all(missionsP);
    return NextResponse.json({ items: missions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read missions directory.' }, { status: 500 });
  }
}


