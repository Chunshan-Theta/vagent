
import React, { Suspense, useState, useEffect, useRef } from "react";
import { TranscriptProvider, useTranscript } from "@/app/contexts/TranscriptContext";
import { ChatProvider, useChat } from "@/app/contexts/ChatContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App, { AppRef } from "@/app/App";
import { useRouter } from "next/navigation";

import ChatView from "@/app/components/chat/ChatView";
import { AppProvider, useAppContext } from "@/app/contexts/AppContext";

import { v4 as uuidv4 } from "uuid";

/**
 * 聊天介面基本需要的狀態
 * @returns 
 */
export function useAiChat(){
  const router = useRouter();
  const chatContext = useChat();
  const { inputText, updateInputText } = chatContext;
  const transcript = useTranscript();
  const { transcriptItems, clearTranscript, addTranscriptMessage } = transcript;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const appContext = useAppContext();
  const { sendClientEvent } = appContext;

  // styles start
  const [background, setBackground] = useState("#0F2D38");
  // styles end

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appRef = useRef<AppRef>(null);
  const [isClient, setIsClient] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState(false);

  // Clear transcript on page refresh
  useEffect(() => {
    clearTranscript();
  }, []);


  const handleTalkOn = async () => {
    // alert("handleTalkOn");
    setIsPTTUserSpeaking(true);

    if (appRef.current) {
      await appRef.current.connectToRealtime();
      setIsSessionStarted(true);
    }
    sendClientEvent({ type: "input_audio_buffer.clear" }, "clear PTT buffer");
  };

  const cancelAssistantSpeech = () => {
    const mostRecentAssistantMessage = [...transcriptItems]
      .reverse()
      .find((item) => item.role === "assistant");

    if (!mostRecentAssistantMessage) {
      return;
    }
    if (mostRecentAssistantMessage.status === "DONE") {
      return;
    }

    sendClientEvent({
      type: "conversation.item.truncate",
      item_id: mostRecentAssistantMessage?.itemId,
      content_index: 0,
      audio_end_ms: Date.now() - mostRecentAssistantMessage.createdAtMs,
    });
    sendClientEvent(
      { type: "response.cancel" },
      "(cancel due to new response)"
    );
  };

  const handleTalkOff = async () => {
    // alert("handleTalkOff");
    setIsPTTUserSpeaking(false);


    sendClientEvent({ type: "input_audio_buffer.commit" }, "commit PTT");
    cancelAssistantSpeech();
    // Stop audio playback and disconnect
    if (appRef.current) {
      await appRef.current.disconnectFromRealtime();
      setIsSessionStarted(false);
      // Send cancel event to ensure assistant stops speaking
      sendClientEvent({ type: "response.cancel" }, "cancel assistant speech");
    }

    const end_id = uuidv4().slice(0, 32);
    chatContext.addMessageItem({
      id: end_id,
      type: 'text',
      role: 'user',
      data: { content: "通話已結束" },
      createdAtMs: Date.now(),
    });
  };

  const handleMicrophoneClick = () => {
    if (isPTTUserSpeaking) {
      handleTalkOff();  // 掛斷電話
    } else {
      handleTalkOn();  // 開始講話
    }
  };

  // Set isClient to true after component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isCallEnded) {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isCallEnded]);

  useEffect(() => {
    // tran
  })

  // 監聽 transcriptItems 是否有新增東西，同步添加到 chatContext 內
  useEffect(() => {
    const h1 = transcript.on('new_item', (data) => {
      const { type, item: newItem } = data;
      if (type === 'MESSAGE') {
        chatContext.addMessageItem({
          id: newItem.itemId,
          type: 'text',
          role: newItem.role!,
          data: { content: newItem.title },
          createdAtMs: Date.now(),
          hide: !!newItem.isHidden || newItem.role === 'system',
        })
      }
    })
    const h2 = transcript.on('update_item', (data) => {
      const { action, index, item, items } = data;
      if (action === 'update_title') {
        const { itemId, title } = item;
        chatContext.updateMessageContent(itemId, title!);
      } else if (action === 'update_status') {
        // console.log('update_status', data);
      } else if (action === 'toggle_expand') {
        // console.log('toggle_expand', data);
      }
    })
    return () => {
      transcript.off('new_item', h1);
      transcript.off('update_item', h2);
    }
  })

  
  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text, true);

    sendClientEvent(
      {
        type: "conversation.item.create",
        item: {
          id,
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      },
      "(simulated user text message)"
    );
    sendClientEvent(
      { type: "response.create" },
      "(trigger response after simulated user text message)"
    );
  };
  const endConversation = ()=>{
    setIsAnalyzing(true);
    setIsCallEnded(true);
    setAnalysisProgress(0);

    // Stop the realtime connection and audio
    if (appRef.current) {
      appRef.current.disconnectFromRealtime();
    }
  }


  return {
    router,
    isClient,
    appRef,

    inputText,
    updateInputText,

    handleMicrophoneClick,

    callDuration,
    setCallDuration,

    isCallEnded,
    setIsCallEnded,
    
    isAnalyzing,
    setIsAnalyzing,

    analysisProgress,
    setAnalysisProgress,

    background,
    setBackground,

    isSessionStarted,
    setIsSessionStarted,

    isPTTUserSpeaking,
    setIsPTTUserSpeaking,

    sendSimulatedUserMessage,

    handleTalkOn,
    handleTalkOff,
    cancelAssistantSpeech,
    sendClientEvent,
    
    addTranscriptMessage,
    clearTranscript,
    transcriptItems,

    progressTimerRef,

    endConversation
  }
}