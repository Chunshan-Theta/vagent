import React, { Suspense } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App from "../App";
import { AppProvider } from "@/app/contexts/AppContext";

export default function Page() {
  return (
    <AppProvider>
      <TranscriptProvider>
        <EventProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>
        </EventProvider>
      </TranscriptProvider>
    </AppProvider>
  );
} 