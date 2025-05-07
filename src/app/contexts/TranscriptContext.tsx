"use client";

import React, { createContext, useContext, useState, FC, PropsWithChildren, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { TranscriptItem } from "@/app/types";
import mitt from 'mitt';


type UpdateAction = "update_title" | "update_status" | "toggle_expand";
type Hooks = {
  new_item: { type: 'MESSAGE' | 'BREADCRUMB', item: TranscriptItem; items: TranscriptItem[] };
  update_item: { action: UpdateAction; index: number; item: TranscriptItem; items: TranscriptItem[] };
  clean_items: any;
}

type TranscriptContextValue = {
  transcriptItems: TranscriptItem[];
  addTranscriptMessage: (itemId: string, role: "user" | "assistant", text: string, hidden?: boolean) => void;
  updateTranscriptMessage: (itemId: string, text: string, isDelta: boolean) => void;
  addTranscriptBreadcrumb: (title: string, data?: Record<string, any>) => void;
  toggleTranscriptItemExpand: (itemId: string) => void;
  updateTranscriptItemStatus: (itemId: string, newStatus: "IN_PROGRESS" | "DONE") => void;
  clearTranscript: () => void;

  // 此處的 on 跟 off ，呼叫後會回傳 handler 本身
  on: <K extends keyof Hooks>(ev: K, handler: (data: Hooks[K]) => void) => (data: Hooks[K]) => void;
  // 取消時不需要核對 type
  off: <K extends keyof Hooks>(ev: K, handler: any) => void;
};

const TranscriptContext = createContext<TranscriptContextValue | undefined>(undefined);

export const TranscriptProvider: FC<PropsWithChildren> = ({ children }) => {
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const [eventsQueue, setEventQueue] = useState<Array<[string, any]>>([]);

  const emitter = mitt<Hooks>();

  const DEBUG = false;
  const noop = () => { };
  const debug = !DEBUG ? noop : (...args: any[]) => {
    console.log(...args);
  };
  /**
   * 確保 emit 只能被呼叫一次
   * 
   * 這個 emitOne 的設計是為了讓可以在 setter 裡面使用 emit
   * emitOne 的範例:
   * ```
   * const emit = limitEmit(1)
   * someSetter(()=>{
   *   // do something
   *   // ...
   *   emit('event_name', data)
   * })
   * ```
   */
  function limitEmit(times = 1) {
    let nowTimes = 0;
    return <K extends keyof Hooks>(ev: K, data: Hooks[K]) => {
      if (nowTimes >= times) {
        return;
      }
      nowTimes += 1;
      debug(`[emit] ${ev}`, data);
      setEventQueue((prev) => {
        return [...prev, [ev, data]]
      })
    };
  }
  const emitOnce = limitEmit.bind(null, 1);



  function newTimestampPretty(): string {
    return new Date().toLocaleTimeString([], {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  const addTranscriptMessage: TranscriptContextValue["addTranscriptMessage"] = (itemId, role, text = "", isHidden = false) => {
    const emit = emitOnce()
    setTranscriptItems((prev) => {
      if (prev.some((log) => log.itemId === itemId)) {
        console.warn(`[addTranscriptMessage] skipping; message already exists for itemId=${itemId}, role=${role}, text=${text}`);
        return prev;
      }
      const newItem: TranscriptItem = {
        itemId,
        type: "MESSAGE",
        role,
        title: text,
        expanded: false,
        timestamp: newTimestampPretty(),
        createdAtMs: Date.now(),
        status: "IN_PROGRESS",
        isHidden,
      };
      const items = [
        ...prev,
        newItem,
      ];
      emit('new_item', {
        type: 'MESSAGE',
        item: newItem,
        items,
      });
      return items
    });
  };

  const updateTranscriptMessage: TranscriptContextValue["updateTranscriptMessage"] = (itemId, newText, append = false) => {
    const emit = emitOnce()
    setTranscriptItems((prev) => {
      const index = prev.findIndex((item) => item.itemId === itemId);
      if (index === -1) {
        return prev;
      }
      let finalText = append ? (prev[index].title ?? "") + newText : newText;
      if (append) {
        finalText = finalText.replace(/^\[[tT]ranscribing\.+]\s*/, '');
      }
      const newItem = {
        ...prev[index],
        title: finalText,
      }
      const newArr = [...prev]
      newArr.splice(index, 1, newItem);
      emit('update_item', {
        action: 'update_title',
        index,
        item: newItem,
        items: newArr,
      });
      return newArr;
    });
  };

  const addTranscriptBreadcrumb: TranscriptContextValue["addTranscriptBreadcrumb"] = (title, data) => {
    const emit = emitOnce()
    setTranscriptItems((prev) => {
      const newItem: TranscriptItem = {
        itemId: `breadcrumb-${uuidv4()}`,
        type: "BREADCRUMB",
        title,
        data,
        expanded: false,
        timestamp: newTimestampPretty(),
        createdAtMs: Date.now(),
        status: "DONE",
        isHidden: false,
      }
      const itemId = newItem.itemId
      if (prev.some((log) => log.itemId === itemId)) {
        console.warn(`[addTranscriptBreadcrumb] skipping; message already exists for itemId=${itemId}`);
        return prev;
      }
      const items = [
        ...prev,
        newItem,
      ]
      emit('new_item', {
        type: 'BREADCRUMB',
        item: newItem,
        items
      });
      return items
    });
  };

  const toggleTranscriptItemExpand: TranscriptContextValue["toggleTranscriptItemExpand"] = (itemId, expanded: boolean | undefined = undefined) => {
    const emit = emitOnce()
    setTranscriptItems((prev) => {
      const index = prev.findIndex((item) => item.itemId === itemId);
      if (index === -1) {
        return prev;
      }
      const newItem = {
        ...prev[index],
        expanded: expanded === undefined ? !prev[index].expanded : !!expanded,
      }
      const newArr = [...prev]
      newArr.splice(index, 1, newItem);
      emit('update_item', {
        action: 'toggle_expand',
        index,
        item: prev[index],
        items: newArr,
      });
      return newArr
    });
  };

  const updateTranscriptItemStatus: TranscriptContextValue["updateTranscriptItemStatus"] = (itemId, newStatus) => {
    const emit = emitOnce()
    setTranscriptItems((prev) => {
      const index = prev.findIndex((item) => item.itemId === itemId);
      if (index === -1) {
        return prev;
      }
      const newItem = {
        ...prev[index],
        status: newStatus,
      }
      const newArr = [...prev]
      newArr.splice(index, 1, newItem);
      emit('update_item', {
        action: 'update_status',
        index,
        item: prev[index],
        items: newArr,
      });
      return newArr
    });
  };

  const clearTranscript: TranscriptContextValue["clearTranscript"] = () => {
    const emit = emitOnce()
    setTranscriptItems([]);
    emit('clean_items', {});
  };

  useEffect(() => {
    // 這裡的目的是讓 transcriptItems 的變化能夠被其他地方監聽到
    // 例如在 App.tsx 中的 useEffect 裡面
    // console.log('flush events', eventsQueue.length)
    eventsQueue.forEach(([ev, data]) => {
      emitter.emit(ev as any, data);
    });
    eventsQueue.length = 0;
  }, [eventsQueue])

  const on: TranscriptContextValue["on"] = (ev, handler) => {
    const h = (data: any) => {
      handler(data)
    }
    emitter.on(ev, h);
    return h
  }

  const off: TranscriptContextValue["off"] = (ev, handler) => {
    emitter.off(ev, handler);
    return handler
  }

  return (
    <TranscriptContext.Provider
      value={{
        transcriptItems,
        addTranscriptMessage,
        updateTranscriptMessage,
        addTranscriptBreadcrumb,
        toggleTranscriptItemExpand,
        updateTranscriptItemStatus,
        clearTranscript,

        on,
        off
      }}
    >
      {children}
    </TranscriptContext.Provider>
  );
};

export function useTranscript() {
  const context = useContext(TranscriptContext);
  if (!context) {
    throw new Error("useTranscript must be used within a TranscriptProvider");
  }
  return context;
}