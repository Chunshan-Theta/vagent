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
import { getTranslation, Language } from "@/app/i18n/translations";
import LanguageToggle from "@/app/components/LanguageToggle";

import * as utils from '../utils'

async function translateToLanguage(text: string, targetLang: Language): Promise<string> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const result = await response.json();
    return result.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text if translation fails
  }
}

async function createAgentConfig(apiResult: any, lang?: Language): Promise<AgentConfig> {
  // Convert tools to full Tool objects and build toolLogic
  const toolConfig = utils.handleApiTools(apiResult.tools)
  
  const promptName = apiResult.prompt_name;
  const promptPersonas = apiResult.prompt_personas;
  const promptCustomers = apiResult.prompt_customers;
  const promptToolLogics = apiResult.prompt_tool_logics;
  const promptVoiceStyles = apiResult.prompt_voice_styles;
  const promptConversationModes = apiResult.prompt_conversation_modes;
  const promptProhibitedPhrases = apiResult.prompt_prohibited_phrases;

  let instructions = `
  Now, please play the role of ${promptName}, here are your role and more details:
  ## Your Role: ${promptName}
  ${promptPersonas}
  ## Your Conversation Partner
  ${promptCustomers}
  ## Your Tool Usage Rules and Instructions
  ${promptToolLogics}
  ## Your Voice Style
  ${promptVoiceStyles}
  ## Your Conversation Mode
  ${promptConversationModes}
  ## Your Prohibited Phrases
  ${promptProhibitedPhrases}

  !Note: You will speak in ${lang} language, please respond in ${lang} language.
  `;
  console.log('instructions source', instructions);

  instructions = await translateToLanguage(instructions, lang || 'zh');
  console.log('instructions translated', instructions);


  return {
    ...apiResult,
    name: apiResult.name,
    publicDescription: apiResult.public_description,
    instructions,
    tools: toolConfig.tools,
    toolLogic: toolConfig.toolLogic,
    lang: lang || "zh",
  };
}

function ClassChatPage() {
  const [chatBackground] = useState("#173944");
  const params = useParams();
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageBackground] = useState("linear-gradient(135deg, rgb(26, 42, 52) 0%, rgb(46, 74, 63) 100%)");
  const [localLoading, setLocalLoading] = useState(false);
  const [clientLanguage, setClientLanguage] = useState<Language>(localStorage.getItem('client-language') as Language || 'zh');

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
    clearTranscript,
    setLanguage
  } = useAiChat();


  useEffect(() => {
    setClientLanguage(localStorage.getItem('client-language') as Language || 'zh');
    setLanguage(localStorage.getItem('client-language') as Language || 'zh');
  }, []);

  const loading = useMemo(() => {
    return localLoading || isLoading || isAnalyzing;
  }, [localLoading, isLoading, isAnalyzing]);
  useEffect(() => {
    const fetchAgentConfig = async () => {
      try {
        const response = await fetch(`/api/agents/${params.id}`);
        if (!response.ok) {
          throw new Error(getTranslation(clientLanguage, 'errors.failed_to_load'));
        }
        const data = await response.json();
        console.log('fetchAgentConfig data', data);
        const agentConfig = await createAgentConfig(data.agent, clientLanguage);
        console.log('agentConfig', agentConfig);
        setAgentConfig(agentConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : getTranslation(clientLanguage, 'errors.failed_to_load'));
      }
    };

    fetchAgentConfig();
  }, [params.id, clientLanguage]);

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
          detectedLanguage: clientLanguage,
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
    return <div>{error || getTranslation(clientLanguage, 'info.try_to_load_agent')}</div>;
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
        lang={clientLanguage}
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
      <LanguageToggle
        currentLanguage={clientLanguage}
        onLanguageChange={(lang) => {
          console.log('lang', lang); 
          setLanguage(lang as Language);
          setClientLanguage(lang as Language);
          localStorage.setItem('client-language', lang);
          window.location.reload();
        }}
      />
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