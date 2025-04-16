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
  const { logClientEvent, logServerEvent } = useEvent();

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