import { useCallback, useMemo } from 'react';
import { ElasticService, UserBehaviorEvent } from '@/lib/elastic-service';
import { v4 as uuidv4 } from 'uuid';

interface UseElasticServiceProps {
  baseUrl: string;
  indexName: string;
}

export const useElasticService = ({ baseUrl, indexName }: UseElasticServiceProps) => {
  const service = useMemo(() => new ElasticService(baseUrl, indexName), [baseUrl, indexName]);

  const trackEvent = useCallback(async (
    eventName: string,
    action: Omit<UserBehaviorEvent['action'], 'body'> & { body?: Record<string, any> },
    user: UserBehaviorEvent['user'],
    clientDevice: UserBehaviorEvent['client_device'],
    eventSituation: UserBehaviorEvent['event_situation'],
    message: UserBehaviorEvent['message'] = { error: false, content: '', code: 200 }
  ) => {
    const event: UserBehaviorEvent = {
      '@timestamp': new Date().toISOString(),
      event_name: eventName,
      event_id: `evt_${uuidv4()}`,
      user,
      client_device: clientDevice,
      event_situation: eventSituation,
      action: {
        ...action,
        body: action.body || {}
      },
      message
    };

    await service.insertEvent(event);
  }, [service]);

  const searchEvents = useCallback(async (params: {
    from?: number;
    size?: number;
    sort?: Record<string, 'asc' | 'desc'>;
    query?: Record<string, any>;
  }) => {
    return service.searchEvents(params);
  }, [service]);

  return {
    trackEvent,
    searchEvents,
    buildRangeQuery: ElasticService.buildRangeQuery,
    buildTermQuery: ElasticService.buildTermQuery,
    buildMatchQuery: ElasticService.buildMatchQuery
  };
}; 