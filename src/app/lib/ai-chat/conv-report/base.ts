import * as convApi from '@/app/lib/ai-chat/convApi';
import type * as T from './types';

import * as analysisV1 from './analysis-v1/analysis-v1';

const reportHandlerMap = {
  'analysis-v1': analysisV1
}
export async function runAnalysis(name: string, convId: string, opts: T.runAnalysisOptions = {}) {
  if (!(name in reportHandlerMap)) {
    throw new Error(`Analysis type "${name}" not found.`);
  }
  const analysisName = name as keyof typeof reportHandlerMap;

  const onEvent = opts.onEvent || (() => { });

  const conv = await convApi.getConvById(convId);
  if (!conv) {
    throw new Error(`Conversation with ID ${convId} not found.`);
  }
  const stopSignal = opts.stopSignal || (() => false);
  const ctx: T.AnalysisContext = {
    convId,
    analysisName,
    conv,
    stopSignal,
    updateProgress: (progress) => {
      if (!stopSignal()) {
        onEvent('progress', { progress });
      }
    }
  }

  const handler = reportHandlerMap[analysisName];
  const result = await handler.runAnalysis(ctx) as any;

  if (result?.status === 'cancel') {
    return result
  }

  await convApi.setConvAnalysis(convId, name, result)

  return {
    conv,
    status: result.status,
    data: result.data,
  }
}