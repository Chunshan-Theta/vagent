'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { TranscriptProvider, useTranscript } from "@/app/contexts/TranscriptContext";
import { ChatProvider, useChat } from "@/app/contexts/ChatContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App, { AppRef } from "@/app/App";
import { useRouter } from "next/navigation";

import ChatView from "@/app/components/chat/ChatView";
import { AppProvider, useAppContext } from "@/app/contexts/AppContext";

import { v4 as uuidv4 } from "uuid";

import { useAiChat } from "@/app/lib/ai-chat/aiChat";

import AskForm from "@/app/components/AskForm";
import { delay } from "@/app/lib/utils";

function LandbankChatPage() {
  const {
    router,
    initConv,
    clearHistory,

    inputText,
    updateInputText,
    addTranscriptMessage,
    sendSimulatedUserMessage,
    isPTTUserSpeaking,
    canInterrupt,
    handleMicrophoneClick,
    handleTalkOn,
    transcriptItems,
    setIsAnalyzing,
    setIsCallEnded,
    isCallEnded,
    isAnalyzing,
    setAnalysisProgress,
    appRef,

    progressTimerRef,

    setupAnalysisState,
    endConversation,
    handleTalkOff,
    waitPostTask,

    getChatHistoryText,
    getChatHistory,

    isLoading,

    onSessionOpen,
    onSessionResume,
    onSessionClose,

    showSystemToast
  } = useAiChat();



  useEffect(() => {
    document.title = '業務陪練劇本';

    addTranscriptMessage(uuidv4().slice(0, 32), 'assistant', `💡 本次練習是「模擬與客戶對話」的情境練習，請你試著扮演顧問角色，看看你會怎麼回應客戶的疑問！
      這位客戶的基本情況如下：
      👤 客戶王小姐的背景：
      30 歲，已婚上班族
      全家月收入約 12 萬元（與配偶合計）
      每月主要開銷包含：
      🏠 房貸：桃園中路重劃區，貸款 800 萬元，每月還款 28,678 元
      🎓 小孩教育費：兩位孩子每月花費 3 萬元
      🛒 家用開銷（食衣住行、娛樂、保險等）：每月約 3 萬元
      ❤️ 孝親費：每月 5,000 元
      💬 王小姐的疑問與擔心：「保費太貴了，這樣會不會讓我們沒錢用？」
      
      `);
    addTranscriptMessage(uuidv4().slice(0, 32), 'assistant', `🎯 你的任務是：
      請試著用專業的說明方式，幫助王小姐釐清他的疑慮，讓他了解這張保單的保障意義，並一起找出最適合他的做法，進而提高他願意購買的可能性。
      這個練習會模擬實際對話，搭配即時回饋，幫助你強化與客戶溝通與說服的能力！
      
      現在我會作為『客戶王小姐』，讓您練習。
      `);
  }, []);
  const [localLoading, setLocalLoading] = useState(false);
  const loading = useMemo(() => {
    return localLoading || isLoading || isAnalyzing;
  }, [localLoading, isLoading, isAnalyzing])
  useEffect(() => {
    console.log('[deltaww] loading', loading);
  }, [loading])
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


  // 分析並移動到報告頁面
  const handleAnalyzeChatHistory = async () => {
    if (transcriptItems.length === 0) {
      alert("No chat history available to analyze");
      return;
    }
    if (!canInterrupt) {
      showSystemToast('wait_for_response');
      return;
    }

    setupAnalysisState(0);
    await handleTalkOff();
    await delay(700); // 等待幾秒，確保對話結束
    await waitPostTask();
    await delay(700); // 等待幾秒，確保對話結束
    endConversation();

    // Start a timer to increment progress over time
    progressTimerRef.current = setInterval(() => {
      setAnalysisProgress(prev => {
        // Cap at 95% until we get the actual result
        if (prev < 95) {
          return prev + 0.3;
        }
        return prev;
      });
    }, 300); // Increment every 300ms


    const chatHistory = getChatHistoryText()

    try {
      setAnalysisProgress(30);

      // Perform analysis here before redirecting
      const criteria = `
評分標準標題 1：用淺白語言闡述財富價值
非常好：使用強烈視覺化的比喻（如「財務安全氣囊」），具體描述保險如何在意外時吸收房貸壓力，並提及保護對象（如家人），情境鮮明且具象。
好：使用簡單比喻（如「安全氣囊」），點出保險的關鍵作用，但描述稍簡略，未展開細節。
普通：文字平淡，僅泛泛提及保障功能，缺乏具體畫面或吸引力。
不太好：語言抽象（如「避免風險」），未提供具體情境，難以引發客戶共鳴。
無法判斷：未提及或無法判斷。
---
評分標準標題 2：梳理對話邏輯提升客戶信心
非常好：先確認客戶疑慮（如「保費太高」），接著解釋原因並連結實際情境（房貸壓力），最後提出具體且彈性的解決方案，邏輯流暢。
好：回應疑慮並提供解決方案，但解釋環節較簡略，未能充分鋪陳。
普通：回應直接但缺乏層次感，僅提及方案調整，未展現完整邏輯。
不太好：回應零散，無明確結構，甚至顯得敷衍，難以建立專業感。
無法判斷：未提及或無法判斷。
---
評分標準標題 3：回應客戶情緒建立信任關係
非常好：具體點出客戶生活壓力（如「房貸、學費」），展現深度理解，並自然過渡到保障建議，情緒共鳴強。
好：認同客戶情緒（如「精打細算」），但未展開具體情境，理解感稍弱。
普通：泛泛回應客戶想法，缺乏針對性細節，情緒連結不足。
不太好：忽視或輕視客戶情緒（如「不算什麼」），可能引發反感。
無法判斷：未提及或無法判斷。
---
評分標準標題 4：針對客戶疑慮提供精準解方
非常好：針對疑慮（如「短期財務壓力」）提出具體方案（如「保費遞增型」），包含數字細節並徵詢意見，解決力強。
好：回應疑慮並給出方向（如「基本保障」），但細節不夠具體。
普通：泛泛建議調整方案，缺乏針對性細節，解決力有限。
不太好：回應空洞或過於自信（如「不會有更低的」），未能有效解惑。
無法判斷：未提及或無法判斷。
---
評分標準標題 5：用數據佐證凸顯財富效益
非常好：用具體數字（如「每天 40 元」對比「500 萬房貸」），並以生活化單位（如「便當錢」）解釋，效益清晰且吸引人。
好：提供數字（如「1.5 萬 vs. 500 萬」），但未細化到日常層面，說服力稍弱。
普通：提及保費與保障關係，但數字模糊，缺乏震撼力。
不太好：數字空泛（如「幾千塊」），未能有效凸顯效益。
無法判斷：未提及或無法判斷。
---
評分標準標題 6：闡述風險對比凸顯保障優勢
非常好：詳細對比無保險的風險（「500 萬房貸，每月 2.5 萬」）與有保險的安心，數字明確且具衝擊力。
好：點出風險與保障差異，但細節不夠具體，力度稍弱。
普通：泛泛提及保障作用，風險描述模糊，難以打動客戶。
不太好：風險與保障關係不清，表達空洞，缺乏說服力。
無法判斷：未提及或無法判斷。
---
評分標準標題 7：分享成功案例增強說服力
非常好：講述具體案例（「三年前投保，400 萬房貸還清」），細節豐富且具情感共鳴。
好：提及案例並點出效果，但缺乏細節，故事性稍弱。
普通：泛泛提及他人經驗，無具體內容，說服力不足。
不太好：僅空洞推薦，無案例支撐，難以建立信任。
無法判斷：未提及或無法判斷。
---
評分標準標題 8：順勢探詢意願促進財富規劃
非常好：以具體調整（如「每天 40 元」）為基礎，自然徵詢意見（如「這樣符合您的規劃嗎？」），過渡流暢。
好：提出調整後簡單詢問意願，語氣自然但吸引力稍弱。
普通：直接問看法，缺乏引導鋪陳，略顯突兀。
不太好：語氣急促或推銷感強（如「要不要試試」），易讓客戶抗拒。
無法判斷：未提及或無法判斷。
`.trim().split('---').map(item => item.trim());

      const weights = [0.5, 0.5, 0.5, 0.5];

      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatHistory,
          rubric: {
            criteria,
            weights,
          },
        }),
      });

      setAnalysisProgress(70);

      if (!response.ok) {
        throw new Error('Failed to analyze conversation');
      }

      const analysisResult = await response.json();

      // Ensure the analysis result has the expected structure
      if (!analysisResult.scores || !analysisResult.overallScore || !analysisResult.feedback) {
        throw new Error('Invalid analysis result format');
      }

      // Ensure each score has the required fields
      analysisResult.scores.forEach((score: any) => {
        if (!score.examples) score.examples = [];
        if (!score.improvementTips) score.improvementTips = [];
      });

      // Ensure summary and overallImprovementTips exist
      if (!analysisResult.summary) analysisResult.summary = "No summary available.";
      if (!analysisResult.overallImprovementTips) analysisResult.overallImprovementTips = ["No improvement tips available."];

      // Ensure language field exists
      if (!analysisResult.language) analysisResult.language = "en";

      // Clear the progress timer
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      setAnalysisProgress(90);

      // Store the analysis result and chat history in localStorage
      localStorage.setItem('analysisResult', JSON.stringify(analysisResult));
      localStorage.setItem('chatHistory', chatHistory);
      localStorage.setItem('chatMessages', JSON.stringify(getChatHistory()));

      setAnalysisProgress(100);

      // Redirect to the analysis report page
      const back = encodeURIComponent('/demo/landbank');
      router.push(`/demo/landbank/report?back=${back}`);
    } catch (error) {
      // Clear the progress timer on error
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      console.error('Error analyzing conversation:', error);
      alert('Failed to analyze conversation. Please try again.');
      setIsAnalyzing(false);
    }
  };


  const onSubmitAskForm = (form: any) => {
    const datas = form.datas
    console.log('name:', datas.name)
    const name = (datas.name || '').trim()
    if (!name) {
      form.emitError('name', '請務必輸入名字')
      return
    }

    onAfterLogin(name).catch(console.error);
  }

  async function onAfterLogin(name: string) {
    clearHistory();
    await initConv({
      uname: name,
      agentType: 'static',
      agentId: 'landbank',
    })
    setScene('chat');
  }
  // 等切換到 chat 之後要自動開 mic
  useEffect(() => {
    if (scene === 'chat') {
      handleTalkOn();
    }
  }, [scene])

  const onSubmitText = () => {
    sendSimulatedUserMessage(inputText, { hide: false, triggerResponse: true, interruptAI: true });
    updateInputText('');
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
            submitText="送出並開始"
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
        isRecording={isPTTUserSpeaking}
        onSubmit={() => onSubmitText()}
        onClickEnd={() => handleAnalyzeChatHistory()}
        onMicrophoneClick={handleMicrophoneClick}
        lang="zh"
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

      {/* App Component - properly initialized */}
      <div style={{ display: 'none' }}>
        <App
          ref={appRef}
          agentSetKey="landbankAgent"
          onSessionOpen={onSessionOpen}
          onSessionResume={onSessionResume}
          onSessionClose={onSessionClose}
        />
      </div>
    </div>
  );
}

// Use a client-only component to avoid hydration errors
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandbankChatPage />
    </Suspense>
  );
} 