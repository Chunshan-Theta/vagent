
import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { TranscriptProvider, useTranscript } from "@/app/contexts/TranscriptContext";
import { ChatProvider, useChat } from "@/app/contexts/ChatContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App, { AppRef } from "@/app/App";
import { useRouter } from "next/navigation";

import ChatView from "@/app/components/chat/ChatView";
import { AppProvider, useAppContext } from "@/app/contexts/AppContext";

import { v4 as uuidv4 } from "uuid";

import { sharedConfig } from "@/app/agentConfigs";

import * as utils from "./utils";

import { toast } from 'react-toastify';



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
  
  const { sttPrompt, startAsk } = sharedConfig;

  // styles end

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appRef = useRef<AppRef>(null);
  const [isClient, setIsClient] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState(false);
  const [waitRealtimeConnection, setWaitRealtimeConnection] = useState(false);

  const isLoading = useMemo(() => {
    return waitRealtimeConnection;
  }, [waitRealtimeConnection])

  useEffect(()=>{
    console.log('[aichat] isLoading', isLoading);
  }, [isLoading])

  // Clear transcript on page refresh
  useEffect(() => {
    clearTranscript();
  }, []);


  const handleTalkOn = async () => {
    // alert("handleTalkOn");
    setWaitRealtimeConnection(true);

    if (appRef.current) {
      await appRef.current.connectToRealtime();
      setIsSessionStarted(true);
    }
  };

  const onSessionOpen = ()=>{
    setWaitRealtimeConnection(false);
    setIsPTTUserSpeaking(true);
  }
  const onSessionResume = ()=>{
    setWaitRealtimeConnection(false);
    setIsPTTUserSpeaking(true);
  }
  const onSessionClose = ()=>{
    setIsPTTUserSpeaking(false);
  }
  
  const canPause = useMemo(() => {
    // 如果原先並沒有連線，則不需要 pause ，所以狀態一律是 false
    // 需要確保 AI 講完他想講的話，才可以掛斷電話
    if(isPTTUserSpeaking){
      // 找最後一則訊息
      const items = transcriptItems.filter((item)=>item.type === 'MESSAGE')
      const item = items[items.length - 1];
      if(item && item.role === 'assistant' && item.status === 'DONE'){
        // 如果最後一則訊息是 assistant 的話，則可以掛斷電話
        return true;
      }
    }
    return false;
  }, [isPTTUserSpeaking, transcriptItems])

  // useEffect(()=>{
  //   console.log('data channel changed')
  // }, [appContext.dataChannel])
  useEffect(()=>{
    if(appContext.dataChannel?.readyState){
      console.log('data channel readyState update', appContext.dataChannel?.readyState)
    }
  }, [appContext.dataChannel?.readyState])
  useEffect(()=>{
    if(appContext.dataChannel && appContext.dataChannel?.readyState === 'open'){
      sendClientEvent({ type: "input_audio_buffer.clear" }, "(clear PTT buffer)");
    }
  }, [appContext.dataChannel, appContext.dataChannel?.readyState])

  const cancelAssistantSpeech = () => {
    const mostRecentAssistantMessage = [...transcriptItems]
      .reverse()
      .find((item) => item.role === "assistant");

    // console.log('mostRecentAssistantMessage', mostRecentAssistantMessage?.status, mostRecentAssistantMessage);
    // appContext.stopAudio();

    if (!mostRecentAssistantMessage) {
      return;
    }
    if (mostRecentAssistantMessage.status === "DONE") {
      return;
    }

    // console.log('do cancelAssistantSpeech');

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
      data: { content: "通話暫停中" },
      createdAtMs: Date.now(),
    });
  };

  const handleMicrophoneClick = () => {
    if (isLoading) {return;}
    if (isPTTUserSpeaking) {
      if(canPause){
        handleTalkOff();  // 掛斷電話
      } else {
        toast.info('系統回應中，需等待回應完成後再暫停對話。', {
          position: 'top-center',
          autoClose: 700,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
        });
      }
    } else {
      handleTalkOn();  // 開始講話
    }
  };

  const sttTextValid = utils.sttTextValid
  const sttTextValidEx = utils.sttTextValidEx

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
        if(!sttTextValid(title!)){
          chatContext.updateMessageContent(itemId, '');
        }else{
          chatContext.updateMessageContent(itemId, title!);
        }
          
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

  type sendSimulatedUserMessageOpts = {
    hide?: boolean;
    role?: 'user' | 'assistant' | 'system';

    noAppendToTranscript?: boolean;

    interruptAI?: boolean;

    triggerResponse?: boolean;
  }
  const sendSimulatedUserMessage = (text: string, opts: sendSimulatedUserMessageOpts = {}) => {
    text = (text || '').trim();
    if (!text) {
      return;
    }
    const id = uuidv4().slice(0, 32);
    const role = opts.role || "user";

    if (opts.interruptAI){
      console.log('interruptAI', true);
      cancelAssistantSpeech();
    }

    if (!opts.noAppendToTranscript) {
      addTranscriptMessage(id, role as any, text, !!opts.hide);
    }

    sendClientEvent(
      {
        type: "conversation.item.create",
        item: {
          id,
          type: "message",
          role: role,
          content: [{ type: "input_text", text }],
        },
      },
      "(simulated user text message)"
    );
    if (opts.triggerResponse) {
      sendClientEvent(
        { type: "response.create" },
        "(trigger response after simulated user text message)"
      );
    }
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

  type getChatHistoryTextOptions = {
    roleMap?: {[role:string]: string};
  }
  const getChatHistoryText = (opts: getChatHistoryTextOptions = {})=>{
    return utils.getChatHistoryText(transcriptItems, opts);
  }

  const getChatHistory = ()=>{
    const chatHistory = transcriptItems
    .filter(item => item.type === 'MESSAGE')
    .filter(item => {
      // Skip messages that should be hidden
      const content = item.title || '';
      return sttTextValid(content);
    })
    return chatHistory;
  }

  type getMessagePairsOptions = {
    spRole: 'assistant' | 'user';

    /** 指定一個數值，表示要額外保留後續幾則訊息以便分析 */
    keepNextMsgCount?: number;
    keepSystemMessage?: boolean;  /** 是否保留最後一則對話，因為是最後一則該則對話不會有另一個對象的回應 */
    keepLastMessage?: boolean;
  }

  /**
   * 分組訊息，變成由一則訊息搭配回應的形式
   * 
   * 比如 spRole 是 assistant 時，則會把1 則 assistant 的訊息和對應的多則 user 的訊息分同一組
   * 
   * @param spRole 
   * @returns 
   */
  const getMessagePairs = (opts: getMessagePairsOptions)=>{
    const spRole = opts.spRole;

    type Msg = (typeof chatContext.messageItems)[number]
    const pairs: { messages: Msg[], time: number }[] = []
    const craeteNextPair = (time: number) => {
      pairs.push({ messages: [], time });
    }
    const pushMsg = (msg: Msg) => {
      pairs[pairs.length - 1].messages.push(msg)
    }

    const msgItems = chatContext.messageItems.filter((msg) => {
      if (msg.type !== 'text') {
        return false;
      }
      if (msg.role === 'system' && !opts.keepSystemMessage) {
        return false;
      }
      // Skip messages that should be hidden
      const content = msg.data.content || '';
      return sttTextValidEx(content);
    });
    let foundStartMsg = false;
    let keepCount = 0;
    const keepCountMax = opts.keepNextMsgCount || 0;
    for(let i = 0; i < msgItems.length; i++){
      const msg = msgItems[i];
      if (msg.role === spRole) {
        foundStartMsg = true;
        craeteNextPair(msg.createdAtMs);
        pushMsg(msg)
        keepCount = 0;
        continue;
      }
      if (!foundStartMsg) {
        continue;
      }
      pushMsg(msg)
      if(msg.role === spRole){
        craeteNextPair(msg.createdAtMs);
        if(keepCountMax > 0){
          keepCount++;
          msgItems.slice(i + 1, i + 1 + keepCountMax).forEach((msg) => pushMsg(msg));
        }
      }
    }
    const fPairs = pairs.filter((p)=>p.messages.length > 0);
    return {
      startAt: fPairs[0]?.messages[0].createdAtMs || null,
      pairs: fPairs
    }
  }


  return {
    router,
    isClient,
    appRef,

    onSessionOpen,
    onSessionResume,
    onSessionClose,

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

    isSessionStarted,
    setIsSessionStarted,

    isPTTUserSpeaking,
    setIsPTTUserSpeaking,

    sendSimulatedUserMessage,

    getMessagePairs,

    getChatHistory,
    getChatHistoryText,

    handleTalkOn,
    handleTalkOff,
    cancelAssistantSpeech,
    sendClientEvent,
    
    addTranscriptMessage,
    clearTranscript,
    transcriptItems,
    canPause,

    progressTimerRef,
    isLoading: isLoading,

    endConversation
  }
}