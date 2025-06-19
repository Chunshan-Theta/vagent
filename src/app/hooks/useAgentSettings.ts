import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAllAgentSettings } from '@/app/lib/ai-chat/reportHelper'


type useAgentSettingsOptions = {
  ignoreError?: boolean; // 是否忽略錯誤情況
}
/**
 * 用於蒐集 agent_settings
 * @param agentId 
 * @returns 
 */
export function useAgentSettings(agentId: string, opts: useAgentSettingsOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const ignoreError = useMemo(()=>{
    return opts.ignoreError || false;
  }, [opts.ignoreError]);


  const settings = useRef<{ [key: string]: string }>({});
  useEffect(() => {
    fetchAndUpdate();
  }, []);

  function fetchAndUpdate() {
    if (loading) return;
    setLoading(true);
    if(ignoreError){
      const fn = async () => {
        settings.current = {};
        const res = await fetchAllAgentSettings(agentId).catch((err)=>{
          console.warn('fetchAllAgentSettings error', err);
          return { values:{} as Record<string, string> }
        });
        for (const key in res.values) {
          settings.current[key] = res.values[key];
        }
        setReady(true);
      }
      fn()
        .finally(() => {
          setLoading(false);
        })
    }else{
      retryOnError(async () => {
        settings.current = {};
        const res = await fetchAllAgentSettings(agentId)
        for (const key in res.values) {
          settings.current[key] = res.values[key];
        }
        setReady(true);
      })
        .finally(() => {
          setLoading(false);
        })
    }
  }

  function retryOnError<T>(fn: () => Promise<T>, retries = 3, delay = 1000) {
    return new Promise<T>((resolve, reject) => {
      const attempt = (n: number) => {
        fn().then(resolve).catch((error) => {
          if (n <= 0) {
            reject(error);
          } else {
            // console.warn(`Retrying... (${retries - n + 1}/${retries})`);
            setTimeout(() => attempt(n - 1), delay);
          }
        });
      };
      attempt(retries);
    });
  }

  function waitReady(timeout = 10000): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let timeoutTimerId: any = null;
      let lastTimeout: any = null;
      const checkReady = () => {
        if (ready) {
          clearTimeout(timeoutTimerId);
          clearTimeout(lastTimeout);
          resolve();
        } else {
          lastTimeout = setTimeout(checkReady, 600);
        }
      };
      timeoutTimerId = setTimeout(() => {
        if (!ready) {
          clearTimeout(timeoutTimerId);
          clearTimeout(lastTimeout);
          reject(new Error('timeout'));
        }
      }, timeout);
      checkReady();
    });
  }

  function getSetting(key: string): string {
    return settings.current[key] || '';
  }

  return {
    ready,
    settings,
    waitReady,
    getSetting
  }
}

export default useAgentSettings;