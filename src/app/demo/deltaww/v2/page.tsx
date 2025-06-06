'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { TranscriptProvider, useTranscript } from "@/app/contexts/TranscriptContext";
import { ChatProvider, useChat } from "@/app/contexts/ChatContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App, { AppRef } from "@/app/App";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportV1, Timeline } from '@/app/types/ai-report';

import ChatView from "@/app/components/chat/ChatView";

import { startAIMission } from '@/app/lib/ai-mission/missionAnalysis'

import { useAiChat } from "@/app/lib/ai-chat/aiChat";

import AskForm from "@/app/components/AskForm";
import _ from '@/app/vendor/lodash';

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
const roleMap = {
  user: '我',
  assistant: '小陳'
}
function DynamicAnalysisContent() {
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

    getMessagePairs,

    progressTimerRef,

    endConversation,
    getChatHistoryText,
    getChatHistory,


    isLoading,

    onSessionOpen,
    onSessionResume,
    onSessionClose
  } = useAiChat();

  useEffect(() => {
    document.title = '部門溝通情境對話';
  }, []);
  
  const query = useSearchParams();
  const lang = useMemo(() => query.get('lang') || 'zh-TW', [query]);
  const reportUrl = useMemo(() => {
    return `/demo/deltaww/report/v2`;
  }, [])
  const nowPageUrl = useMemo(() => {
    return '/demo/deltaww/v2' + (lang ? `?lang=${lang}` : '');
  }, [lang])

  const [localLoading, setLocalLoading] = useState(false);
  const loading = useMemo(() => {
    return localLoading || isLoading || isAnalyzing;
  }, [localLoading, isLoading, isAnalyzing])
  useEffect(() => {
    console.log('[deltaww] loading', loading);
  }, [loading])

  const errors = useRef<any[]>([])
  const settings = settingsMap.default
  const [pageBackground] = useState("#0F2D38");
  const [chatBackground] = useState("#173944");

  const userInfo = useRef({
    email: '',
  })
  const [scene, setScene] = useState("init");
  const askItems = useRef([
    {
      type: 'text' as const,
      title: '帳號',
      name: 'account',
      defaultValue: '',
    },
    {
      type: 'password' as const,
      title: '密碼',
      name: 'password',
      defaultValue: '',
    },
  ])


  const onSubmitAskForm = (form: any) => {
    const datas = form.datas
    const account = (datas.account || '').trim()
    const password = (datas.password || '').trim()
    if (!account) {
      form.emitError('account', '請填入正確的帳號')
      return
    }
    if (!password) {
      form.emitError('password', '缺少密碼')
      return
    }
    if (password.length > 20) {
      form.emitError('password', '密碼長度過長')
      return
    }
    setLocalLoading(true);
    Promise.resolve()
      .then(() => {
        return fetch('/api/deltaww/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account: account,
            password: password,
          }),
          signal: AbortSignal.timeout(3000)
        })
      })
      .then((res) => {
        return res.json();
      }).then((data) => {
        if (data.error) {
          // 登入失敗，得到錯誤訊息
          alert(data.message);
          return;
        } else {
          // 登入成功
          return onAfterLogin(data.account);
        }
      }).catch(() => {
        alert('登入失敗，請稍後再試');
      }).finally(() => {
        setLocalLoading(false);
      })
  }

  async function onAfterLogin(email: string) {
    await initConv({
      email,
      agentType: 'static',
      agentId: 'deltaww-v2',
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
  function _runAnalyze(opts: Parameters<typeof startAIMission>[0]) {
    const { missionId, params, responseType, modelOptions } = opts

    return startAIMission({
      missionId,
      params,
      responseType,
      modelOptions
    })
      .catch((err) => {
        console.error('Error in analyze:', err)
        errors.current = [...errors.current, err]
        return null
      })
  }

  async function startGenerateAiReport() {
    if (transcriptItems.length === 0) {
      alert("No chat history available to analyze");
      return;
    }
    // const storedChatMessages = localStorage.setItem('analysis_report')
    // const chatHistory = JSON.parse(storedChatMessages || '[]').filter((msg: any) => msg.role !== 'system')

    const { startAt, pairs } = getMessagePairs({
      spRole: 'assistant',
      keepSystemMessage: false,
      keepNextMsgCount: 1,
    })
    // console.log('pairs:', pairs)

    // 初始化 timelineItems
    const timelineItems = pairs.map((item) => {
      const aiMsg = item.messages[0]
      const userMsgs = item.messages.slice(1).filter((msg) => msg.role === 'user')

      const aiRole = roleMap.assistant
      const userRole = roleMap.user
      const aiSay = aiMsg.data.content || ''
      const userSay = userMsgs.map((msg) => msg.data.content).join('\n\n')

      const timeStr = parseTime(item.time - (startAt || 0))

      return {
        mainColor: '#ffd166',
        title: `🕒 ${timeStr}`,
        subtitleColor: '#ffd166', // 後續會覆蓋掉
        subtitle: '小陳情緒：......', // 後續會覆蓋掉
        aiRole: roleMap.assistant,
        userRole,
        aiSay,
        userSay,
        analysis: [],
        keyPoint: {
          sentences: [],
          problems: []
        },
        time: item.time - (startAt || 0)
      } as ReportV1.TimelineData
    }).filter((item) => {
      return item.aiSay && item.userSay
    })
    console.log('timelineItems:', timelineItems)

    if (timelineItems.length < 1) {
      console.error('No timeline items found')
      return
    }

    // 基本檢查都跑完之後再確定提交 endConversation
    endConversation();
    setAnalysisProgress(0);

    for (const item of timelineItems) {
      const { aiSay, userSay } = item

      const analysisRole = roleMap.user
      const chatHistory = [
        `${roleMap.assistant}: ${parseHistoryContent(aiSay)}`,
        `${roleMap.user}: ${userSay}`
      ].join('\n')

      const missions = [
        // 順序不重要，後續會用 missionId 來對應
        'deltaww/sentiment',
        'deltaww/key_points',
        'deltaww/context'
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
      const promises = missions.map((missionId) => {
        return _runAnalyze({
          missionId,
          params: {
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
          errors.current = [...errors.current, err]
          updateProgress()
          return null
        })
      })
      const results = await Promise.all(promises)
      const resMap = _.keyBy(results, 'missionId')
      console.log('resMap:', resMap)

      if (resMap['deltaww/sentiment']) {
        const sentimentRes = resMap['deltaww/sentiment']
        const sentimentType = (sentimentRes.json.sentiment || '').toLowerCase()
        if (sentimentType) {
          item.subtitle = `小陳情緒：${sentimentType}`
          type SentimentColor = keyof typeof settings.sentimentColors
          item.mainColor = settings.sentimentColors[sentimentType as SentimentColor]
        }
      }
      if (resMap['deltaww/key_points']) {
        const keyPointsRes = resMap['deltaww/key_points']
        const keyPoints = keyPointsRes.json.keyPoints
        if (typeof keyPoints === 'object') {
          const { problems, sentences } = keyPoints
          if (Array.isArray(problems)) {
            item.keyPoint!.problems = problems
          }
          if (Array.isArray(sentences)) {
            item.keyPoint!.sentences = sentences
          }
        }
      }
      if (resMap['deltaww/highlights']) {
        const highlightsRes = resMap['deltaww/highlights']
        const highlights = highlightsRes.json.sentences
        if (Array.isArray(highlights)) {
          item.analysis = highlights
        }
      }
      if (resMap['deltaww/context']) {
        const contextRes = resMap['deltaww/context']
        const context = contextRes.json.sentences
        if (Array.isArray(context)) {
          item.analysis = context
        }
      }

    }

    setAnalysisProgress(90);


    const report = {
      timeline: timelineItems
    }

    // const oreport = {
    //   user: userInfo.current,
    //   scores: res.json.scores || [],
    //   history: getFullChatHistory().map((msg) => `${roleMap[msg.role as 'user' | 'assistant']}: ${msg.content}`).join('\n\n'),
    // }

    // Store the analysis result and chat history in localStorage
    localStorage.setItem('deltaww/v2/report', JSON.stringify(report));
    // localStorage.setItem('deltaww/v2/oreport', JSON.stringify(oreport));
    localStorage.setItem('deltaww/v2/messages', JSON.stringify(getFullChatHistory()));

    setAnalysisProgress(100);
    setIsAnalyzing(false);


    router.push(`${reportUrl}?back=${encodeURIComponent(nowPageUrl)}`);
  }

  /** 處理要放在對話紀錄裡面的  */
  function parseHistoryContent(content: string | undefined | null) {
    if (content == null) return ''
    const mContent = (content || '').trim().replace(/\n/g, ' ')
    return `"${mContent}"`
  }

  function getFullChatHistory() {
    const { pairs } = getMessagePairs({
      'spRole': 'assistant',
      'keepSystemMessage': false,
      'keepNextMsgCount': 0,
    })
    const history: Array<{ role: string; content: string; createdAtMs: number }> = []
    for (const pair of pairs) {
      pair.messages.forEach((msg) => {
        history.push({
          role: msg.role,
          content: parseHistoryContent(msg.data.content),
          createdAtMs: msg.createdAtMs
        })
      })
    }
    return history
  }

  function parseTime(time: number) {
    const timeSec = Math.floor(time / 1000)
    const timeMin = Math.floor(timeSec / 60)
    const min = `${timeMin}`
    const sec = `${timeSec % 60}`
    return `${min.padStart(2, '0')}:${sec.padStart(2, '0')}`
  }

  function formScene() {
    const bgStyles = {
      background: 'linear-gradient(135deg, #0F2D38 0%, #1E4A56 100%)',
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
            theme="deltaww"
            loading={loading}
          ></AskForm>
        </div>
      </div>
    )
  }

  function chatScene() {
    return (
      <ChatView
        classNames={['default']}
        background={chatBackground}
        isEnd={isCallEnded}
        isLoading={loading}
        isRecording={isPTTUserSpeaking}
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

      {/* App Component - properly initialized */}
      <div style={{ display: 'none' }}>
        <App
          ref={appRef}
          agentSetKey="chineseAgent"
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
      <DynamicAnalysisContent />
    </Suspense>
  );
} 