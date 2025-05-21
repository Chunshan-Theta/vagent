'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import App, { AppRef } from "@/app/App";
import { useRouter } from "next/navigation";

import ChatView from "@/app/components/chat/ChatView";
import AskForm from "@/app/components/AskForm";
import { ReportV1, Timeline } from '@/app/types/ai-report';

import _ from '@/app/vendor/lodash';
import { v4 as uuidv4 } from "uuid";

import { useAiChat } from "@/app/lib/ai-chat/aiChat";

import { startAIMission, getAIMissionList } from '@/app/lib/ai-mission/missionAnalysis'
import { handleAnalysisExamples } from '@/app/lib/ai-chat/utils'

import { toast } from 'react-toastify';


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

function LandbankChatPage() {
  const {
    router,

    inputText,
    updateInputText,

    sendSimulatedUserMessage,
    isPTTUserSpeaking,
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

    endConversation,

    getMessagePairs,

    isLoading,

    onSessionOpen,
    onSessionResume,
    onSessionClose
  } = useAiChat();

  const pageInfo = {
    title: '業務陪練劇本',
    reportUrl: '/demo/landbank/report/v2'
  }
  const roleMap = {
    user: '我',
    assistant: 'AI客戶'
  }

  useEffect(() => {
    document.title = pageInfo.title;
  }, []);
  const [localLoading, setLocalLoading] = useState(false);
  const loading = useMemo(() => {
    return localLoading || isLoading || isAnalyzing;
  }, [localLoading, isLoading, isAnalyzing])
  const errors = useRef<any[]>([])
  const settings = settingsMap.default

  useEffect(() => {
    console.log('[deltaww] loading', loading);
  }, [loading])
  // styles start
  const [pageBackground] = useState("linear-gradient(135deg, rgb(26, 42, 52) 0%, rgb(46, 74, 63) 100%)");
  const [chatBackground] = useState("linear-gradient(rgb(46, 74, 63) 0%, rgb(26, 42, 52) 100%)")
  const missions = useRef<any[]>([]);
  const [scene, setScene] = useState("init");
  const askItems = useRef([
    {
      type: 'text' as const,
      title: '請輸入您的名字',
      name: 'name',
      defaultValue: '',
    },
  ])



  const onSubmitAskForm = (form: any) => {
    const datas = form.datas
    console.log('name:', datas.name)
    const name = (datas.name || '').trim()
    if (!name) {
      form.emitError('name', '請務必輸入名字')
      return
    }

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

    const timelineItems = pairs.map((item) => {
      const aiMsg = item.messages[0]
      const userMsgs = item.messages.slice(1)

      const aiRole = roleMap.assistant
      const userRole = roleMap.user
      const aiSay = aiMsg.data.content || ''
      const userSay = userMsgs.map((msg) => msg.data.content).join('\n\n')

      const timeStr = parseTime(item.time - (startAt || 0))

      return {
        mainColor: '#ffd166',
        title: `🕒 ${timeStr}`,
        subtitleColor: '#ffd166',
        subtitle: '客戶情緒：Neutral（中性）',
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

    endConversation();
    setAnalysisProgress(0);

    for (const item of timelineItems) {
      const { aiSay, userSay } = item

      const analysisRole = roleMap.user
      const chatHistory = `${roleMap.assistant}: ${aiSay}\n${roleMap.user}: ${userSay}`

      const missions = [
        // 順序別改
        'landbank/sentiment',
        'landbank/key_points',
        'landbank/highlights'
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

      if (resMap['landbank/sentiment']) {
        const sentimentRes = resMap['landbank/sentiment']
        const sentimentType = (sentimentRes.json.sentiment || '').toLowerCase()
        if (sentimentType) {
          item.subtitle = `客戶情緒：${sentimentType}`
          type SentimentColor = keyof typeof settings.sentimentColors
          item.mainColor = settings.sentimentColors[sentimentType as SentimentColor]
        }
      }
      if (resMap['landbank/key_points']) {
        const keyPointsRes = resMap['landbank/key_points']
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
      if (resMap['landbank/highlights']) {
        const highlightsRes = resMap['landbank/highlights']
        const highlights = highlightsRes.json.sentences
        if (Array.isArray(highlights)) {
          item.analysis = highlights
        }
      }

    }

    setAnalysisProgress(90);
    const res = await _runAnalyze({
      missionId: 'landbank/rubric',
      params: {
        criteria: getCriteria(),
        history: getFullChatHistory(),
      },
      responseType: 'json_schema'
    })

    console.log('landbank/rubric:', res)


    const report = {
      timeline: timelineItems
    }

    const oreport = {
      
      history: getFullChatHistory(),
    }

    // Store the analysis result and chat history in localStorage
    localStorage.setItem('landbank/v2/report', JSON.stringify(report));
    localStorage.setItem('landbank/v2/oreport', JSON.stringify(report));
    localStorage.setItem('landbank/v2/messages', JSON.stringify(getFullChatHistory()));

    setAnalysisProgress(100);
    setIsAnalyzing(false);
  }


  function getFullChatHistory() {
    const { pairs } = getMessagePairs({
      'spRole': 'assistant',
      'keepSystemMessage': false,
      'keepNextMsgCount': 0,
    })
    const history: any[] = []
    for (const pair of pairs) {
      pair.messages.forEach((msg) => {
        history.push({
          role: msg.role,
          content: msg.data.content,
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
          agentSetKey="landbankAgent"
          onSessionOpen={onSessionOpen}
          onSessionResume={onSessionResume}
          onSessionClose={onSessionClose}
        />
      </div>
    </div>
  );
}


function getCriteria() {

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

  return criteria
}

// Use a client-only component to avoid hydration errors
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandbankChatPage />
    </Suspense>
  );
} 