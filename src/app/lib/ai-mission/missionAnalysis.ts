import type { AskRequest, MissionParamsDefineMap } from '@/app/s-lib/ai-analysis/types';


export async function getAIMissionList() {
  try {
    const response = await fetch('/api/analysis/mission');
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const result = await response.json();
    return result.items as { id: string, paramsDefine: MissionParamsDefineMap }[];
  } catch (error) {
    console.error('Error fetching mission list:', error);
    throw error;
  }
}

export async function startAIMission(askRequest: AskRequest) {
  try {
    const missionId = askRequest.missionId;
    if (!missionId) {
      throw new Error('Mission ID is required');
    }
    const response = await fetch(`/api/analysis/mission/${encodeURIComponent(missionId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(askRequest),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching mission analysis:', error);
    throw error;
  }
}