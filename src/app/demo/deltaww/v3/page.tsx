'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { TranscriptProvider, useTranscript } from "@/app/contexts/TranscriptContext";
import { ChatProvider, useChat } from "@/app/contexts/ChatContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App, { AppRef } from "@/app/App";
import { useRouter, useSearchParams } from "next/navigation";
import ChatView from "@/app/components/chat/ChatView";

import { startAIMission } from '@/app/lib/ai-mission/missionAnalysis'

import { agentApi, convApi } from '@/app/lib/ai-chat'
import { useAiChat } from "@/app/lib/ai-chat/aiChat";

import AskForm from "@/app/components/AskForm";
import _ from '@/app/vendor/lodash';

import { delay } from "@/app/lib/utils";

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
    clearHistory,

    inputText,
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

    getMessagePairs,

    progressTimerRef,

    setupAnalysisState,
    endConversation,
    getChatHistoryText,
    getChatHistory,


    isLoading,

    onSessionOpen,
    onSessionResume,
    onSessionClose,
    waitPostTask,

    showSystemToast,
    convInfo
  } = useAiChat();

  useEffect(() => {
    document.title = '部門溝通情境對話';
  }, []);

  const query = useSearchParams();
  const lang = useMemo(() => query.get('lang') || 'zh', [query]);
  const reportUrl = useMemo(() => {
    return `/demo/deltaww/report/v3`;
  }, [])
  const nowPageUrl = useMemo(() => {
    return '/demo/deltaww/v3' + (lang ? `?lang=${lang}` : '');
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

  const nowConvId = useMemo(() => {
    return convInfo.current?.convId || '';
  }, [convInfo.current?.convId]);
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
        return fetch('/api/deltaww/login?v=v1', {
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
    clearHistory();
    await initConv({
      email,
      agentType: 'static',
      agentId: 'deltaww-v3',
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


  async function analyzeChatHistoryByRubric(criteria: string | undefined, chatHistory: string, clientLanguage: string) {
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


  async function startGenerateAiReport() {
    if (transcriptItems.length === 0) {
      alert("No chat history available to analyze");
      return;
    }
    if (!canInterrupt) {
      showSystemToast('wait_for_response');
      return;
    }
    // const storedChatMessages = localStorage.setItem('analysis_report')
    // const chatHistory = JSON.parse(storedChatMessages || '[]').filter((msg: any) => msg.role !== 'system')


    setupAnalysisState(0);
    // 基本檢查都跑完之後再確定提交 endConversation
    await handleTalkOff();
    await delay(700); // 等待幾秒，確保對話結束
    await waitPostTask();
    await delay(700); // 等待幾秒，確保對話結束
    endConversation();
    setAnalysisProgress(0);


    const config = {
      criteria: [
        '1. G（Goal）目標設定 -評分目的：引導部屬描述希望達成的具體成果樣貌，避免籠統空泛。 運用開放式提問，以部屬為中心，引導其自主探索並表達自己真正想達成的目標。 -評分標準1： > 目標具體清晰 (Goal Specificity & Clarity)：引導部屬描述希望達成的具體成果樣貌，避免籠統空泛。 非常貼切： 目標描述非常具體，成果樣貌清晰可想像，且可驗證。 貼切： 目標大致具體，但部分描述仍有些模糊或不易驗證。 一點貼切： 目標描述籠統、空泛、不切實際。 -評分標準2： > 引導自主目標設定 (Guiding Self-Set Goals) ：運用開放式提問，以部屬為中心，引導其自主探索並表達自己真正想達成的目標。 非常貼切： 透過有效的開放式提問，成功引導部屬清晰表達出內心認同、自主設定的目標。 貼切： 嘗試使用開放式提問，部屬表達了目標，但自主性或清晰度稍弱，或受到主管較多暗示。 一點貼切： 主要由主管給定目標、使用封閉式提問，或未能引導部屬表達其真實想法。',
        '2. R（Reality）現況分析 -評分目的： 引導部屬釐清當前的具體狀況、已知資訊、已嘗試方法，並適時補充主管的客觀觀察/數據。協助部屬盤點目前遇到的困難、干擾因素，並探索可能的盲點或未被注意的面向。 -評分標準1： > 現況釐清與事實盤點 (Situation Clarification & Fact Inventory)： 引導部屬釐清當前的具體狀況、已知資訊、已嘗試方法，並適時補充主管的客觀觀察/數據。 非常貼切： 部屬充分陳述事實，主管有效補充關鍵資訊，雙方對客觀現況有清晰共識。 貼切： 部屬陳述了部分事實，主管有補充，但對整體狀況的掌握不夠全面。 一點貼切： 陳述不清、避重就輕，或參雜過多主觀臆測，未能釐清客觀事實。 -評分標準2： > 挑戰探索與盲點覺察 (Challenge Exploration & Blind Spot Awareness)：協助部屬盤點目前遇到的困難、干擾因素，並探索可能的盲點或未被注意的面向。 非常貼切：深入探討了核心困難與干擾因素，並成功引導部屬覺察到至少一個先前未意識到的盲點。 貼切：討論了表面困難，但對根本原因或潛在盲點的探索不夠深入。 一點貼切：未能有效引導部屬面對困難，或完全忽略了對盲點的探索。',
        '3. O（Options）方案選擇 -評分目的： 鼓勵部屬主動發想出多種不同的可行行動方案，避免陷入單一思維。 引導部屬思考選項時能連結相關經驗、資源（他人建議、外部資源等），並適時融入主管經驗共同探討。 -評分標準1： > 選項發想的廣度 (Breadth of Option Generation)： 鼓勵部屬主動發想出多種不同的可行行動方案，避免陷入單一思維。 非常貼切： 引導部屬主動提出 2個或以上 來自不同角度或思路的選項。 貼切：引導部屬提出 至少1個 選項，或選項同質性高、不夠多元。 一點貼切：未引導部屬思考，直接給答案，或只停留在單一、顯而易見的選項。 -評分標準2： > 選項探索的深度與資源連結 (Depth of Option Exploration & Resource Linking)：引導部屬思考選項時能連結相關經驗、資源（他人建議、外部資源等），並適時融入主管經驗共同探討。 非常貼切：能引導部屬從多元角度（經驗/資源/他人）思考，並結合主管經驗深入探討選項的可行性。 貼切：有嘗試引導從不同角度思考，但連結不夠深入，或主管經驗分享變成單向指導。 一點貼切： 選項思考侷限於部屬自身經驗，未引導連結其他資源或經驗。',
        '4. W（Will/ Way Forward）意願與行動 -評分目的： 引導部屬制定具體、可執行的下一步行動，包含「何時做」、「做什麼」。 確認部屬對行動計畫的執行承諾度，並建立清晰的追蹤方式。 -評分標準1： >  行動計畫的清晰度 (Clarity of Action Plan)：引導部屬制定具體、可執行的下一步行動，包含「何時做」、「做什麼」。 非常貼切：行動計畫非常具體（含人/事/時），步驟清晰、可操作性強。 貼切：行動計畫大致可行，但部分步驟或時間點不夠明確。 一點貼切：行動計畫模糊不清、缺乏具體步驟或時間規劃。 -評分標準2： > 執行承諾與追蹤 (Commitment & Follow-up)：確認部屬對行動計畫的執行承諾度，並建立清晰的追蹤方式。 非常貼切：部屬明確表達高承諾度（例如：意願分數高、語氣肯定），並共同約定具體的追蹤時間與方式。 貼切： 部屬口頭承諾，但意願感受不明顯或有猶豫，追蹤方式不夠具體。 一點貼切： 部屬意願低落或迴避承諾，未建立追蹤機制。'
      ].join('\n'),
      context: '我的角色是小陳的主管，在對話中我希望能夠幫助小陳釐清目標、現況、選項和行動計畫，並給予他適當的建議和支持。',
      analysis: '請詳細分析對話紀錄，並根據分析方向和規則給我建議。',
      roleSelf: 'user',
      roleTarget: 'assistant',
    }

    
    const analysis = await analyzeChatHistoryByRubric(
      config.criteria,
      getChatHistoryText(),
      lang
    )

    localStorage.setItem('deltaww/v3/analysis', JSON.stringify(analysis));
    localStorage.setItem('deltaww/v3/messages', JSON.stringify(getChatHistory()));

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