import * as convApi from '../../convApi';
import * as agentApi from '../../agentApi';
import { fetchAllAgentSettings } from '../../reportHelper';
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

  const { criteria, context, role, weights } = await getSettings(agentId, agentType)

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
  const res = await analyzeChatHistoryByRubric(criteria, weights, context, role, messages.map(m => m.content).join('\n'), 'zh-TW')

  timer && clearInterval(timer);
  updateProgress(100);

  return {
    status: 'done',
    data: res
  }
}


async function analyzeChatHistoryByRubric(criteria: string | undefined, weights: number[] | undefined, context: string, role: string, chatHistory: string, clientLanguage: string) {
  if (!criteria) {
    criteria = '使用者本身是否是進行良性的溝通';
  }
  if (!weights || weights.length !== 4) {
    weights = [0.5, 0.5, 0.5, 0.5];
  }
  if (!context) {
    context = '以下是一份 user 和 assistant 的對話紀錄。';
  }
  const response = await fetch('/api/analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: chatHistory,
      role,
      context,
      rubric: {
        criteria,
        weights,
      },
      detectedLanguage: clientLanguage,
    }),
  });

  return response.json();
}

/**
 * 取得評分用的參數
 * @param agentId 
 * @param agentType 
 * @returns 
 */
async function getSettings(agentId: string, agentType: string) {

  const results = {
    criteria: '',
    context: '',
    role: '',
    weights: [0.5, 0.5, 0.5, 0.5]
  }
  // 如果是一般 Agent，可直接從資料庫中取得設定
  // 這種狀況可以直接使用 applySettings() 來套用設定

  // 如果要套用特定 agent 的設定可以參考 landbank-v2 的寫法

  // 如果是直接靜態資料可以參考 newdean-v1 的做法

  if (agentType === 'static') {
    if (agentId === 'newdean-v1') {
      const m = await import('./newdean-v1.data')
      const res = await m.getSettings()
      results.criteria = res.criteria;
      results.context = res.context;
      results.role = res.role;
    } else if (agentId === 'landbank') {
      const m = await import('./landbank.data')
      const res = await m.getSettings()
      results.criteria = res.criteria;
      results.context = res.context;
      results.role = res.role;
    } else if (agentId === 'landbank-v2') {
      await applySettings({
        agentId: '2ab59d3f-e096-4d82-8a99-9db513c04ca1',
      })
    } else if (agentId === 'deltaww-v1') {
      const m = await import('./deltaww-v1.data')
      const res = await m.getSettings()
      results.criteria = res.criteria;
      results.context = res.context;
      results.role = res.role;
    } else if (agentId === 'deltaww-v3') {
      const m = await import('./deltaww-v3.data')
      const res = await m.getSettings()
      results.criteria = res.criteria;
      results.context = res.context;
      results.role = res.role;
    } else if (false) {
      // 其他靜態 Agent 的設定可在此手動添加
    } else {
      throw new Error(`Unknown static agent ID: ${agentId}`);
    }

  } else if (agentType === 'agent') {
    await applySettings()
  } else {
    throw new Error(`Unknown agent type: ${agentType}`);
  }

  return results

  // --- utils ---

  async function getInfo(agentId: string) {
    const agent = await agentApi.getAgent(agentId).catch((err) => {
      console.warn('getAgent error', err);
      return null;
    });
    const res = await fetchAllAgentSettings(agentId)
    const settings = res.values || {};
    return {
      agent,
      settings
    }
  }
  type useSettingsOptions = {
    agentId?: string,
    /** 影響 criteria 會優先使用 agent.criteria 還是 settings 裡面的 criteria */
    criteriaPrefer?: 'agent' | 'settings'
  }
  /**
   * 直接套用某個 Agent 的評分設定
   * @param opts 
   * @returns 
   */
  async function applySettings(opts: useSettingsOptions = {}) {
    const criteriaPrefer = opts.criteriaPrefer || 'agent';
    const mAgentId = opts.agentId || agentId;
    const { agent, settings } = await getInfo(mAgentId);
    const obj = {
      criteria: agent?.criteria || settings['reportAnalyze.criteria'] || 'user 本身是否是進行良性的溝通',
      context: settings['reportAnalyze.context'] || '以下是一份 user 和 assistant 的對話紀錄。',
      roleSelf: settings['reportAnalyze.roleSelf'] || 'user',
    }
    if (criteriaPrefer === 'settings') {
      obj.criteria = settings['reportAnalyze.criteria'] || agent?.criteria || 'user 本身是否是進行良性的溝通';
    }
    Object.assign(results, obj);
    return obj;
  }
}