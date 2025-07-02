import { ElasticService } from '@/lib/elastic-service';
import { NextRequest } from 'next/server';
import { POST as logPost } from '../log/route';
import { POST as searchPost } from '../log/search/route';

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
      "env": "prod" as const,
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

  beforeAll(() => {
    elasticService = new ElasticService(testHost, 'voiss-user-logs-test');
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
  });

  describe('Search API Endpoint Tests', () => {
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
  });
}); 