import { useRef, useState, useCallback } from "react";

/**
 * useSyncState: 同時提供可觸發渲染的 ref 以及可即時取得最新值的 ref
 * @param initialValue 初始值
 */
export function useSyncState<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const stateRef = useRef<T>(state);

  // 包一層 setState，讓 ref 也同步
  const setSyncState = useCallback((v: T) => {
    stateRef.current = v;
    setState(v);
  }, []);

  const getTempValue = useCallback(() => {
    return state;
  }, [state]);

  const set = useCallback((v: T) => {
    setSyncState(v);
  }, [setSyncState]);

  // 保證 ref 跟 state 同步
  stateRef.current = state;

  return {
    getTempValue,
    getState: getTempValue,
    get state() {
      return state;
    },
    set,
    get current(){
      return stateRef.current;
    },
    set current(v: T) {
      setSyncState(v);
    }
  }
}