'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import App, { AppRef } from "@/app/App";
import { useRouter, useSearchParams } from "next/navigation";

import ChatView from "@/app/components/chat/ChatView";
import AskForm from "@/app/components/AskForm";
import { ReportV1, Timeline } from '@/app/types/ai-report';

import _ from '@/app/vendor/lodash';
import { v4 as uuidv4 } from "uuid";

import { useAiChat } from "@/app/lib/ai-chat/aiChat";

import { startAIMission, getAIMissionList } from '@/app/lib/ai-mission/missionAnalysis'
import { handleAnalysisExamples } from '@/app/lib/ai-chat/utils'
import { agentApi, convApi } from '@/app/lib/ai-chat'

import { toast } from 'react-toastify';
import { delay } from "@/app/lib/utils";
import { useChat } from "@/app/contexts/ChatContext";

const LABEL = 'try_chat_ui';

const settingsMap = {
  default: {
    sentimentColors: {
      netural: '#fff',
      angry: '#EF8354',
      frustrated: '#FFD166',
      open: '#06D6A0',
    }
  }
}

function TryChatUI() {
  const {

    inputText,
    updateInputText,

    isPTTUserSpeaking,
    canInterrupt,
    handleMicrophoneClick,
    transcriptItems,
    setIsAnalyzing,
    setIsCallEnded,
    isCallEnded,
    isAnalyzing,
    convInfo,
    clearHistory,

    endConversation,

    setAnalysisProgress,

    simProgressUp,
    analysisProgress,
  } = useAiChat();

  const chatCtx = useChat();

  const query = useSearchParams();
  // ------
  const pageInfo = {
    title: '測試 Chat UI'
  }
  // ------
  useEffect(() => {
    document.title = pageInfo.title;
  }, []);
  const [localLoading, setLocalLoading] = useState(false);
  const loading = useMemo(() => {
    return localLoading || isAnalyzing;
  }, [localLoading, isAnalyzing])
  const errors = useRef<any[]>([])
  const settings = settingsMap.default

  // styles start
  const [pageBackground] = useState("linear-gradient(135deg, rgb(26, 42, 52) 0%, rgb(46, 74, 63) 100%)");
  const [chatBackground] = useState("linear-gradient(rgb(46, 74, 63) 0%, rgb(26, 42, 52) 100%)")

  const [scene, setScene] = useState("init");
  const askItems = useRef([
    {
      type: 'text' as const,
      title: '請輸入您的名字',
      name: 'name',
      defaultValue: '',
    },
  ])
  const userInfo = useRef({
    name: '',
  })



  const onSubmitAskForm = (form: any) => {
    const datas = form.datas
    console.log('name:', datas.name)
    const name = (datas.name || '').trim()
    if (!name) {
      form.emitError('name', '請務必輸入名字')
      return
    }
    userInfo.current = { name }
    onAfterLogin(name).catch(console.error);
  }

  async function onAfterLogin(name: string) {
    clearHistory();
    setScene('chat');
  }

  const onSubmitText = () => {
    chatCtx.addMessageItem({
      type: "text",
      id: uuidv4(),
      role: 'user',
      data: {
        content: inputText,
      },
      createdAtMs: Date.now(),
    })
    updateInputText('');
  }

  async function startGenerateAiReport() {
    endConversation()

    await delay(700, 600)
    const base1 = 20
    setAnalysisProgress(base1);
    // const times = 20
    // for(let i = 0 ; i < times; i++) {
    //   setAnalysisProgress(base1 + Math.floor((i + 1) * (100 - base1) / times));
    //   await delay(400, 800);
    // }

    const ss = simProgressUp(base1, 80, 15000);
    ss.start();
    await delay(6000)
    ss.complete();

    await delay(2000);
    setAnalysisProgress(100);

  }

  /** 處理要放在對話紀錄裡面的  */
  function parseHistoryContent(content: string | undefined | null) {
    if (content == null) return ''
    const mContent = (content || '').trim().replace(/\n/g, ' ')
    return `"${mContent}"`
  }

  function formScene() {
    const bgStyles = {
      background: 'linear-gradient(135deg, rgb(26, 42, 52) 0%, rgb(46, 74, 63) 100%)',
      minHeight: '100dvh',
      display: 'flex',
      justifyContent: 'center',
      paddingTop: '20vh',
    }
    return (
      <div style={bgStyles}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <AskForm
            items={askItems.current}
            submitText="送出"
            onSubmit={onSubmitAskForm}
            theme="landbank"
          ></AskForm>
        </div>
      </div>
    )
  }

  function chatScene() {
    return (
      <ChatView
        classNames={['landbank']}
        background={chatBackground}
        isEnd={isCallEnded}
        isLoading={loading}
        isRecording={true}
        onSubmit={() => onSubmitText()}
        onClickEnd={() => startGenerateAiReport()}
        onMicrophoneClick={handleMicrophoneClick}
      ></ChatView>
    )
  }

  return (
    <div style={{ background: pageBackground }}>
      {
        scene === 'init' ? formScene()! :
          scene === 'chat' ? chatScene()! :
            <div>Unknown scene</div>
      }
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TryChatUI />
    </Suspense>
  );
} 