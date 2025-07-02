import { ElasticService } from '@/lib/elastic-service';
import { NextRequest } from 'next/server';
import { POST as logPost } from '../log/route';
import { POST as searchPost } from '../log/search/route';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Log API Tests', () => {
  let elasticService: ElasticService;
  const testHost = process.env.ELASTIC_TEST_HOST || 'https://voiss-98689.zeabur.app';
  
  const sampleEvent = {
    "@timestamp": "2025-06-30T08:15:42Z",
    "event_name": "click_button",
    "event_id": "evt_login_click_001",
    "user": {
      "user_id": null,
      "anonymous_id": "anon_91a2bc3",
      "session_id": "sess_44fa7cc9"
    },
    "client_device": {
      "platform": "web" as const,
      "device": "MacBook Pro",
      "os": "macOS 14.0",
      "browser": "Chrome",
      "language": "zh-TW",
      "app_version": "1.0.0",
      "env": "dev" as const,
      "network": {
        "ip": "203.0.113.24",
        "user_agent": "Mozilla/5.0"
      }
    },
    "event_situation": {
      "trigger_url": "https://app.example.com/home",
      "trigger_dom": "#header > nav > ul > li.login > button"
    },
    "action": {
      "action_category": "ui",
      "action_subtype": "click",
      "action_properties": {
        "target": "login_button",
        "text": "登入"
      },
      "body": {
        "login_success": true
      }
    },
    "message": {
      "error": false,
      "content": "",
      "code": 200
    }
  };

  const sampleLLMEvent = {
    "@timestamp": "2025-06-30T09:20:10Z",
    "event_name": "llm_generate_report",
    "event_id": "evt_llmreport",
    "user": {
      "user_id": "user_042",
      "anonymous_id": "",
      "session_id": "sess_d203be1"
    },
    "client_device": {
      "platform": "web" as const,
      "device": "Windows PC",
      "os": "Windows 11",
      "browser": "Edge",
      "language": "zh-TW",
      "app_version": "1.5.3",
      "env": "dev" as const,
      "network": {
        "ip": "198.51.100.17",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    },
    "event_situation": {
      "trigger_url": "https://app.example.com/dashboard",
      "trigger_dom": "#analysis-panel > button.generate-report"
    },
    "action": {
      "action_category": "llm",
      "action_subtype": "generate_report",
      "action_properties": {
        "model": "gpt-4",
        "prompt": "請根據使用者最近7天的點擊與購買行為，產出建議報告",
        "source": "system_triggered",
        "input_behavior_scope": "last_7_days",
        "input_summary": "使用者主要瀏覽A類商品，曾加入2次購物車並放棄，點擊偏好為低價位產品。",
        "parameters": {
          "temperature": 0.5,
          "top_p": 0.9,
          "max_tokens": 1200
        }
      },
      "body": {
        "report_summary": "使用者對低價促銷敏感，建議主打優惠活動與限時搶購。建議推送3款A類商品。",
        "report_tags": ["價格敏感", "購物車放棄", "推薦提升"],
        "generated_token_count": 684,
        "truncated": false
      }
    },
    "message": {
      "error": false,
      "content": "",
      "code": 200
    }
  };

  beforeEach(() => {
    elasticService = new ElasticService(testHost, 'voiss-user-logs-test');
    
    // Mock successful Elasticsearch responses
    mockedAxios.post.mockImplementation((url) => {
      if (url.includes('/_doc')) {
        return Promise.resolve({
          data: {
            _index: 'test-index',
            _id: 'test-id',
            result: 'created'
          }
        });
      } else if (url.includes('voiss-user-logs-test/_search')) {
        return Promise.resolve({
          data: {
            hits: {
              total: { value: 1 },
              hits: [{
                _source: sampleEvent
              }]
            }
          }
        });
      }
      return Promise.reject(new Error(`Unknown endpoint: ${url}`));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ElasticService Tests', () => {
    it('should successfully insert an event', async () => {
      const result = await elasticService.insertEvent(sampleEvent);
      expect(result._index).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.result).toBe('created');
    });

    it('should successfully search events', async () => {
      const searchQuery = {
        size: 10,
        query: {
          match: {
            event_name: 'click_button'
          }
        }
      };

      const result = await elasticService.searchEvents(searchQuery);
      expect(result.hits).toBeDefined();
      expect(Array.isArray(result.hits.hits)).toBe(true);
    });

    it('should build correct range query', () => {
      const query = ElasticService.buildRangeQuery('@timestamp', '2025-01-01', '2025-12-31');
      expect(query).toEqual({
        range: {
          '@timestamp': {
            gte: '2025-01-01',
            lte: '2025-12-31'
          }
        }
      });
    });

    it('should build correct term query', () => {
      const query = ElasticService.buildTermQuery('action.action_category', 'ui');
      expect(query).toEqual({
        term: {
          'action.action_category': 'ui'
        }
      });
    });

    it('should build correct match query', () => {
      const query = ElasticService.buildMatchQuery('event_name', 'click_button');
      expect(query).toEqual({
        match: {
          'event_name': 'click_button'
        }
      });
    });

    it('should successfully insert and retrieve LLM event', async () => {
      // Mock specific response for LLM event
      mockedAxios.post.mockImplementationOnce((url) => {
        if (url.includes('/_doc')) {
          return Promise.resolve({
            data: {
              _index: 'test-index',
              _id: 'test-id',
              result: 'created'
            }
          });
        }
        return Promise.reject(new Error(`Unknown endpoint: ${url}`));
      });

      mockedAxios.post.mockImplementationOnce((url) => {
        if (url.includes('voiss-user-logs-test/_search')) {
          return Promise.resolve({
            data: {
              hits: {
                total: { value: 1 },
                hits: [{
                  _source: sampleLLMEvent
                }]
              }
            }
          });
        }
        return Promise.reject(new Error(`Unknown endpoint: ${url}`));
      });

      // Insert the event
      const insertResult = await elasticService.insertEvent(sampleLLMEvent);
      expect(insertResult._index).toBeDefined();
      expect(insertResult._id).toBeDefined();
      expect(insertResult.result).toBe('created');

      // Search for the inserted event
      const searchQuery = {
        query: {
          bool: {
            must: [
              { match: { event_id: sampleLLMEvent.event_id } },
              { match: { 'action.action_category': 'llm' } }
            ]
          }
        }
      };

      const searchResult = await elasticService.searchEvents(searchQuery);
      expect(searchResult.hits.total.value).toBeGreaterThan(0);

      const hit = searchResult.hits.hits[0]._source;
      expect(hit.event_name).toBe('llm_generate_report');
      expect(hit.action.action_properties.model).toBe('gpt-4');
      expect(hit.action.body.report_tags).toEqual(['價格敏感', '購物車放棄', '推薦提升']);
      expect(hit.action.body.generated_token_count).toBe(684);
    });

    it('should search LLM events by time range and parameters', async () => {
      // Mock specific response for time range search
      mockedAxios.post.mockImplementationOnce((url) => {
        if (url.includes('voiss-user-logs-test/_search')) {
          return Promise.resolve({
            data: {
              hits: {
                total: { value: 1 },
                hits: [{
                  _source: {
                    ...sampleLLMEvent,
                    action: {
                      ...sampleLLMEvent.action,
                      action_properties: {
                        ...sampleLLMEvent.action.action_properties,
                        parameters: {
                          temperature: 0.5,
                          top_p: 0.9,
                          max_tokens: 1200
                        }
                      }
                    }
                  }
                }]
              }
            }
          });
        }
        return Promise.reject(new Error(`Unknown endpoint: ${url}`));
      });

      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                range: {
                  '@timestamp': {
                    gte: '2025-06-30T09:00:00Z',
                    lte: '2025-06-30T10:00:00Z'
                  }
                }
              },
              { match: { 'action.action_category': 'llm' } },
              { match: { 'action.action_properties.source': 'system_triggered' } }
            ]
          }
        }
      };

      const result = await elasticService.searchEvents(searchQuery);
      expect(result.hits).toBeDefined();
      
      if (result.hits.hits.length > 0) {
        const hit = result.hits.hits[0]._source;
        expect(hit.action.action_properties.parameters).toEqual({
          temperature: 0.5,
          top_p: 0.9,
          max_tokens: 1200
        });
      }
    });
  });

  describe('Log API Endpoint Tests', () => {
    it('should successfully create a log', async () => {
      const req = new Request('http://localhost/api/log', {
        method: 'POST',
        body: JSON.stringify(sampleEvent)
      }) as NextRequest;

      const response = await logPost(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data._id).toBeDefined();
      expect(data.result).toBe('created');
    });

    it('should reject invalid log data', async () => {
      const req = new Request('http://localhost/api/log', {
        method: 'POST',
        body: JSON.stringify({ event_name: 'test' })  // Missing required fields
      }) as NextRequest;

      const response = await logPost(req);
      expect(response.status).toBe(400);
    });

    it('should successfully log LLM report generation event', async () => {
      const req = new Request('http://localhost/api/log', {
        method: 'POST',
        body: JSON.stringify(sampleLLMEvent)
      }) as NextRequest;

      const response = await logPost(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data._id).toBeDefined();
      expect(data.result).toBe('created');
    });
  });

  describe('Search API Endpoint Tests', () => {
    beforeEach(() => {
      // Mock Elasticsearch response for all search tests
      mockedAxios.post.mockImplementation((url) => {
        if (url.includes('/_doc')) {
          return Promise.resolve({
            data: {
              _index: 'test-index',
              _id: 'test-id',
              result: 'created'
            }
          });
        } else if (url.includes('/_search')) {
          return Promise.resolve({
            data: {
              hits: {
                total: { value: 1 },
                hits: [{
                  _source: sampleEvent
                }]
              }
            }
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });
    });

    it('should successfully search logs', async () => {
      const req = new Request('http://localhost/api/log/search', {
        method: 'POST',
        body: JSON.stringify({
          event_name: 'click_button',
          action_category: 'ui',
          size: 5
        })
      }) as NextRequest;

      const response = await searchPost(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.hits).toBeDefined();
      expect(Array.isArray(data.hits.hits)).toBe(true);
    });

    it('should handle search with time range', async () => {
      const req = new Request('http://localhost/api/log/search', {
        method: 'POST',
        body: JSON.stringify({
          start_time: '2025-01-01T00:00:00Z',
          end_time: '2025-12-31T23:59:59Z',
          action_category: 'ui'
        })
      }) as NextRequest;

      const response = await searchPost(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.hits).toBeDefined();
    });

    it('should handle custom query', async () => {
      const req = new Request('http://localhost/api/log/search', {
        method: 'POST',
        body: JSON.stringify({
          query: {
            bool: {
              must: [
                { match: { event_name: 'click_button' } },
                { match: { 'action.action_category': 'ui' } }
              ]
            }
          }
        })
      }) as NextRequest;

      const response = await searchPost(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.hits).toBeDefined();
    });

    it('should search LLM report generation events', async () => {
      // Mock specific response for LLM search
      mockedAxios.post.mockImplementationOnce((url) => {
        if (url.includes('/_search')) {
          return Promise.resolve({
            data: {
              hits: {
                total: { value: 1 },
                hits: [{
                  _source: sampleLLMEvent
                }]
              }
            }
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const req = new Request('http://localhost/api/log/search', {
        method: 'POST',
        body: JSON.stringify({
          query: {
            bool: {
              must: [
                { match: { event_name: 'llm_generate_report' } },
                { match: { 'action.action_category': 'llm' } },
                { match: { 'action.action_properties.source': 'system_triggered' } }
              ]
            }
          }
        })
      }) as NextRequest;

      const response = await searchPost(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.hits).toBeDefined();
      if (data.hits.hits.length > 0) {
        const hit = data.hits.hits[0]._source;
        expect(hit.action.action_properties.model).toBeDefined();
        expect(hit.action.body.report_tags).toBeDefined();
      }
    });
  });
}); 