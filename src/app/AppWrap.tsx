'use client';

import React, { Suspense, useState, useEffect, useRef } from "react";
import { TranscriptProvider, useTranscript } from "@/app/contexts/TranscriptContext";
import { ChatProvider, useChat } from "@/app/contexts/ChatContext";
import { EventProvider } from "@/app/contexts/EventContext";
import { AppProvider, useAppContext } from "@/app/contexts/AppContext";

// Use a client-only component to avoid hydration errors
export default function AppWrap({ children }: { children: React.ReactNode }) {
  return (
    <EventProvider>
      <AppProvider>
        <TranscriptProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </TranscriptProvider>
      </AppProvider>
    </EventProvider>
  );
} 