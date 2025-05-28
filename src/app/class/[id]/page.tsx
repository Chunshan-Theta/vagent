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
  // Only use cache in browser environment
  const isBrowser = typeof window !== 'undefined';
  // Generate a cache key based on text and target language
  const cacheKey = `translation_${targetLang}_${encodeURIComponent(text)}`;

  if (isBrowser) {
    // Check cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }
  }

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
    // Cache the result only in browser
    if (isBrowser) {
      localStorage.setItem(cacheKey, result.translatedText);
    }
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
  const [clientLanguage, setClientLanguage] = useState<Language>('zh');

  useEffect(() => {
    const lang = localStorage.getItem('client-language') as Language
    if (lang) {
      setClientLanguage(lang);
    }
  }, [])

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
      const criteria = agentConfig?.criteria


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