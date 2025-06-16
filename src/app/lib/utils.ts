import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * 建立一個可等待的值控制器，允許非同步地解析（resolve）或拒絕（reject），
 * 類似於 deferred promise，並支援可選的逾時（timeout）機制。
 *
 * 此工具適用於需要等待某個值被設定或發生錯誤的情境，
 * 並且希望能夠暴露方法來手動完成、拒絕或逾時該操作。
 *
 * @typeParam T - 要解析的值的型別。
 *
 * @returns 一個物件，包含以下方法：
 * - `setTimeout(timeout: number)`：設定逾時（毫秒）。若在指定時間內未解析或拒絕，會自動以 timeout 錯誤拒絕。
 * - `setValue(value: T)`：以指定值解析等待中的操作。
 * - `setError(error: any)`：以指定錯誤拒絕等待中的操作。
 * - `getValue(): Promise<T>`：回傳一個 Promise，當有值時解析，發生錯誤時拒絕。
 * - `getValueSync(): T`：如果已經確定有設定值，則可直接同步取值，但若尚未設定會拋出錯誤。
 *
 * @example
 * ```typescript
 * const pending = pendingValue<number>();
 * pending.setTimeout(5000);
 * pending.getValue().then(value => {
 *   console.log("已取得值:", value);
 * }).catch(error => {
 *   console.error("發生錯誤:", error);
 * });
 * // 在其他地方，可以設定值或錯誤：
 * setTimeout(() => {
 *   pending.setValue(42);
 * }, 2000);
 * // 或者
 * setTimeout(() => {
 *   pending.setError(new Error("發生錯誤"));
 * }, 3000);
 * ```
 */
export function pendingValue<T>(){
  let end = false;
  let err:any = null;
  let data: T | null = null;
  let timeoutId: any = null;

  const evList: Array<{ resolve:any, reject:any }> = []

  function setValue(value: T) {
    if(end) return;
    data = value;
    end = true
    notify();
  }
  function setError(error: any) {
    if(end) return;
    err = error;
    end = true
    notify();
  }

  function notify() {
    for (const ev of evList) {
      if (err) {
        ev.reject(err);
      } else {
        ev.resolve(data as T);
      }
    }
    evList.length = 0; // 清空事件列表
  }
  return {
    setTimeout(timeout: number) {
      if(end) return;
      if(timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      timeoutId = setTimeout(() => {
        if(end) return;
        timeoutId = null;
        setError(new Error("timeout"));
      }, timeout);
    },
    setValue,
    setError,
    getValue() {
      return new Promise<T>((resolve, reject)=>{
        if (end) {
          if(err) reject(err);
          else resolve(data as T);
        } else {
          // 還沒結束=>紀錄起來
          evList.push({ resolve, reject });
        }
      })
    },
    getValueSync() {
      if (end) {
        if (err) throw err;
        return data as T;
      } else {
        throw new Error("Value is not set yet");
      }
    }
  }
}
export function delay(ms: number, floatTime?: number): Promise<void> {
  floatTime = floatTime ?? 0;
  if (floatTime > 0) {
    ms += Math.random() * floatTime;
  }
  return new Promise(resolve => setTimeout(resolve, ms));
}