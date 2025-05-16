'use client';

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import { useEvent } from "@/app/contexts/EventContext";

interface AppContextProps {
  dataChannel: RTCDataChannel | null;
  setRtcAudioElement: (audio: HTMLAudioElement | null) => void;
  setDataChannel: (dc: RTCDataChannel | null) => void;
  sendClientEvent: (eventObj: any, eventNameSuffix?: string) => void;
  stopAudio: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dataChannel, setDataChannel] = useState<any>(null);
  const rtcAudioElement = useRef<HTMLAudioElement | null>(null);
  const rtcAudioPrevVolume = useRef<number | null>(null);

  // Use a try-catch to handle the case when EventContext is not available
  let logClientEvent;
  try {
    const eventContext = useEvent();
    logClientEvent = eventContext.logClientEvent;
  } catch (error) {
    // 出現這個狀況，代表 Provider 的順序有問題需要調整
    // 用替代方案送出的訊息只會出現在 console 中
    console.warn("EventContext not available, using default values");
    logClientEvent = (eventObj: any, eventNameSuffix = "") => {
      console.log(`[Client Event] ${eventNameSuffix}:`, eventObj);
    };
  }

  const setRtcAudioElement = (audioElement: HTMLAudioElement | null) => {
    rtcAudioElement.current = audioElement;
  }

  const enableAudio = () => {
    if (rtcAudioElement.current) {
      const volume = rtcAudioPrevVolume.current ?? 1;
      rtcAudioElement.current.volume = volume;
    }
  }

  const stopAudio = () => {
    if (rtcAudioElement.current) {
      rtcAudioPrevVolume.current = rtcAudioElement.current.volume;
      rtcAudioElement.current.volume = 0;
    }
  }

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    if (dataChannel && dataChannel.readyState === "open") {
      logClientEvent(eventObj, eventNameSuffix);
      dataChannel.send(JSON.stringify(eventObj));
    } else {
      logClientEvent(
        { attemptedEvent: eventObj.type },
        "error.data_channel_not_open"
      );
      console.error(
        "Failed to send message - no data channel available",
        eventObj
      );
    }
  };
  return (
    <AppContext.Provider value={{ setRtcAudioElement, stopAudio, dataChannel, setDataChannel, sendClientEvent }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};