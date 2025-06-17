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
import _, { get } from 'lodash'
import { startAIMission } from '@/app/lib/ai-mission/missionAnalysis'

import { agentApi, convApi } from '@/app/lib/ai-chat'
import { fetchAllAgentSettings } from '@/app/lib/ai-chat/reportHelper'
import type { TimelineData } from "@/app/types/ai-report/report-v1";

import * as utils from '../utils'

type TimelineItem = TimelineData
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

  const agentId = params.id as string;

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
      // 正常情況下也會執行到這，因此只顯示 warn 作為提醒而不是 error
      console.warn('clientLanguage is not set');
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

  const aiReport = useAiReport(agentId || '');

  const {
    router,
    initConv,
    inputText,
    clearHistory,

    updateInputText,
    sendSimulatedUserMessage,
    handleMicrophoneClick,
    isPTTUserSpeaking,
    canInterrupt,
    transcriptItems,
    setIsAnalyzing,
    setIsCallEnded,

    handleTalkOn,
    handleTalkOff,

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
    getMessagePairs,

    showSystemToast,
    convInfo,
    waitPostTask
  } = useAiChat();


  const loading = useMemo(() => {
    return localLoading || isLoading || isAnalyzing;
  }, [localLoading, isLoading, isAnalyzing]);


  const onSubmitText = () => {
    sendSimulatedUserMessage(inputText, { hide: false, triggerResponse: true });
    updateInputText('');
  }

  const nowConvId = useMemo(() => {
    return convInfo.current?.convId || '';
  }, [convInfo.current?.convId]);


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
    if (!canInterrupt) {
      showSystemToast('wait_for_response');
      return;
    }


    await handleTalkOff();
    await delay(700); // 等待幾秒，確保對話結束
    await waitPostTask();
    await delay(700); // 等待幾秒，確保對話結束
    endConversation();

    await aiReport.waitReady(10000);

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
      setAnalysisProgress(10);
      const config = {
        criteria: aiReport.getSetting('reportAnalyze.criteria') || agentConfig?.criteria || 'user 本身是否是進行良性的溝通',
        context: aiReport.getSetting('reportAnalyze.context') || '以下是一份 user 和 assistant 的對話紀錄。',
        analysis: aiReport.getSetting('reportAnalyze.analysis') || '請判斷 user 的表現，然後給予合適的分析結果',
        roleSelf: aiReport.getSetting('reportAnalyze.roleSelf') || 'user',
        roleTarget: aiReport.getSetting('reportAnalyze.roleTarget') || 'assistant',

        contextPrompt: aiReport.getSetting('reportAnalyze.contextPrompt'),
        keyPointsPrompt: aiReport.getSetting('reportAnalyze.keyPointsPrompt'),

        keyPointAnalysis1: aiReport.getSetting('reportAnalyze.keyPointAnalysis1') || '請分析對話紀錄，並找出 user 的關鍵句',
        keyPointTitle1: aiReport.getSetting('reportAnalyze.keyPointTitle1') || '關鍵句整理',
        keyPointIcon1: aiReport.getSetting('reportAnalyze.keyPointIcon1') || '❌',
        keyPointTitle2: aiReport.getSetting('reportAnalyze.keyPointTitle2') || '問題',
        keyPointAnalysis2: aiReport.getSetting('reportAnalyze.keyPointAnalysis2') || '請分析對話紀錄，並找出 user 的問題或不足之處',
        keyPointIcon2: aiReport.getSetting('reportAnalyze.keyPointIcon2') || '📉',
      }
      const chatHistory = getChatHistoryText({
        roleMap: {
          user: config.roleSelf,
          assistant: config.roleTarget,
        }
      })
      // 註：分析 Rubric 的時候優先使用 agentConfig 中的 criteria，其他的分析反之
      const rubtic_analysis = analyzeChatHistoryByRubric(agentConfig?.criteria || config.criteria, chatHistory, clientLanguage || 'zh').then((analysis) => {
        localStorage.setItem('analyzeChatHistoryByRubric', JSON.stringify(analysis))
      })

      setAnalysisProgress(30);

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
        console.log({
          aiMsg, userMsgs
        })

        const timeStr = parseTime(item.time - (startAt || 0))

        return {
          mainColor: '#ffd166',
          title: `🕒 ${timeStr}`,
          subtitleColor: '#ffd166',
          subtitle: '情緒：......',
          aiAudio: {
            ref: aiMsg.data.audioRef || null,
            // url: null, 後續非同步填入
            startTime: aiMsg.data.audioStartTime || 0
          },
          userAudio: {
            ref: userMsgs[0]?.data?.audioRef || null,
            // url: null, 後續非同步填入
            startTime: userMsgs[0]?.data?.audioStartTime || 0
          },
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

      const history = chatHistory
      /**
       * 針對不同任務給不同參數
       */
      const missionParams: { [missionId: string]: { [x: string]: any } } = {
        'report-v1/sentiment': {
          role2: config.roleTarget,
          history
        },
        'report-v1/key_points': {
          analysis: config.analysis,
          context: config.context,
          criteria: config.criteria,
          role: config.roleSelf,
          role2: config.roleTarget,
          prompt: config.keyPointsPrompt,

          history
        },
        'report-v1/key_points_v2': {
          analysis1: config.keyPointAnalysis1,
          analysis2: config.keyPointAnalysis2,
          title1: config.keyPointTitle1,
          title2: config.keyPointTitle2,
          context: config.context,
          criteria: config.criteria,
          role: config.roleSelf,
          role2: config.roleTarget,
          prompt: config.keyPointsPrompt,

          history
        },
        'report-v1/context': {
          analysis: config.analysis,
          context: config.context,
          criteria: config.criteria,
          role: config.roleSelf,
          prompt: config.contextPrompt,

          history
        },
      }

      for (let index = 0; index < timelineItems.length; index += 1) {
        const item = timelineItems[index]
        const { aiSay, userSay } = item

        const analysisRole = 'user'
        const chatHistory = [
          `${config.roleTarget}: ${parseHistoryContent(aiSay)}`,
          `${config.roleSelf}: ${userSay}`
        ].join('\n')

        const missions = [
          'report-v1/sentiment',
          'report-v1/key_points',
          'report-v1/context'
        ]

        const { userAudio, aiAudio } = item
        if (userAudio && userAudio.ref) {
          userAudio.url = (await convApi.getAudioUrlByRefString(userAudio.ref, { convId: nowConvId, name: 'user_audio' })) || '';
          userAudio.audioInfo = (await convApi.getAudioInfoByRefString(userAudio.ref, { convId: nowConvId, name: 'user_audio' })) || ''
          console.log('audioInfo', userAudio.audioInfo)
        }
        if (aiAudio && aiAudio.ref) {
          aiAudio.url = (await convApi.getAudioUrlByRefString(aiAudio.ref, { convId: nowConvId, name: 'assistant_audio' })) || '';
        }

        const collect = {
          done: 0,
          error: 0,
          get end() { return collect.done + collect.error },
          total: missions.length
        }
        const updateProgress = () => {
          setAnalysisProgress((collect.end / collect.total) * 100 * 0.6) // 0 ~ 60%
        }

        const promises = missions.map((missionId) => {
          if (!missionParams[missionId]) {
            throw new Error(`Mission parameters for ${missionId} are not defined`);
          }
          const mParams = {
            lang: clientLanguage,
            history: chatHistory,
            ...missionParams[missionId],
          }
          return startAIMission({
            missionId,
            params: mParams,
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
        if (resMap['report-v1/key_points_v2']) {
          const keyPointsRes = resMap['report-v1/key_points_v2']
          const keyPoints = keyPointsRes.json.keyPoints
          if (typeof keyPoints === 'object') {
            const { list1, list2 } = keyPoints
            if (Array.isArray(list1)) {
              item.keyPoint!.sentences = list1 as string[]
            }
            if (Array.isArray(list2)) {
              item.keyPoint!.problems = list2 as string[]
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

        // index / timelineItems.length
        setAnalysisProgress(timelineItems.length > 0 ? 60 : 100);
      }

      setAnalysisProgress(90);

      const report = {
        timeline: timelineItems,
        meta: {
          keyPointTitle1: config.keyPointTitle1,
          keyPointIcon1: config.keyPointIcon1,
          keyPointTitle2: config.keyPointTitle2,
          keyPointIcon2: config.keyPointIcon2,
        }
      }

      // Store the analysis result and chat history in localStorage
      localStorage.setItem('report', JSON.stringify(report));
      localStorage.setItem('chatHistory', getChatHistoryText());
      localStorage.setItem('chatMessages', JSON.stringify(getChatHistory()));

      setAnalysisProgress(100);

      // Navigate to report page
      Promise.all([
        rubtic_analysis
      ])
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
      clearHistory();
      await initConv({
        email: userInfo.email,
        uname: userInfo.uname,
        agentType: 'class',
        agentId: agentId
      });
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


/**
 * 用於蒐集 agent_settings
 * @param agentId 
 * @returns 
 */
function useAiReport(agentId: string) {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const settings = useRef<{ [key: string]: string }>({});
  useEffect(() => {
    fetchAndUpdate();
  }, []);

  function fetchAndUpdate() {
    if (loading) return;
    setLoading(true);
    retryOnError(async () => {
      settings.current = {};
      const res = await fetchAllAgentSettings(agentId)
      for (const key in res.values) {
        settings.current[key] = res.values[key];
      }
      setReady(true);
    })
      .finally(() => {
        setLoading(false);
      })
  }

  function retryOnError<T>(fn: () => Promise<T>, retries = 3, delay = 1000) {
    return new Promise<T>((resolve, reject) => {
      const attempt = (n: number) => {
        fn().then(resolve).catch((error) => {
          if (n <= 0) {
            reject(error);
          } else {
            // console.warn(`Retrying... (${retries - n + 1}/${retries})`);
            setTimeout(() => attempt(n - 1), delay);
          }
        });
      };
      attempt(retries);
    });
  }

  function waitReady(timeout = 10000): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let timeoutTimerId: any = null;
      let lastTimeout: any = null;
      const checkReady = () => {
        if (ready) {
          clearTimeout(timeoutTimerId);
          clearTimeout(lastTimeout);
          resolve();
        } else {
          lastTimeout = setTimeout(checkReady, 600);
        }
      };
      timeoutTimerId = setTimeout(() => {
        if (!ready) {
          clearTimeout(timeoutTimerId);
          clearTimeout(lastTimeout);
          reject(new Error('timeout'));
        }
      }, timeout);
      checkReady();
    });
  }

  function getSetting(key: string): string {
    return settings.current[key] || '';
  }

  return {
    ready,
    settings,
    waitReady,
    getSetting
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}