'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { TranscriptProvider, useTranscript } from "@/app/contexts/TranscriptContext";
import { ChatProvider, useChat } from "@/app/contexts/ChatContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App, { AppRef } from "@/app/class/[id]/App";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportV1 } from '@/app/types/ai-report'
import ChatView from "@/app/components/chat/ChatView";

import { startAIMission } from '@/app/lib/ai-mission/missionAnalysis'
import { AgentConfig, Tool, TranscriptItem } from "@/app/types";

import { agentApi, convApi } from '@/app/lib/ai-chat'
import { useAiChat } from "@/app/lib/ai-chat/aiChat";
import { sttTextValidEx } from "@/app/lib/ai-chat/utils";

import AskForm from "@/app/components/AskForm";
import _ from '@/app/vendor/lodash';

import { delay } from "@/app/lib/utils";
import useAgentSettings from "@/app/hooks/useAgentSettings";
import { getTranslation, Language } from "@/app/i18n/translations";

import * as keyApi from '@/app/lib/ai-chat/keyQuota'

import { requireQuota } from "../utils";
import * as utils from '@/app/class/utils'
import { set } from "lodash";


const vv = 'v1'

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
    setLanguage,

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
    simProgressUp,
    convInfo
  } = useAiChat();

  useEffect(() => {
    document.title = '部門溝通情境對話';
  }, []);

  const query = useSearchParams();
  const lang = useMemo(() => query.get('lang') || 'zh', [query]);
  const reportUrl = useMemo(() => {
    return `/demo/newdean/report/${vv}`;
  }, [])
  const nowPageUrl = useMemo(() => {
    return `/demo/newdean/${vv}` + (lang ? `?lang=${lang}` : '');
  }, [lang])

  const [localLoading, setLocalLoading] = useState(false);
  const loading = useMemo(() => {
    return localLoading || isLoading || isAnalyzing;
  }, [localLoading, isLoading, isAnalyzing])
  useEffect(() => {
    console.log('[newdean] loading', loading);
  }, [loading])

  const errors = useRef<any[]>([])
  const settings = settingsMap.default
  const [pageBackground] = useState("#0F2D38");
  const [chatBackground] = useState("#173944");
  const agentId = '0f532b7d-c763-44fe-92fb-874793e86733'
  const aiReport = useAgentSettings(agentId || '');
  const nowConvId = useMemo(() => {
    return convInfo.current?.convId || '';
  }, [convInfo.current?.convId]);
  const userInfo = useRef({
    email: '',
  })
  const [error, setError] = useState<string | null>(null);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);

  const [clientLanguage, setClientLanguage] = useState<Language>('zh');
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

  const keyInfo = useRef<{ group: string, key: string }>(null)



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

  const fetchAgentConfig = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
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
  // useEffect(() => {


  // }, [agentId, clientLanguage]);


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
        return fetch(`/api/newdean/login?v=${vv}`, {
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
          return onAfterLogin(account);
        }
      }).catch(() => {
        alert('登入失敗，請稍後再試');
      }).finally(() => {
        setLocalLoading(false);
      })
  }

  async function onAfterLogin(email: string) {
    clearHistory();

    await fetchAgentConfig();

    const dd = {
      group: `newdean-${vv}`,
      key: `EM:${email}`,
    }
    keyInfo.current = dd;
    if (requireQuota(dd.group, dd.key)) {
      await keyApi.ensureKeyQuota({
        ...dd,
        quota: 1,
      });
    }

    await initConv({
      email,
      agentType: 'static',
      agentId: `newdean-${vv}`,
    })
    setScene('chat');
  }
  // 等切換到 chat 之後要自動開 mic
  useEffect(() => {
    if (scene === 'chat') {
      handleTalkOn();
    }
  }, [scene])

  const analyzeChatHistoryByRubric = async (criteria: string | undefined, role: string, chatHistory: string, clientLanguage: string) => {
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
        role,
        // context: `對話紀錄中 user 的角色是主管，assistant 扮演部門溝通的角色。請根據對話紀錄來分析主管和部門溝通的情況。`,
        context: `對話紀錄中 user 的角色是主管，而對方是部門內的成員的角色。請根據 user 說的話來分析部門溝通的情況。`,
        rubric: {
          criteria,
          weights,
        },
        detectedLanguage: clientLanguage,
      }),
    });

    return response.json();
  }
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
    if (!canInterrupt) {
      showSystemToast('wait_for_response');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const kq = keyInfo.current!;
    if (requireQuota(kq.group, kq.key)) {
      const quota = await keyApi.getKeyQuota(kq)
      if (!quota || quota.usage >= quota.quota) {
        alert('已達到使用上限，詳情可詢問網站管理員。');
        setIsAnalyzing(false);
        return;
      }
      await keyApi.increaseKeyQuota({
        ...kq,
        usage: 1,
      });
    }

    
    setupAnalysisState(15);
    // 基本檢查都跑完之後再確定提交 endConversation
    await handleTalkOff();
    await delay(700); // 等待幾秒，確保對話結束
    await waitPostTask();
    await delay(700); // 等待幾秒，確保對話結束
    endConversation();
    setAnalysisProgress(30);


    // const config = {
    //   criteria: getAgentConfig().criteria,
    //   roleSelf: 'user',
    //   roleTarget: 'assistant',
    // };

    // const userInputHistory = getChatHistoryText({
    //   items: transcriptItems
    //     .filter(item => item.type === 'MESSAGE')
    //     .filter(item => item.role === 'user')
    //     .filter(item => {
    //       // Skip messages that should be hidden
    //       const content = item.title || '';
    //       return sttTextValidEx(content);
    //     }),
    //   roleMap: {
    //     user: config.roleSelf,
    //     assistant: config.roleTarget,
    //   }
    // })
    // const chatHistory = getChatHistoryText({
    //   roleMap: {
    //     user: config.roleSelf,
    //     assistant: config.roleTarget,
    //   }
    // })
    // setAnalysisProgress(40);
    // await delay(500);

    // const rubricAnalysisP = analyzeChatHistoryByRubric(config.criteria, config.roleSelf, userInputHistory, 'zh')
    // const progress = simProgressUp(40, 100, 30000).start();

    // const rubricAnalysis = await rubricAnalysisP;


    // localStorage.setItem(`newdean/${vv}/analysis`, JSON.stringify(rubricAnalysis));
    // localStorage.setItem(`newdean/${vv}/messages`, JSON.stringify(getFullChatHistory()));

    // progress.complete();

    // router.push(`${reportUrl}?back=${encodeURIComponent(nowPageUrl)}`);
    router.push('/conv-report/' + nowConvId + '?reportName=analysis-v1');
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
        {agentConfig && (
          <App
            ref={appRef as any}
            agentConfig={agentConfig}
            onSessionOpen={onSessionOpen}
            onSessionResume={onSessionResume}
            onSessionClose={onSessionClose}
          />
        )}
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


function getAgentConfig() {
  return {
    criteria: `
評分標準 

G - Goal (目標設定)
品質標準1：是否明確設定需求確認與資訊透明的目標？
品質標準2：是否引導其主動思考跨部門資訊流通的自主目標？

若使用者表達如：

「下次我會在整理需求前，先跟現場確認使用細節。」

「我想設計一個需求確認清單，避免遺漏。」

「要讓資訊部掌握得清楚，我會設定確認會議。」

→ 評為【非常貼切】

若使用者表達如：

「要不然我多找現場聊聊。」

「我會注意，先跟資訊部確認一下就好。」

「下次需求寫清楚一點。」

→ 評為【貼切】

若使用者表達如：

「不就照以前的流程做嗎？」

「資訊部自己會抓細節吧。」

「反正主管都說OK，應該沒問題吧。」

→ 評為【一點點貼切】

R - Reality (現況分析)
品質標準1：是否釐清需求盤點與溝通落差的事實？
品質標準2：是否探索未確認現場狀況的根本原因？

AI 評分判斷依據：

若使用者表達如：

「我當初沒實際跟現場主管確認，直接照舊資料寫的。」

「資訊部問細節時我沒有完整回覆，因為部分流程我也不熟。」

「有些細節其實我沒完全掌握，是後來才發現漏掉的。」

→ 評為【非常貼切】

若使用者表達如：

「資訊部那邊有說一些我沒寫到的功能。」

「有些細節當時沒有講很清楚。」

「可能是我以為流程都差不多，結果現場實際不同。」

→ 評為【貼切】

若使用者表達如：

「現場主管都沒跟我說要加什麼啊。」

「資訊部反應太龜毛了吧。」

「他們應該自己會抓出細節吧。」

→ 評為【一點點貼切】

O - Options (方案選擇)
品質標準1：是否提出多元、完整的補救與確認選項？
品質標準2：是否能考慮跨部門流程設計與資源整合？

AI 評分判斷依據：

若使用者表達如：

「未來先開現場需求確認會議。」

「可以設計需求規格模板，方便資訊部快速掌握。」

「資訊部可以參與需求盤點前期討論，提前對齊。」

「試著建立部門間固定的對齊週會。」

→ 評為【非常貼切】

若使用者表達如：

「以後開會時多問幾次現場主管確認。」

「找資訊部先看看需求內容。」

「做個需求勾稽表來檢查。」

→ 評為【貼切】

若使用者表達如：

「就交主管去處理現場確認吧。」

「我不可能什麼都先去確認。」

「他們要就自己整理好需求再來找我。」

→ 評為【一點點貼切】

W - Will / Way Forward (意願與行動)
品質標準1：是否具體定出執行計畫內容？
品質標準2：是否有明確承諾執行時間、對象與追蹤機制？

AI 評分判斷依據：

若使用者表達如：

「我會在下週前先訪談產線主管確認細節，整理好新版需求清單。」

「預計月底前完成規格模板初稿，資訊部參與確認。」

「安排雙週會議與資訊部同步進度。」

→ 評為【非常貼切】

若使用者表達如：

「我會找時間去確認現場需求。」

「需求這兩週內整理完交資訊部。」

「有問題我會再問資訊部。」

→ 評為【貼切】

若使用者表達如：

「反正他們不問我就不多講了。」

「主管覺得沒事我就不多動了。」

「等資訊部有問題再來說吧。」

→ 評為【一點點貼切】

`.trim()
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
