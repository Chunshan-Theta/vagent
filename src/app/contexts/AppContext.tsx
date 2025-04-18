'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useEvent } from "@/app/contexts/EventContext";

interface AppContextProps {
  dataChannel: RTCDataChannel | null;
  setDataChannel: (dc: RTCDataChannel | null) => void;
  sendClientEvent: (eventObj: any, eventNameSuffix?: string) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dataChannel, setDataChannel] = useState<any>(null);
  
  // Use a try-catch to handle the case when EventContext is not available
  let logClientEvent;
  try {
    const eventContext = useEvent();
    logClientEvent = eventContext.logClientEvent;
  } catch (error) {
    console.warn("EventContext not available, using default values");
    logClientEvent = (eventObj: any, eventNameSuffix = "") => {
      console.log(`[Client Event] ${eventNameSuffix}:`, eventObj);
    };
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
    <AppContext.Provider value={{ dataChannel, setDataChannel, sendClientEvent }}>
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