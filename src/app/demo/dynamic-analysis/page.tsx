'use client';

import React, { Suspense, useState, useEffect, useRef } from "react";
import { TranscriptProvider, useTranscript } from "@/app/contexts/TranscriptContext";
import { ChatProvider, useChat } from "@/app/contexts/ChatContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App, { AppRef } from "@/app/App";
import { useRouter } from "next/navigation";
import { FaMicrophone, FaPhone, FaVolumeUp, FaHashtag, FaSpinner } from 'react-icons/fa';

import ChatView from "@/app/components/chat/ChatView";
import { AppProvider, useAppContext } from "@/app/contexts/AppContext";


import { v4 as uuidv4 } from "uuid";

function DynamicAnalysisContent() {
  const router = useRouter();
  const chatContext = useChat();
  const { transcriptItems, addTranscriptMessage } = useTranscript();
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
  // 分析並移動到報告頁面
  const handleAnalyzeChatHistory = async () => {
    if (transcriptItems.length === 0) {
      alert("No chat history available to analyze");
      return;
    }

    setIsAnalyzing(true);
    setIsCallEnded(true);
    setAnalysisProgress(10);

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

    // Stop the realtime connection and audio
    if (appRef.current) {
      appRef.current.disconnectFromRealtime();
    }

    const chatHistory = transcriptItems
      .filter(item => item.type === 'MESSAGE')
      .map(item => `${item.role}: ${item.title}`)
      .join('\n\n');

    try {
      setAnalysisProgress(30);

      // Perform analysis here before redirecting
      const criteria = [
        '1. G（Goal）目標設定 -評分目的：引導部屬描述希望達成的具體成果樣貌，避免籠統空泛。 運用開放式提問，以部屬為中心，引導其自主探索並表達自己真正想達成的目標。 -評分標準1： > 目標具體清晰 (Goal Specificity & Clarity)：引導部屬描述希望達成的具體成果樣貌，避免籠統空泛。 非常貼切： 目標描述非常具體，成果樣貌清晰可想像，且可驗證。 貼切： 目標大致具體，但部分描述仍有些模糊或不易驗證。 一點貼切： 目標描述籠統、空泛、不切實際。 -評分標準2： > 引導自主目標設定 (Guiding Self-Set Goals) ：運用開放式提問，以部屬為中心，引導其自主探索並表達自己真正想達成的目標。 非常貼切： 透過有效的開放式提問，成功引導部屬清晰表達出內心認同、自主設定的目標。 貼切： 嘗試使用開放式提問，部屬表達了目標，但自主性或清晰度稍弱，或受到主管較多暗示。 一點貼切： 主要由主管給定目標、使用封閉式提問，或未能引導部屬表達其真實想法。',
        '2. R（Reality）現況分析 -評分目的： 引導部屬釐清當前的具體狀況、已知資訊、已嘗試方法，並適時補充主管的客觀觀察/數據。協助部屬盤點目前遇到的困難、干擾因素，並探索可能的盲點或未被注意的面向。 -評分標準1： > 現況釐清與事實盤點 (Situation Clarification & Fact Inventory)： 引導部屬釐清當前的具體狀況、已知資訊、已嘗試方法，並適時補充主管的客觀觀察/數據。 非常貼切： 部屬充分陳述事實，主管有效補充關鍵資訊，雙方對客觀現況有清晰共識。 貼切： 部屬陳述了部分事實，主管有補充，但對整體狀況的掌握不夠全面。 一點貼切： 陳述不清、避重就輕，或參雜過多主觀臆測，未能釐清客觀事實。 -評分標準2： > 挑戰探索與盲點覺察 (Challenge Exploration & Blind Spot Awareness)：協助部屬盤點目前遇到的困難、干擾因素，並探索可能的盲點或未被注意的面向。 非常貼切：深入探討了核心困難與干擾因素，並成功引導部屬覺察到至少一個先前未意識到的盲點。 貼切：討論了表面困難，但對根本原因或潛在盲點的探索不夠深入。 一點貼切：未能有效引導部屬面對困難，或完全忽略了對盲點的探索。',
        '3. O（Options）方案選擇 -評分目的： 鼓勵部屬主動發想出多種不同的可行行動方案，避免陷入單一思維。 引導部屬思考選項時能連結相關經驗、資源（他人建議、外部資源等），並適時融入主管經驗共同探討。 -評分標準1： > 選項發想的廣度 (Breadth of Option Generation)： 鼓勵部屬主動發想出多種不同的可行行動方案，避免陷入單一思維。 非常貼切： 引導部屬主動提出 2個或以上 來自不同角度或思路的選項。 貼切：引導部屬提出 至少1個 選項，或選項同質性高、不夠多元。 一點貼切：未引導部屬思考，直接給答案，或只停留在單一、顯而易見的選項。 -評分標準2： > 選項探索的深度與資源連結 (Depth of Option Exploration & Resource Linking)：引導部屬思考選項時能連結相關經驗、資源（他人建議、外部資源等），並適時融入主管經驗共同探討。 非常貼切：能引導部屬從多元角度（經驗/資源/他人）思考，並結合主管經驗深入探討選項的可行性。 貼切：有嘗試引導從不同角度思考，但連結不夠深入，或主管經驗分享變成單向指導。 一點貼切： 選項思考侷限於部屬自身經驗，未引導連結其他資源或經驗。',
        '4. W（Will/ Way Forward）意願與行動 -評分目的： 引導部屬制定具體、可執行的下一步行動，包含「何時做」、「做什麼」。 確認部屬對行動計畫的執行承諾度，並建立清晰的追蹤方式。 -評分標準1： >  行動計畫的清晰度 (Clarity of Action Plan)：引導部屬制定具體、可執行的下一步行動，包含「何時做」、「做什麼」。 非常貼切：行動計畫非常具體（含人/事/時），步驟清晰、可操作性強。 貼切：行動計畫大致可行，但部分步驟或時間點不夠明確。 一點貼切：行動計畫模糊不清、缺乏具體步驟或時間規劃。 -評分標準2： > 執行承諾與追蹤 (Commitment & Follow-up)：確認部屬對行動計畫的執行承諾度，並建立清晰的追蹤方式。 非常貼切：部屬明確表達高承諾度（例如：意願分數高、語氣肯定），並共同約定具體的追蹤時間與方式。 貼切： 部屬口頭承諾，但意願感受不明顯或有猶豫，追蹤方式不夠具體。 一點貼切： 部屬意願低落或迴避承諾，未建立追蹤機制。'
      ];

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

      setAnalysisProgress(100);

      // Redirect to the analysis report page
      router.push('/demo/analysis-report');
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
  const { messageItems, inputText, addMessageItem, updateInputText, submitInputText } = useChat();
  const useExamples = false;
  const lastInput = useRef({
    lastUserInputIndex: -1,
    lastAssistantOutputIndex: -1,
    lastPair: [-1, -1],
  })


  useEffect(() => {
    if (!useExamples) return;
    // 添加範例資料
    for (let i = 0; i < 3; i += 1) {
      addMessageItem({
        id: `S-${i}`,
        type: 'text',
        role: 'system',
        data: { content: `您的目標是透過 專業溝通與異議處理技巧，讓客戶理解房貸壽險的保障價值，找到適合他的規劃方式，並提升購買意願。\n\n透過 實戰模擬與即時回饋，讓我們一起提升您的房貸壽險銷售能力！:rocket:` },
        createdAtMs: Date.now() + i * 1000,
      });
      addMessageItem({
        id: `U-${i}`,
        type: 'text',
        role: 'user',
        data: { content: `你好` },
        createdAtMs: Date.now() + i * 1000,
        // avatar: '/images/avatar.png',
      });
      addMessageItem({
        id: `A-${i}`,
        type: 'text',
        role: 'assistant',
        data: { content: `你好啊，我今天是想了解一下房貸的事情。不過我聽說你們那個房貸壽險要30萬？這也太貴了吧！！我家每個月就剩2.5萬可以存，這樣一家拿出30萬，等於我們全家要存一整年耶！而且我還有兩個小孩要養，每個月教育費就要2萬，哪有多餘的錢買這個啊？` },
        createdAtMs: Date.now() + (i + 10) * 1000,
        avatar: '/images/avatar.png',
      });
    }
  }, []);
  // transcriptItems 有新東西時呼叫這個，同步添加到 chatContext 內
  const onNewMessage = (index: number) => {
    const transcriptItem = transcriptItems[index];
    chatContext.addMessageItem({
      id: transcriptItem.itemId,
      type: 'text',
      role: transcriptItem.role!,
      data: { content: inputText },
      createdAtMs: Date.now(),
    });
  };
  useEffect(() => {
    const updateUserMsg = () => {

      const lastUserInputIndex = transcriptItems.findLastIndex(item => item?.role === 'user');
      // 這邊忽略 lastUserInputIndex === 2 的訊息，不讓它出現在畫面上
      if (lastUserInputIndex !== -1 && lastUserInputIndex !== lastInput.current.lastUserInputIndex) {
        if (lastUserInputIndex === 2) { return; }
        onNewMessage(lastUserInputIndex);
        lastInput.current = {
          ...lastInput.current,
          lastUserInputIndex
        };
      }
      if (lastUserInputIndex >= 0) {
        if (lastUserInputIndex === 2) { return; }
        const item = transcriptItems[lastUserInputIndex]
        chatContext.updateMessageContent(item.itemId, item.title!);
      }
    }
    const updateAssistantMsg = () => {

      const lastAssistantOutputIndex = transcriptItems.findLastIndex(item => item?.role === 'assistant');
      if (lastAssistantOutputIndex !== -1 && lastAssistantOutputIndex !== lastInput.current.lastAssistantOutputIndex) {
        onNewMessage(lastAssistantOutputIndex);
        lastInput.current = {
          ...lastInput.current,
          lastAssistantOutputIndex
        };
      }
      if (lastAssistantOutputIndex >= 0) {
        const item = transcriptItems[lastAssistantOutputIndex]
        chatContext.updateMessageContent(item.itemId, item.title!);
      }
    }
    updateUserMsg()
    updateAssistantMsg()

  }, [transcriptItems]);
  // 當用戶說話且 AI 回應後，觸發 onNewMessage() 函數
  // 要分析 input + history 並且生成一組新的 messages
  const onNewMessagePairReady = (index1: number, index2: number) => {
    const lastUserInputIndex = index1;
    const lastAssistantOutputIndex = index2;
    const lastUserInput = transcriptItems[lastUserInputIndex];
    const lastAssistantOutput = transcriptItems[lastAssistantOutputIndex];

    const input = lastUserInput.title!
    const reply = lastAssistantOutput.title!
    // TODO 準備分析
  }
  useEffect(() => {
    // 當 transcriptItems 更新時觸發 onNewMessage() 函數
    const lastUserInputIndex = transcriptItems.findLastIndex(item => item?.role === 'user');
    const lastAssistantOutputIndex = transcriptItems.findLastIndex(item => item?.role === 'assistant');
    if (lastUserInputIndex === -1 || lastAssistantOutputIndex === -1) {
      return;
    }
    const [prevIndex1, prevIndex2] = lastInput.current.lastPair
    if (prevIndex1 === lastUserInputIndex && prevIndex2 === lastAssistantOutputIndex) {
      // 如果沒有變化則不執行
      return;
    }
    if (lastAssistantOutputIndex < lastUserInputIndex) {
      return;
    }
    const lastAssistantMsg = transcriptItems[lastAssistantOutputIndex];
    // 等待 AI 回應結束後再執行
    if (lastAssistantMsg.status !== 'DONE') {
      return;
    }
    try {
      onNewMessagePairReady(lastUserInputIndex, lastAssistantOutputIndex);
    } catch (e) {
      console.error('Error in onNewMessage:', e);
    }
    lastInput.current = {
      ...lastInput.current,
      lastPair: [lastUserInputIndex, lastAssistantOutputIndex],
    }
  }, [transcriptItems]);


  const onSubmitText = () => {
    sendSimulatedUserMessage(inputText);
    chatContext.updateInputText('');
  }
  return (
    <div style={{ background }}>
      <ChatView
        background="#173944"
        isEnd={isCallEnded}
        isLoading={isAnalyzing}
        onSubmit={() => onSubmitText()}
        onClickEnd={() => handleAnalyzeChatHistory()}
      ></ChatView>
      {/* Hidden App Component */}
      <div className="hidden">
        <App hideLogs={false} ref={appRef} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <AppProvider>
          <ChatProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <DynamicAnalysisContent />
            </Suspense>
          </ChatProvider>
        </AppProvider>
      </EventProvider>
    </TranscriptProvider>
  );
} 