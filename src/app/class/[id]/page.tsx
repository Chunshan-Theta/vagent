'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import { ChatProvider } from "@/app/contexts/ChatContext";
import App, { AppRef } from "./App";
import { useParams } from "next/navigation";
import { AgentConfig, Tool, TranscriptItem } from "@/app/types";
import { AppProvider } from "@/app/contexts/AppContext";
import { useAiChat } from "@/app/lib/ai-chat/aiChat";
import ChatView from "@/app/components/chat/ChatView";

import * as utils from '../utils'

function createAgentConfig(apiResult: any): AgentConfig {

  // Convert tools to full Tool objects and build toolLogic
  const { tools: fullTools, toolLogic } = utils.handleApiTools(apiResult.tools)
  const instructions = `
  現在開始，請扮演${apiResult.prompt_name}，以下是你的角色和更多詳細資料：
  ## 你的角色：${apiResult.prompt_name}
  ${apiResult.prompt_personas}
  ## 你的對談對象
  ${apiResult.prompt_customers}
  ## 你的工具使用規則與說明
  ${apiResult.prompt_tool_logics}
  ## 你的聲音風格
  ${apiResult.prompt_voice_styles}
  ## 你的對話模式
  ${apiResult.prompt_conversation_modes}
  ## 你的禁止詞
  ${apiResult.prompt_prohibited_phrases}
  `;

  return {
    name: apiResult.name,
    publicDescription: apiResult.public_description,
    instructions,
    tools: fullTools,
    toolLogic,
    ...apiResult
  };
}

