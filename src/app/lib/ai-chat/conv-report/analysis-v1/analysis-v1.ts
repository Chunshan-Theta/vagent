import * as convApi from '../../convApi';
import type * as T from '../types';


export async function runAnalysis(ctx: T.AnalysisContext) {
  const { convId, updateProgress } = ctx;
  const conv = ctx.conv!;
  const { agentType, agentId } = conv;
  const messages = await convApi.getConvMessages(convId)
  if (!messages || messages.length === 0) {
    throw new Error(`No messages found for conversation ID ${convId}.`);
  }
  if (ctx.stopSignal()) {
    return { status: 'cancel' };
  }

  const { criteria, context, role } = await getSettings(agentId, agentType)

  const state = {
    progress: 0
  }

  const timer = setInterval(() => {
    if (ctx.stopSignal()) {
      clearInterval(timer);
      return;
    }
    // 自動增加假的進度
    if (state.progress < 100) {
      // 距離100越近，增加越少
      let increment = 0;
      const mt = 0.5
      if (state.progress > 80) increment = 1 * mt;
      else if (state.progress > 60) increment = 2 * mt;
      else if (state.progress > 40) increment = 4 * mt;
      else if (state.progress > 20) increment = 6 * mt;
      else increment = 10 * mt;
      state.progress = Math.min(100, state.progress + increment);
      updateProgress(state.progress);
    } else {
      clearInterval(timer);
    }
  }, 500)
  const res = await analyzeChatHistoryByRubric(criteria, role, messages.map(m => m.content).join('\n'), 'zh-TW')
  
  timer && clearInterval(timer);
  updateProgress(100);

  return {
    status: 'done',
    data: res
  }
}


async function analyzeChatHistoryByRubric(criteria: string | undefined, role: string, chatHistory: string, clientLanguage: string) {
  if (!criteria) {
    criteria = '使用者本身是否是進行良性的溝通';
  }

  const weights = [0.5, 0.5, 0.5, 0.5];

  const response = await fetch('/api/analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: chatHistory,
      role,
      // context: `對話紀錄中 user 的角色是主管，assistant 扮演部門溝通的角色。請根據對話紀錄來分析主管和部門溝通的情況。`,
      context: `對話紀錄中 user 的角色是主管，而對方是部門內的成員的角色。請根據 user 說的話來分析部門溝通的情況。`,
      rubric: {
        criteria,
        weights,
      },
      detectedLanguage: clientLanguage,
    }),
  });

  return response.json();
}

async function getSettings(agentId: string, agentType: string) {

  const results = {
    criteria: '',
    context: '',
    role: '',
  }

  if (agentType === 'static') {
    if (agentId === 'newdean-v1') {
      const m = await import('./newdean-v1.data')
      const res = await m.getSettings()
      results.criteria = res.criteria;
      results.context = res.context;
      results.role = res.role;
    }
  }

  return results
}