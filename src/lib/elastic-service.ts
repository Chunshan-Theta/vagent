import axios from 'axios';

// Types
export interface NetworkInfo {
  ip: string;
  user_agent: string;
}

export interface ClientDevice {
  platform: 'web' | 'ios' | 'android' | 'api';
  device: string;
  os: string;
  browser: string;
  language: string;
  app_version: string;
  env: 'prod' | 'staging' | 'dev';
  network: NetworkInfo;
}

export interface UserInfo {
  user_id: string | null;
  anonymous_id: string;
  session_id: string;
}

export interface EventSituation {
  trigger_url: string;
  trigger_dom: string;
}

export interface ActionProperties {
  model?: string;
  tool_used?: string;
  prompt?: string;
  [key: string]: any;
}

export interface Action {
  action_category: string;
  action_subtype: string;
  action_properties: ActionProperties;
  body: Record<string, any>;
}

export interface Message {
  error: boolean;
  content: string;
  code: number;
}

export interface UserBehaviorEvent {
  '@timestamp': string;
  event_name: string;
  event_id: string;
  user: UserInfo;
  client_device: ClientDevice;
  event_situation: EventSituation;
  action: Action;
  message: Message;
}

export class ElasticService {
  private baseUrl: string;
  private indexName: string;
  private apiBaseUrl: string;

  constructor(baseUrl: string, indexName: string) {
    this.baseUrl = baseUrl;
    this.indexName = indexName;
    // Use window.location.origin in browser environment, use baseUrl in Node
    this.apiBaseUrl = typeof window !== 'undefined' ? window.location.origin : baseUrl;
  }

  async insertEvent(event: UserBehaviorEvent): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/${this.indexName}/_doc`, event, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to insert event to Elasticsearch:', error);
      throw error;
    }
  }

  async searchEvents(query: {
    from?: number;
    size?: number;
    sort?: Record<string, 'asc' | 'desc'>;
    query?: Record<string, any>;
  }): Promise<{
    hits: {
      total: { value: number };
      hits: Array<{ _source: UserBehaviorEvent }>;
    };
  }> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/log/search`, {
        ...query,
        indexName: this.indexName
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search events from Elasticsearch:', error);
      throw error;
    }
  }

  // Helper method to build a range query
  static buildRangeQuery(field: string, gte?: string | number, lte?: string | number) {
    const range: Record<string, any> = {};
    if (gte !== undefined) range.gte = gte;
    if (lte !== undefined) range.lte = lte;
    return { range: { [field]: range } };
  }

  // Helper method to build a term query
  static buildTermQuery(field: string, value: string | number | boolean) {
    return { term: { [field]: value } };
  }

  // Helper method to build a match query
  static buildMatchQuery(field: string, value: string) {
    return { match: { [field]: value } };
  }
} 