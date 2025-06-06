import React, { Suspense } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App from "../App";
import { AppProvider } from "@/app/contexts/AppContext";

export default function Page() {
  return (
    <EventProvider>
      <AppProvider>
        <TranscriptProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>
        </TranscriptProvider>
      </AppProvider>
    </EventProvider>
  );
} 