function ClassChatPage() {
  const [chatBackground] = useState("#173944");
  const params = useParams();
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageBackground] = useState("linear-gradient(135deg, rgb(26, 42, 52) 0%, rgb(46, 74, 63) 100%)");
  const [localLoading, setLocalLoading] = useState(false);

  const {
    router,
    inputText,
    updateInputText,
    sendSimulatedUserMessage,
    handleMicrophoneClick,
    isPTTUserSpeaking,
    transcriptItems,
    setIsAnalyzing,
    setIsCallEnded,
    handleTalkOn,
    isCallEnded,
    isAnalyzing,
    setAnalysisProgress,
    appRef,
    progressTimerRef,
    endConversation,
    getChatHistoryText,
    getChatHistory,
    isLoading,
    onSessionOpen,
    onSessionResume,
    onSessionClose,
    clearTranscript
  } = useAiChat();

  const loading = useMemo(() => {
    return localLoading || isLoading || isAnalyzing;
  }, [localLoading, isLoading, isAnalyzing]);
  useEffect(() => {
    const fetchAgentConfig = async () => {
      try {



        const response = await fetch(`/api/agents/${params.id}`);
        if (!response.ok) {
          throw new Error('Agent not found');
        }
        const data = await response.json();
        console.log('fetchAgentConfig data', data);
        const agentConfig = createAgentConfig(data.agent);
        console.log('agentConfig', agentConfig);
        setAgentConfig(agentConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent');
      }
    };

    fetchAgentConfig();
  }, [params.id]);

  useEffect(() => {
    if (agentConfig) {
      console.log('clearTranscript!!! ');
      clearTranscript();
      handleTalkOn();
    }
  }, [agentConfig]);

  const onSubmitText = () => {
    sendSimulatedUserMessage(inputText, { hide: false, triggerResponse: true });
    updateInputText('');
  }

  const handleAnalyzeChatHistory = async () => {
    if (transcriptItems.length === 0) {
      alert("No chat history available to analyze");
      return;
    }
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
      const criteria = agentConfig?.criteria ?
          [agentConfig.criteria]:[
              `1. G（Goal）目標設定 - 評分目的：協助使用者清楚描述他想了解或探索的方向，引導出一個具體的提問或意圖。
                - 評分標準1： > 目標具體清晰（Goal Specificity & Clarity）
                  非常貼切：使用者能在引導下明確表達想知道的方向或提問意圖，問題聚焦明確且具體。
                  貼切：使用者有初步表達，但意圖或問題仍略顯模糊，需要進一步釐清。
                  一點貼切：使用者沒有明確方向，Agent未能有效協助釐清。
                
                - 評分標準2： > 激發正向探索動機（Eliciting Positive Curiosity）
                  非常貼切：Agent 透過友善語氣或提問方式，激發使用者好奇與興趣，主動展開互動。
                  貼切：Agent 嘗試引導但效果一般，使用者回應中性。
                  一點貼切：Agent 的語氣或回應冷淡，未能激發互動動力。`,
              `2. R（Reality）現況澄清 - 評分目的：理解使用者目前的感受、困惑或需求背景，建立共感與理解。
                - 評分標準1： > 情境澄清與理解（Clarifying Situation）
                  非常貼切：Agent 有效傾聽與回應使用者現況或背景敘述，幫助釐清問題脈絡。
                  貼切：Agent 對使用者提供部分理解，仍有些關鍵資訊未深入探詢。
                  一點貼切：Agent 未展現理解或略過使用者情境，互動跳躍。
                
                - 評分標準2： > 共感與尊重（Empathy & Respect）
                  非常貼切：Agent 展現真誠關懷與溫暖語氣，回應展現理解與包容。
                  貼切：語氣中性，尚有友善態度，但未明顯展現情緒共鳴。
                  一點貼切：回應冷淡或未顧及使用者感受。`,
              `3. O（Options）互動選擇 - 評分目的：提供使用者多元選擇或思考角度，避免引導單一結論。
                - 評分標準1： > 提供多元選項（Diverse Option Offering）
                  非常貼切：Agent 提供至少 2 個以上不同角度的建議、觀點或可能選擇，引導使用者自由探索。
                  貼切：有提供 1 項具參考價值的選項，或選項間差異較小。
                  一點貼切：僅提供單一回應方向，未鼓勵探索其他可能。
                
                - 評分標準2： > 鼓勵思辨與自主選擇（Encouraging Reflective Choice）
                  非常貼切：透過提問或對話鼓勵使用者評估不同想法，發展出自己認同的看法。
                  貼切：有鼓勵使用者表達，但未深入思辨。
                  一點貼切：未鼓勵思考，回應偏向單向給答案。`,
              `4. W（Will / Warmth）互動意願與溫度 - 評分目的：建立使用者信任與互動動力，讓互動感受溫暖、正向、有持續性。
                - 評分標準1： > 使用者參與意願（User Engagement）
                  非常貼切：使用者回應積極、持續參與，展現信任與投入感。
                  貼切：使用者維持中性互動，未明顯投入也未排斥。
                  一點貼切：使用者回應冷淡或中斷互動。
                
                - 評分標準2： > Agent 互動溫度（Agent Warmth & Encouragement）
                  非常貼切：Agent 持續展現溫暖、鼓勵、正向的語氣與回應風格，讓人感覺支持與安心。
                  貼切：語氣基本友善，但欠缺正向鼓勵或溫度略低。
                  一點貼切：語氣生硬或冷淡，難以建立信任與親近感。`
        ]
      
      
      console.log('agentConfig', agentConfig);
      console.log('anaylyze criteria:', criteria);
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
      const back = encodeURIComponent(`/class/${params.id}`);
      router.push(`/class/report?back=${back}`);
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

  if (error || !agentConfig) {
    return <div>Error: {error || 'Agent not found'}</div>;
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
      ></ChatView>
    )
  }

  return (
    <div style={{ background: pageBackground }}>
      {chatScene()}
      <div style={{ display: 'none' }}>
        <App
          ref={appRef}
          agentConfig={agentConfig}
          onSessionOpen={onSessionOpen}
          onSessionResume={onSessionResume}
          onSessionClose={onSessionClose}
        />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClassChatPage />
    </Suspense>
  );
} 