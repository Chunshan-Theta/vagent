'use client';

import React, { Suspense, useState } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App from "../App";
import { useRouter } from "next/navigation";
import { useTranscript } from "@/app/contexts/TranscriptContext";

function DemoContent() {
  const router = useRouter();
  const { transcriptItems } = useTranscript();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeChatHistory = () => {
    if (transcriptItems.length === 0) {
      alert("No chat history available to analyze");
      return;
    }
    
    setIsAnalyzing(true);
    
    // Filter only message items and format them
    const chatHistory = transcriptItems
      .filter(item => item.type === 'MESSAGE')
      .map(item => `${item.role}: ${item.title}`)
      .join('\n\n');
    
    // Navigate to analysis page with the chat history
    router.push(`/demo/analysis?history=${encodeURIComponent(chatHistory)}`);
  };

  return (
    <div className="flex flex-col h-screen">
      <button
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
          onClick={handleAnalyzeChatHistory}
          disabled={isAnalyzing || transcriptItems.length === 0}
        >
          {isAnalyzing ? 'Preparing Analysis...' : 'Finish chat then Analyze'}
      </button>
      <div className="flex-1">
       
        <App hideLogs={true} />
      </div>
      <div className="p-4 border-t border-gray-200 bg-white">
        
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <DemoContent />
        </Suspense>
      </EventProvider>
    </TranscriptProvider>
  );
} 