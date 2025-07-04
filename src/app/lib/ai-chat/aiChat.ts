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
import { getTranslation, Language } from "@/app/i18n/translations";

import * as convApi from '@/app/lib/ai-chat/convApi'

import _ from '@/app/vendor/lodash';

/**
 * 聊天介面基本需要的狀態
 * @returns 
 */
export function useAiChat(){
  const router = useRouter();
  const chatContext = useChat();
  const { inputText, updateInputText } = chatContext;
  const transcript = useTranscript();
  const { transcriptItems, clearTranscript, addTranscriptMessage, updateTranscriptItemStatus } = transcript;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallEnded, setIsCallEnded] = useState(false);
  // const [analysisProgress, setAnalysisProgress] = useState(0);
  const [language, setLanguage] = useState('en' as Language);

  const analysisProgress = chatContext.analysisProgress;
  const setAnalysisProgress = chatContext.setAnalysisProgress;

  const lastSimProgress = useRef<ReturnType<typeof simProgressUp>|null>(null);


  const clearHistory = ()=>{
    chatContext.clearMessages();
    transcript.clearTranscript();
    convInfo.current.convId = null;
    convInfo.current.audioCount = 0;
    msgIdMap.current = {};
  }

  const appContext = useAppContext();
  const { sendClientEvent } = appContext;
  
  const { sttPrompt, startAsk } = sharedConfig;

  // 是否套用錄音上傳功能
  const enableAudioRecording = true;
  // styles end

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appRef = useRef<AppRef>(null);
  const [isClient, setIsClient] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState(false);
  const [waitRealtimeConnection, setWaitRealtimeConnection] = useState(false);

  const uploadPromises = useRef<Promise<any>[]>([]);

  const isUploading = useMemo(() => {
    return uploadPromises.current.length > 0;
  }, [uploadPromises.current.length]);

  
  const addUploadPromise = (promise: Promise<any>) => {
    uploadPromises.current = [...uploadPromises.current, promise];
    promise
      .then(()=>{
        uploadPromises.current = uploadPromises.current.filter(p => p !== promise);
      })
      .catch((err)=>{
        uploadPromises.current = uploadPromises.current.filter(p => p !== promise);
        throw err;
      })
  }

  const waitPostTask = async ()=>{
    if (uploadPromises.current.length === 0) {
      return;
    }
    // 等待所有上傳完成
    await Promise.all(uploadPromises.current);
  }


  const msgIdMap = useRef<{ [key: string]: string }>({});
  // 每一個 Conv 對應一次完整的互動紀錄
  const convInfo = useRef<{ convId : string | null, audioCount: number }>({ convId: null, audioCount: 0 });

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

  const throttledUpdateRef = useRef<{ [id: string]: (id: string, content: string) => void }>({});
  type initConvOptions = {
    email?: string;
    uname?: string;
    name?: string; // uname 的別名
    agentType: string;
    agentId: string;
  }
  const initConv = async (opts: initConvOptions) => {
    const conv = await convApi.createConv({
      email: opts.email,
      uname: opts.uname ?? opts.name,
      agentType: opts.agentType,
      agentId: opts.agentId,
    })
    convInfo.current.convId = conv.id;
    convInfo.current.audioCount = 0; // 初始化音訊計數
    
    console.log('conv created', conv);
  }
  type addConvMessageOpts = Parameters<typeof convApi.addConvMessage>[1]
  const addConvMessage = (opts: addConvMessageOpts & { itemId?: string }) => {
    if (convInfo.current.convId) {
      const mOpts = { ...opts, itemId: undefined };
      convApi.addConvMessage(
        convInfo.current.convId,
        mOpts
      ).then((res)=>{
        console.log('addConvMessage', res);
        if (opts.itemId) {
          // 如果有 itemId，則更新 msgIdMap
          msgIdMap.current[opts.itemId] = res.id;
        }
      })
      .catch((err)=>{
        console.error('addConvMessage error', err);
      })
    }
  }
  const updateConvMessageContent = (itemId: string, content: string) => {
    if (convInfo.current.convId && msgIdMap.current[itemId]) {
      const convId = convInfo.current.convId;
      const messageId = msgIdMap.current[itemId];
      if (messageId) {
        convApi.updateConvMessageContent(convId, messageId, content)
          .catch((err) => {
            console.error('updateConvMessageContent error', err);
          });
      } else {
        console.warn('No message ID found for itemId:', itemId);
      }
    }
  }

  const handleTalkOn = async () => {
    // alert("handleTalkOn");
    setWaitRealtimeConnection(true);

    if (appRef.current) {
      // 開始錄音的設定會在 connectToRealtime 裡面
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

  const canInterrupt = useMemo(() => {
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
    } else {
      return true; // 如果沒有接通通話，仍然視為可以中斷
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

  const showCanNotInterruptToast = () => {
    toast.info(getTranslation(language, 'ai_chatbot_action.wait_for_response'), {
      position: 'top-center',
      autoClose: 700,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
    });
  }
  const showSystemToast = (id: 'wait_for_response')=>{
    if(id === 'wait_for_response'){
      showCanNotInterruptToast();
    }
  }

  /**
   * 針對某些不能捕捉實際的進度的情況，模擬進度上升
   * 
   * 最後距離完成差距 0.2 以內的進度，會以 1/10 的速度上升
   * @param startProgress 
   * @param endProgress 
   * @param duration 預估執行完成的時間 (ms)
   */
  const simProgressUp = (startProgress: number, endProgress: number, duration: number = 10000) => {
    const interval = 200; // 每 200ms 更新一次進度
    const valRange = endProgress - startProgress;
    const topVal = valRange * 0.8 + startProgress; // 最後 20% 的進度以 1/10 的速度上升
    const step = (valRange) / (duration / interval);
    const state = {
      start,
      stop,
      complete,

      timerId: null as any,
    }
    function _next(){
      if (state.timerId) {
        clearTimeout(state.timerId);
        state.timerId = null;
      }
      if (startProgress >= endProgress) {
        return;
      }
      let addVal = step
      if (startProgress >= topVal) {
        // 最後的進度以 1/10 的速度上升
        addVal += step / 10; // 每次增加 0.02
      }
      setAnalysisProgress((prev)=>prev + addVal);
      state.timerId = setTimeout(_next, interval);
    }
    function start(){
      if(lastSimProgress.current){
        lastSimProgress.current.stop();
      }
      lastSimProgress.current = state;
      _next();
      return state;
    }
    function stop(){
      if (state.timerId) {
        clearTimeout(state.timerId);
        state.timerId = null;
      }
      if (lastSimProgress.current) {
        lastSimProgress.current = null;
      }
      return state;
    }
    function complete(){
      stop();
      setAnalysisProgress(endProgress);
      return state;
    }
    return state
  }


  const handleTalkOff = async () => {
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
    const content = getTranslation(language, 'ai_chatbot_action.stop_call')
    chatContext.addMessageItem({
      id: end_id,
      type: 'text',
      role: 'user',
      data: { content },
      createdAtMs: Date.now(),
    });
    
    if(convInfo.current.convId){
      // 添加到對話紀錄
      addConvMessage({
        type: 'text',
        role: 'user',
        content,
        audioRef: null, // 根據音訊的 index 做紀錄
      })
      if(enableAudioRecording){
        // 每當結束通話時都把音訊存起來
        const rec = appContext.recorder
        rec.toggleRecorder(false);
        const uploadFN = async (type: 'las'|'ras')=>{
          const blob = await rec.getAudioBlob(type)
          if (!blob) {
            console.warn('No audio blob to upload');
            return;
          }
          const name = type === 'las' ? 'user_audio' : type === 'ras' ? 'assistant_audio' : 'unknown_audio'
          if(name === 'unknown_audio'){
            throw new Error('Unknown audio name');
            return;
          }
          return convApi.uploadConvAudio(
            blob,
            convInfo.current.convId!,
            name,
            'audio/wav',
            Date.now() - rec.state.current.startTime
          )
        }
        
        convInfo.current.audioCount++;
        addUploadPromise(uploadFN('las').catch(console.error));
        addUploadPromise(uploadFN('ras').catch(console.error));
      }
        
    }
    
  };

  const handleMicrophoneClick = () => {
    if (isLoading) {return;}
    if (isPTTUserSpeaking) {
      if(canInterrupt){
        handleTalkOff();  // 掛斷電話
      } else {
        // 顯示 "系統回應中，請稍候..."
        showCanNotInterruptToast();
        return;  // 如果不能中斷，則不做任何事
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
        const audioRef = `conv:${convInfo.current.audioCount}`; // 根據音訊的 index 做紀錄
        const createdTime = newItem.createdAtMs ?? Date.now();
        const audioStartTime = (createdTime - appContext.recorder.state.current.startTime) / 1000;
        const chatMsg = {
          id: newItem.itemId,
          type: 'text',
          role: newItem.role!,
          data: { content: newItem.title, audioRef, audioStartTime },
          createdAtMs: newItem.createdAtMs,
          hide: !!newItem.isHidden || newItem.role === 'system',
        }
        chatContext.addMessageItem(chatMsg as any)
        console.log('add msg', )
        addConvMessage({
          itemId: newItem.itemId,
          type: 'text',
          role: newItem.role!,
          content: newItem.title || '',
          audioRef, 
          audioStartTime: audioStartTime,
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
        // 每個 ID 要套用 throttle 避免更新過快
        if (!throttledUpdateRef.current[itemId]) {
          throttledUpdateRef.current[itemId] = _.throttle((id: string, content: string) => {
            updateConvMessageContent(id, content);
          }, 1000, { leading: true, trailing: true });
        }
        throttledUpdateRef.current[itemId](item.itemId, item.title || '');
      } else if (action === 'update_status') {
        // 當訊息狀態更新，通常是 IN_PROGRESS -> DONE
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
      updateTranscriptItemStatus(id, "DONE")
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

  const setupAnalysisState = (progress: number)=>{
    setIsAnalyzing(true);
    setIsCallEnded(true);
    setAnalysisProgress(progress);
  }

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
    items?: typeof transcriptItems;
  }
  const getChatHistoryText = (opts: getChatHistoryTextOptions = {})=>{
    const items = opts.items || transcriptItems;
    return utils.getChatHistoryText(items, opts);
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
        if(keepCountMax > 0){
          keepCount++;
          msgItems.slice(i + 1, i + 1 + keepCountMax).forEach((msg) => pushMsg(msg));
        }
        craeteNextPair(msg.createdAtMs);
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
    initConv,

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
    setLanguage,
    addTranscriptMessage,
    clearTranscript,
    transcriptItems,
    canInterrupt: canInterrupt,

    progressTimerRef,
    isLoading: isLoading,

    waitPostTask,
    setupAnalysisState,
    endConversation,
    showSystemToast,

    convInfo: convInfo,
    clearHistory,
    simProgressUp,
  }
}