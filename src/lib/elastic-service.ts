import axios from 'axios';

// 定義網絡信息接口
export interface NetworkInfo {
  ip: string;                // 用戶 IP 地址
  user_agent: string;        // 用戶代理字符串
}

// 定義客戶端設備信息接口
export interface ClientDevice {
  platform: 'web' | 'ios' | 'android' | 'api';  // 平台類型
  device: string;            // 設備名稱
  os: string;               // 操作系統
  browser: string;          // 瀏覽器類型
  language: string;         // 用戶語言設置
  app_version: string;      // 應用版本號
  env: 'prod' | 'staging' | 'dev';  // 運行環境
  network: NetworkInfo;     // 網絡信息
}

// 定義用戶信息接口
export interface UserInfo {
  user_id: string | null;    // 用戶ID（可為空）
  anonymous_id: string;      // 匿名用戶ID
  session_id: string;        // 會話ID
}

// 定義事件場景接口
export interface EventSituation {
  trigger_url: string;       // 觸發事件的URL
  trigger_dom: string;       // 觸發事件的DOM元素
}

// 定義動作屬性接口
export interface ActionProperties {
  model?: string;            // 可選：使用的模型
  tool_used?: string;        // 可選：使用的工具
  prompt?: string;           // 可選：提示詞
  [key: string]: any;        // 其他可能的屬性
}

// 定義動作接口
export interface Action {
  action_category: string;    // 動作類別
  action_subtype: string;     // 動作子類型
  action_properties: ActionProperties;  // 動作屬性
  body: Record<string, any>;  // 動作主體數據
}

// 定義消息接口
export interface Message {
  error: boolean;            // 是否有錯誤
  content: string;           // 消息內容
  code: number;              // 狀態碼
}

// 定義用戶行為事件接口
export interface UserBehaviorEvent {
  '@timestamp': string;      // 時間戳
  event_name: string;        // 事件名稱
  event_id: string;          // 事件ID
  user: UserInfo;            // 用戶信息
  client_device: ClientDevice;  // 客戶端設備信息
  event_situation: EventSituation;  // 事件場景
  action: Action;            // 動作信息
  message: Message;          // 消息信息
}

// Elasticsearch 服務類
export class ElasticService {
  private baseUrl: string;    // Elasticsearch 基礎URL
  private indexName: string;  // 索引名稱

  // 構造函數：初始化服務
  constructor(baseUrl: string, indexName: string) {
    this.baseUrl = baseUrl;
    this.indexName = indexName;
  }

  // 插入事件到Elasticsearch
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

  // 搜索Elasticsearch中的事件
  async searchEvents(query: {
    from?: number;           // 起始位置
    size?: number;           // 返回結果數量
    sort?: Record<string, 'asc' | 'desc'>;  // 排序條件
    query?: Record<string, any>;            // 查詢條件
  }): Promise<{
    hits: {
      total: { value: number };             // 總匹配數
      hits: Array<{ _source: UserBehaviorEvent }>;  // 匹配結果
    };
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/${this.indexName}/_search`, query);
      return response.data;
    } catch (error) {
      console.error('Failed to search events from Elasticsearch:', error);
      throw error;
    }
  }

  // 輔助方法：構建範圍查詢
  static buildRangeQuery(field: string, gte?: string | number, lte?: string | number) {
    const range: Record<string, any> = {};
    if (gte !== undefined) range.gte = gte;  // 大於等於
    if (lte !== undefined) range.lte = lte;  // 小於等於
    return { range: { [field]: range } };
  }

  // 輔助方法：構建精確匹配查詢
  static buildTermQuery(field: string, value: string | number | boolean) {
    return { term: { [field]: value } };
  }

  // 輔助方法：構建模糊匹配查詢
  static buildMatchQuery(field: string, value: string) {
    return { match: { [field]: value } };
  }
} 