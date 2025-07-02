import { v4 as uuidv4 } from "uuid";

export interface LogEvent {
  event_name: string;
  action_category: string;
  action_subtype: string;
  action_properties: Record<string, any>;
  trigger_dom?: string;
  error?: boolean;
  error_message?: string;
  content?: string;
  user_id?: string;
  body?: Record<string, any>;
}

export class LogService {
  private static instance: LogService;
  private sessionId: string;

  private constructor() {
    this.sessionId = `sess_${uuidv4()}`;
  }

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public async logEvent(event: LogEvent) {
    const {
      event_name,
      action_category,
      action_subtype,
      action_properties,
      trigger_dom,
      error = false,
      error_message = '',
      content = '',
      user_id = '',
      body = {}
    } = event;

    const logData = {
      '@timestamp': new Date().toISOString(),
      event_name,
      event_id: `evt_${uuidv4()}`,
      user: {
        user_id,
        anonymous_id: 'anon_' + uuidv4().slice(0, 8),
        session_id: this.sessionId
      },
      client_device: {
        platform: 'web' as const,
        device: navigator.platform,
        os: navigator.platform,
        browser: navigator.userAgent,
        language: navigator.language,
        app_version: '1.0.0',
        env: 'prod' as const,
        network: {
          ip: '',
          user_agent: navigator.userAgent
        }
      },
      event_situation: {
        trigger_url: window.location.href,
        trigger_dom: trigger_dom || 'unknown'
      },
      action: {
        action_category,
        action_subtype,
        action_properties,
        body
      },
      message: {
        error,
        content: error ? error_message : content,
        code: error ? 500 : 200
      }
    };

    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
      return response.json();
    } catch (err) {
      console.error('Failed to log event:', err);
    }
  }

  public async logStep(
    stepName: string,
    actionCategory: string = 'step',
    actionProperties: Record<string, any> = {},
    body: Record<string, any> = {},
    error: boolean = false,
    errorMessage: string = '',
    errorCode: number = 200,
    triggerDom: string = 'unknown'
  ) {
    return this.logEvent({
      event_name: stepName,
      action_category: actionCategory,
      action_subtype: stepName,
      action_properties: actionProperties,
      trigger_dom: triggerDom,
      error,
      error_message: errorMessage,
      content: error ? errorMessage : `Step ${stepName} completed`,
      body
    });
  }

  public async logUserAction(
    actionType: string,
    field: string,
    value: string,
    userId: string
  ) {
    return this.logEvent({
      event_name: 'user_info_update',
      action_category: 'user_info',
      action_subtype: actionType,
      action_properties: {
        field,
        value
      },
      trigger_dom: `${field}_input`,
      user_id: userId,
      content: `${field} updated`
    });
  }
} 