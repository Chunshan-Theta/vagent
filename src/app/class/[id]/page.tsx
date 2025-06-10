'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo, ChangeEvent } from "react";
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
import _ from 'lodash'
import { startAIMission } from '@/app/lib/ai-mission/missionAnalysis'

import * as utils from '../utils'

interface TimelineItem {
  mainColor: string;
  title: string;
  subtitleColor: string;
  subtitle: string;
  aiRole: string;
  userRole: string;
  aiSay: string;
  userSay: string;
  analysis: string[];
  keyPoint: {
    sentences: string[];
    problems: string[];
  };
  time: number;
}

interface UserInfo {
  email: string;
  uname: string;
}

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

async function createAgentConfig(apiResult: any, lang: Language): Promise<AgentConfig> {
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

  instructions = await translateToLanguage(instructions, lang);
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
  const [clientLanguage, setClientLanguage] = useState<Language>();
  const [userInfo, setUserInfo] = useState<UserInfo>({ email: '', uname: '' });
  const [isUserInfoValid, setIsUserInfoValid] = useState(false);

  useEffect(() => {
    const lang = localStorage.getItem('client-language') as Language

    if (lang) {
      setClientLanguage(lang);
      setLanguage(lang);
    } else {
      setClientLanguage('zh');
      setLanguage('zh');
    }
  }, [])

  useEffect(() => {
    if (!clientLanguage) {
      console.error('clientLanguage is not set');
      return;
    }

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


  const {
    router,
    initConv,
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
    setLanguage,
    getMessagePairs
  } = useAiChat();


  const loading = useMemo(() => {
    return localLoading || isLoading || isAnalyzing;
  }, [localLoading, isLoading, isAnalyzing]);


  const onSubmitText = () => {
    sendSimulatedUserMessage(inputText, { hide: false, triggerResponse: true });
    updateInputText('');
  }



const analyzeChatHistoryByRubric = async (criteria: string | undefined, chatHistory: string, clientLanguage: Language) => {
    if (!criteria) {
      criteria = '使用者本身是否是進行良性的溝通';
    }

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

    return response.json();
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

    try {
      setAnalysisProgress(30);
      const chatHistory = getChatHistoryText()
      const analysis = await analyzeChatHistoryByRubric(agentConfig?.criteria, chatHistory, clientLanguage || 'zh')
      localStorage.setItem('analyzeChatHistoryByRubric', JSON.stringify(analysis))
  

      const { startAt, pairs } = getMessagePairs({
        spRole: 'assistant',
        keepSystemMessage: false,
        keepNextMsgCount: 1,
      });

      // Initialize timelineItems
      const timelineItems = pairs.map((item) => {
        const aiMsg = item.messages[0]
        const userMsgs = item.messages.slice(1).filter((msg) => msg.role === 'user')

        const aiRole = 'assistant'
        const userRole = 'user'
        const aiSay = aiMsg.data.content || ''
        const userSay = userMsgs.map((msg) => msg.data.content).join('\n\n')

        const timeStr = parseTime(item.time - (startAt || 0))

        return {
          mainColor: '#ffd166',
          title: `🕒 ${timeStr}`,
          subtitleColor: '#ffd166',
          subtitle: '情緒：......',
          aiRole,
          userRole,
          aiSay,
          userSay,
          analysis: [] as string[],
          keyPoint: {
            sentences: [] as string[],
            problems: [] as string[]
          },
          time: item.time - (startAt || 0)
        } as TimelineItem
      }).filter((item) => {
        return item.aiSay && item.userSay
      });

      if (timelineItems.length < 1) {
        throw new Error('No timeline items found');
      }

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

      for (const item of timelineItems) {
        const { aiSay, userSay } = item

        const analysisRole = 'user'
        const chatHistory = [
          `assistant: ${parseHistoryContent(aiSay)}`,
          `user: ${userSay}`
        ].join('\n')

        const missions = [
          'report-v1/sentiment',
          'report-v1/key_points',
          'report-v1/context'
        ]

        const collect = {
          done: 0,
          error: 0,
          get end() { return collect.done + collect.error },
          total: missions.length
        }
        const updateProgress = () => {
          setAnalysisProgress((collect.end / collect.total) * 100 * 0.6) // 0 ~ 60%
        }

        const gptParams = {
          analysis: `請詳細分析對話紀錄，並根據分析方向和規則給我建議。`,
          context: agentConfig?.criteria || '',
        }

        const promises = missions.map((missionId) => {
          return startAIMission({
            missionId,
            params: {
              lang: clientLanguage,
              ...gptParams,
              role: analysisRole,
              history: chatHistory,
            },
            responseType: 'json_schema'
          }).then((res) => {
            collect.done++
            updateProgress()
            return res
          }).catch((err) => {
            collect.error++
            console.error('Error in analyze:', err)
            updateProgress()
            return null
          })
        })

        const results = await Promise.all(promises)
        const resMap = _.keyBy(results, 'missionId')

        if (resMap['report-v1/sentiment']) {
          const sentimentRes = resMap['report-v1/sentiment']
          const sentimentType = (sentimentRes.json.sentiment || '').toLowerCase()
          if (sentimentType) {
            item.subtitle = `情緒：${sentimentType}`
            type SentimentColor = keyof typeof settingsMap.default.sentimentColors
            item.mainColor = settingsMap.default.sentimentColors[sentimentType as SentimentColor]
          }
        }
        if (resMap['report-v1/key_points']) {
          const keyPointsRes = resMap['report-v1/key_points']
          const keyPoints = keyPointsRes.json.keyPoints
          if (typeof keyPoints === 'object') {
            const { problems, sentences } = keyPoints
            if (Array.isArray(problems)) {
              item.keyPoint!.problems = problems as string[]
            }
            if (Array.isArray(sentences)) {
              item.keyPoint!.sentences = sentences as string[]
            }
          }
        }
        if (resMap['report-v1/context']) {
          const contextRes = resMap['report-v1/context']
          const context = contextRes.json.sentences
          if (Array.isArray(context)) {
            item.analysis = context as string[]
          }
        }
      }

      setAnalysisProgress(90);

      const report = {
        timeline: timelineItems
      }

      // Store the analysis result and chat history in localStorage
      localStorage.setItem('report', JSON.stringify(report));
      localStorage.setItem('chatHistory', getChatHistoryText());
      localStorage.setItem('chatMessages', JSON.stringify(getChatHistory()));

      setAnalysisProgress(100);

      // Navigate to report page
      router.push('/class/report');
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

  function parseTime(time: number) {
    const timeSec = Math.floor(time / 1000)
    const timeMin = Math.floor(timeSec / 60)
    const min = `${timeMin}`
    const sec = `${timeSec % 60}`
    return `${min.padStart(2, '0')}:${sec.padStart(2, '0')}`
  }

  function parseHistoryContent(content: string | undefined | null) {
    if (content == null) return ''
    const mContent = (content || '').trim().replace(/\n/g, ' ')
    return `"${mContent}"`
  }

  const startConversation = async () => {
    if (!userInfo.email || !userInfo.uname || !agentConfig) return;
    setIsUserInfoValid(true);

    try {
      await initConv({
        email: userInfo.email,
        uname: userInfo.uname,
        agentType: 'class',
        agentId: agentConfig.name
      });
      clearTranscript();
      handleTalkOn();
    } catch (err) {
      console.error('Error initializing conversation:', err);
      setError(getTranslation(clientLanguage || 'zh', 'errors.failed_to_load'));
    }
  };

  if (error || !agentConfig) {
    return <div>{error || getTranslation(clientLanguage || 'zh', 'info.try_to_load_agent')}</div>;
  }

  if (!isUserInfoValid) {
    return (
      <div style={{ 
        background: pageBackground,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '2rem',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '400px',
          margin: '1rem'
        }}>
          <h2 style={{ color: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>
            {getTranslation(clientLanguage || 'zh', 'info.please_enter_info')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="email"
              placeholder={getTranslation(clientLanguage || 'zh', 'info.email')}
              value={userInfo.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setUserInfo(prev => ({
                  ...prev,
                  email: e.target.value
                }));
              }}
              style={{
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white'
              }}
            />
            <input
              type="text"
              placeholder={getTranslation(clientLanguage || 'zh', 'info.username')}
              value={userInfo.uname}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setUserInfo(prev => ({
                  ...prev,
                  uname: e.target.value
                }));
              }}
              style={{
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white'
              }}
            />
            <button
              onClick={() => startConversation()}
              disabled={!userInfo.email || !userInfo.uname}
              style={{
                padding: '0.75rem',
                borderRadius: '4px',
                background: '#06D6A0',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                marginTop: '1rem',
                opacity: !userInfo.email || !userInfo.uname ? 0.5 : 1
              }}
            >
              {getTranslation(clientLanguage || 'zh', 'info.start')}
            </button>
          </div>
        </div>
      </div>
    );
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
        currentLanguage={clientLanguage || 'zh'}
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