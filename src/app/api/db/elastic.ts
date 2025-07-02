import { ElasticService } from '@/lib/elastic-service';
import { v4 as uuidv4 } from "uuid";

export const elasticService = new ElasticService(
  process.env.NEXT_PUBLIC_ELASTIC_URL || 'https://voiss-98689.zeabur.app',
  'voiss-user-logs'
);

export const getDefaultEventContext = () => ({
  user: {
    user_id: null,
    anonymous_id: 'system',
    session_id: 'system'
  },
  client_device: {
    platform: 'api' as const,
    device: 'server',
    os: process.platform,
    browser: 'node',
    language: 'en',
    app_version: process.env.npm_package_version || '1.0.0',
    env: 'prod' as const,
    network: {
      ip: '127.0.0.1',
      user_agent: 'node-server'
    }
  },
  event_situation: {
    trigger_url: '/api/chat/completions',
    trigger_dom: 'server'
  }
});

export const logAICompletion = async (
  completion: any,
  params: {
    missionId: string;
    model: string;
    responseFormat: string;
    messages: any[];
    startTime: number;
  }
) => {
  const defaultContext = getDefaultEventContext();
  
  await elasticService.insertEvent({
    '@timestamp': new Date().toISOString(),
    event_name: 'chat_completion',
    event_id: `evt_${completion.id || uuidv4()}`,
    ...defaultContext,
    action: {
      action_category: 'llm',
      action_subtype: 'chat_completion',
      action_properties: {
        mission_id: params.missionId,
        model: params.model,
        response_format: params.responseFormat,
        completion_id: completion.id,
        prompt_tokens: completion.usage?.prompt_tokens,
        completion_tokens: completion.usage?.completion_tokens,
        total_tokens: completion.usage?.total_tokens,
        duration_ms: Date.now() - params.startTime
      },
      body: {
        params,
        messages: params.messages,
        response: completion.choices[0].message
      }
    },
    message: {
      error: false,
      content: '',
      code: 200
    }
  });
};

export const logAIError = async (
  error: any,
  params: {
    missionId: string;
    startTime: number;
    requestParams?: any;
  }
) => {
  const defaultContext = getDefaultEventContext();

  await elasticService.insertEvent({
    '@timestamp': new Date().toISOString(),
    event_name: 'chat_completion_error',
    event_id: `evt_error_${Date.now()}`,
    ...defaultContext,
    action: {
      action_category: 'llm',
      action_subtype: 'chat_completion_error',
      action_properties: {
        mission_id: params.missionId,
        error_message: error.message,
        error_name: error.name,
        duration_ms: Date.now() - params.startTime
      },
      body: {
        params: params.requestParams,
        stack: error.stack
      }
    },
    message: {
      error: true,
      content: error.message,
      code: error.status || 500
    }
  });
}; 