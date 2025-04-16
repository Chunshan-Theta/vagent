'use client';

import React, { Suspense, useState, useEffect, useRef } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App, { AppRef } from "../App";
import { useRouter } from "next/navigation";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { FaMicrophone, FaPhone, FaVolumeUp, FaHashtag } from 'react-icons/fa';

function DemoContent() {
  const router = useRouter();
  const { transcriptItems } = useTranscript();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const appRef = useRef<AppRef>(null);

  useEffect(() => {
    if (!isCallEnded) {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isCallEnded]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnalyzeChatHistory = () => {
    if (transcriptItems.length === 0) {
      alert("No chat history available to analyze");
      return;
    }
    
    setIsAnalyzing(true);
    setIsCallEnded(true);
    
    // Stop the realtime connection and audio
    if (appRef.current) {
      appRef.current.disconnectFromRealtime();
    }
    
    const chatHistory = transcriptItems
      .filter(item => item.type === 'MESSAGE')
      .map(item => `${item.role}: ${item.title}`)
      .join('\n\n');
    
    router.push(`/demo/analysis?history=${encodeURIComponent(chatHistory)}`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Call Header */}
      <div className={`flex-1 flex flex-col items-center justify-center p-8 ${isCallEnded ? 'bg-gray-950' : ''}`}>
        <div className={`w-32 h-32 rounded-full ${isCallEnded ? 'bg-gray-800' : 'bg-gray-700'} mb-6 flex items-center justify-center`}>
          <span className="text-4xl">👤</span>
        </div>
        <h1 className="text-2xl font-semibold mb-2">AI Assistant</h1>
        <p className="text-gray-400 mb-1">{isCallEnded ? 'Call ended' : 'Call in progress'}</p>
        <p className="text-gray-400">{formatDuration(callDuration)}</p>
      </div>

      {/* Call Controls */}
      <div className="p-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <button className="flex flex-col items-center p-4 rounded-full bg-gray-800 hover:bg-gray-700">
            <FaMicrophone className="text-2xl mb-2" />
            <span className="text-sm">Mute</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-full bg-gray-800 hover:bg-gray-700">
            <FaHashtag className="text-2xl mb-2" />
            <span className="text-sm">Keypad</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-full bg-gray-800 hover:bg-gray-700">
            <FaVolumeUp className="text-2xl mb-2" />
            <span className="text-sm">Speaker</span>
          </button>
        </div>

        <button
          onClick={handleAnalyzeChatHistory}
          disabled={isAnalyzing || transcriptItems.length === 0}
          className="w-full bg-red-500 text-white p-4 rounded-full flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
        >
          <FaPhone className="transform rotate-135 mr-2" />
          {isAnalyzing ? 'Preparing Analysis...' : 'End Call & Analyze'}
        </button>
      </div>

      {/* Hidden App Component */}
      <div className="hidden">
        <App hideLogs={true} ref={appRef} />
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