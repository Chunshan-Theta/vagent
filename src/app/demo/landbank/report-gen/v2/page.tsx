'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo, use } from "react";
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

import srtParser2 from 'srt-parser-2'

import { useChat, type MessageItem } from '@/app/contexts/ChatContext';


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
type SrtData = {
  firstRole: 'user' | 'assistant';
  content: string;
  parsed: { id: string, start: number; end: number; text: string }[];
}

type PageState = {
  pageBackground: string;
  setPageBackground: (bg: string) => void;
  scene: 'init' | 'check' | 'analyze';
  setScene: React.Dispatch<React.SetStateAction<'init' | 'check' | 'analyze'>>;
  srt: React.RefObject<SrtData>;
}


const WaitAnalysis: React.FC<PageState> = (state) => {
  const { messageItems } = useChat()
  const {
    router,
    getMessagePairs,
    setAnalysisProgress,
    setIsAnalyzing,
  } = useAiChat();
  const settings = settingsMap.default

  const [pageMsg, setPageMsg] = useState<string>('正在初始化...');

  const roleMap = {
    user: '我',
    assistant: 'AI客人',
  }

  function parseTime(time: number) {
    const timeSec = Math.floor(time / 1000)
    const timeMin = Math.floor(timeSec / 60)
    const min = `${timeMin}`
    const sec = `${timeSec % 60}`
    return `${min.padStart(2, '0')}:${sec.padStart(2, '0')}`
  }

  useEffect(() => {
    startGenerateAiReport()
      .then(() => {
        setPageMsg('AI 報告生成完成，正在跳轉到報告頁面...');
        return delay(1000)
      })
      .then(() => {
        router.push(`/demo/landbank/report/v2`)
      })
      .catch((err) => {
        console.error('生成失敗:', err)
        toast.error('生成 AI 報告失敗，請檢查錯誤訊息或告知開發人員')

        delay(1500).then(() => {
          state.setScene('check');
        })
      })
  }, [])
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
        return null
      })
  }

  async function startGenerateAiReport() {
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
        subtitle: '客戶情緒：......',
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
    setAnalysisProgress(0);
    for (let i = 0; i < timelineItems.length; i++) {
      const item = timelineItems[i]
      const { aiSay, userSay } = item

      const analysisRole = roleMap.user
      const chatHistory = [
        `${roleMap.assistant}: ${parseHistoryContent(aiSay)}`,
        `${roleMap.user}: ${userSay}`
      ].join('\n')

      const missions = [
        // 順序不重要，後續會用 missionId 來對應
        'landbank/sentiment',
        'landbank/key_points',
        // landbank/context 和 highlights 會有重疊，只能選一個
        // 'landbank/highlights',
        'landbank/context'
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

      setPageMsg(`正在分析第 ${i} 組的對話... (${collect.end}/${collect.total})`);

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
          type SentimentColor = keyof typeof settings.sentimentColors
          const colorKey = sentimentType as SentimentColor
          item.subtitle = `客戶情緒：${sentimentType}`
          item.mainColor = settings.sentimentColors[colorKey]
          item.subtitleColor = settings.sentimentColors[colorKey]
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
      if (resMap['landbank/context']) {
        const contextRes = resMap['landbank/context']
        const context = contextRes.json.sentences
        if (Array.isArray(context)) {
          item.analysis = context
        }
      }

    }

    setAnalysisProgress(90);
    const res = await _runAnalyze({
      missionId: 'landbank/rubric',
      params: {
        criteria: getCriteria(),
        history: getFullChatHistory().map((msg) => `${msg.role}: ${msg.content}`).join('\n'),
      },
      responseType: 'json_schema'
    })

    console.log('landbank/rubric:', res)


    const report = {
      timeline: timelineItems
    }

    const oreport = {
      user: { name: 'SRT Chat' },
      scores: res.json.scores || [],
      history: getFullChatHistory().map((msg) => `${roleMap[msg.role as 'user' | 'assistant']}: ${msg.content}`).join('\n\n'),
    }

    // Store the analysis result and chat history in localStorage
    localStorage.setItem('landbank/v2/report', JSON.stringify(report));
    localStorage.setItem('landbank/v2/oreport', JSON.stringify(oreport));
    localStorage.setItem('landbank/v2/messages', JSON.stringify(getFullChatHistory()));

    setAnalysisProgress(100);
    setIsAnalyzing(false);

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


  return (
    <div style={{ color: 'white' }}>
      <div>
        Loading...
      </div>
      <div>
        {pageMsg}
      </div>
    </div>
  );
}

/**
 * 頁面，檢查轉換後的結果是否正確以及提供修改的 UI
 */
const CheckForm: React.FC<PageState> = (state) => {
  const now = Date.now();
  const initMessages = useMemo(() => {
    const firstRole = state.srt.current.firstRole
    const roles = [firstRole, firstRole === 'user' ? 'assistant' : 'user']
    return state.srt.current.parsed.map((msg, i) => {
      return {
        id: msg.id || uuidv4(),
        role: roles[i % 2],
        content: msg.text,
        createdAtMs: msg.start * 1000 + now
      }
    })
  }, [state.srt.current.parsed])
  const chatContext = useChat();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<typeof initMessages>([]);
  const [aiPrompt, setAiPrompt] = useState<string>(autoDetectPrompt());

  useEffect(() => {
    setMessages(initMessages);
  }, [initMessages]);

  function submitMessages() {
    if (messages.length === 0) {
      toast.error('沒有訊息可以提交');
      return;
    }
    if (loading) {
      toast.info('請稍候，正在處理中...');
      return;
    }

    setLoading(true);
    chatContext.setMessages(messages.map((msg) => {
      return {
        type: 'text',
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        createdAtMs: msg.createdAtMs,
        data: {
          content: msg.content
        }
      }
    }));

    // 模擬提交過程
    setTimeout(() => {
      setLoading(false);
      state.setScene('analyze');
      toast.success('訊息已提交，開始分析！');
    }, 1000);
  }

  /** 自動偵測 SRT 的對話中，那些對話是 A 哪些對話是 B */
  function aiDetectRole() {
    if (messages.length === 0) {
      toast.error('沒有訊息可以分析');
      return;
    }
    if (loading) {
      toast.info('正在分析中，請稍候...');
      return;
    }

    setLoading(true);
    _aiDetectRole().finally(() => {
      setLoading(false);
    });
  }

  async function _aiDetectRole() {
    const res = await startAIMission({
      missionId: 'srt/chat_role_detect',
      params: {
        contextDescription: autoDetectPrompt(),
        content: state.srt.current.content,
      },
      modelOptions: {
        max_tokens: 5000,
      },
      responseType: 'json_schema'

    })

    console.log('AI 分析結果:', res);

    if (!Array.isArray(res.json?.messages)) {
      toast.error('AI 回應格式有誤，請重新嘗試');
      return;
    }

    const msgs = res.json.messages

    setMessages(prevMessages => {
      const newArr = [...prevMessages];

      for (let i = 0; i < msgs.length; i++) {
        const msg = msgs[i];
        if (msg.role !== 'user' && msg.role !== 'assistant') {
          continue;
        }
        const foundIndex = newArr.findIndex((m, index) => m.id === msg.id)
        if (foundIndex >= 0) {
          // 如果已經有這個訊息，更新它的角色
          newArr[foundIndex] = {
            ...newArr[foundIndex],
            role: msg.role,
          }
        }

      }

      return newArr
    })

    return res
  }

  function btnChangeRole(index: number) {
    setMessages(prevMessages => {
      const newMessages = [...prevMessages];
      const currentRole = newMessages[index].role;
      newMessages[index] = {
        ...newMessages[index],
        role: currentRole === 'user' ? 'assistant' : 'user'
      }
      return newMessages;
    });
  }

  function btnMessageMerge() {
    setMessages(prevMessages => {
      const newMessages: typeof prevMessages = [];
      let currentRole: 'user' | 'assistant' | null = null;
      for (const msg of prevMessages) {
        if (newMessages.length === 0) {
          // 如果是第一個訊息，直接加入
          currentRole = msg.role as any;
          newMessages.push({ ...msg });
          continue;
        }

        if (msg.role === currentRole) {
          // 如果角色相同，則合併內容
          newMessages[newMessages.length - 1].content += '\n' + msg.content;
        } else {
          currentRole = msg.role as any;
          newMessages.push({ ...msg });
        }
      }
      return newMessages
    })
  }

  function btnChangeRoleBelow(index: number) {
    setMessages(prevMessages => {
      return prevMessages.map((msg, i) => {
        return {
          ...msg,
          role: i > index ? (msg.role === 'user' ? 'assistant' : 'user') : msg.role
        }
      });
    });
  }

  function btnDeleteMessage(index: number) {
    setMessages(prevMessages => {
      const newMessages = [...prevMessages];
      newMessages.splice(index, 1);
      return newMessages;
    });
  }

  function btnAddMessage(index: number, role: 'user' | 'assistant') {
    setMessages(prevMessages => {
      const newMessages = [...prevMessages];
      // 抓前一則訊息
      const prev = newMessages[index - 1];
      const next = newMessages[index];
      // 時間用前後訊息的中間
      const time = prev ? (prev.createdAtMs + (next ? next.createdAtMs : Date.now())) / 2 : Date.now();

      const newMessage = {
        id: uuidv4(),
        role,
        content: '',
        createdAtMs: time
      };
      // 在指定 index 前插入新訊息
      newMessages.splice(index, 0, newMessage);
      return newMessages;
    })
  }

  type BtnUpdateMessageOpts = {
    id?: string;
    role?: 'user' | 'assistant';
    content?: string;
    createdAtMs?: number;
  }
  function btnUpdateMessage(index: number, opts: BtnUpdateMessageOpts) {
    // 修改 index 的訊息
    setMessages(prevMessages => {
      const newMessages = [...prevMessages];
      const currentMessage = newMessages[index];
      if (!currentMessage) return newMessages;

      // 這裡可以根據實際需要修改訊息內容
      const updatedMessage = {
        id: opts.id ?? currentMessage.id,
        role: opts.role as 'user' | 'assistant' ?? currentMessage.role,
        content: opts.content ?? currentMessage.content,
        createdAtMs: opts.createdAtMs ?? currentMessage.createdAtMs
      };

      // 更新訊息
      newMessages[index] = updatedMessage;
      return newMessages;
    });
  }
  /** 放個輸入框，拿來放 AI 分析的 prompt 輸入框 */
  function autoDetechUI() {
    return (
      <>
        <div>
          <form
            onSubmit={e => {
              e.preventDefault();
              aiDetectRole();
            }}
            style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}
          >
            <textarea
              placeholder="請輸入 AI 分析提示詞"
              readOnly={loading}
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              style={{
                flex: 1,
                minHeight: 100,
                padding: 8,
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 15,
                resize: 'vertical',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                borderRadius: 4,
                border: 'none',
                background: '#1976d2',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
              disabled={loading}
            >
              {loading ? '分析中...' : 'AI自動判斷角色'}
            </button>
          </form>
        </div>
      </>

    )
  }

  function messageUI() {
    return <>

      {messages.length === 0 && (
        <div style={{ color: '#888', marginBottom: 16 }}>目前沒有訊息</div>
      )}
      {messages.map((msg, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <button
            type="button"
            style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #ccc', background: msg.role === 'user' ? '#e0f7fa' : '#ffe0b2', color: '#333', fontWeight: 500, cursor: 'pointer' }}
            onClick={() => btnChangeRole(i)}
            title="切換角色"
          >
            {msg.role === 'user' ? '👤 user' : '🤖 assistant'}
          </button>
          <textarea
            value={msg.content}
            onChange={e => {
              const value = e.target.value;
              setMessages(prev => {
                const arr = [...prev];
                arr[i] = { ...arr[i], content: value };
                return arr;
              });
            }}
            style={{ flex: 1, padding: 6, border: '1px solid #ccc', borderRadius: 4, fontSize: 15 }}
            placeholder="訊息內容..."
          />
          <button
            type="button"
            style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#f8bbd0', color: '#b71c1c', fontWeight: 500, cursor: 'pointer' }}
            onClick={() => btnDeleteMessage(i)}
            title="刪除訊息"
          >
            刪除
          </button>
          <button
            type="button"
            style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#c8e6c9', color: '#388e3c', fontWeight: 500, cursor: 'pointer' }}
            onClick={() => btnAddMessage(i, msg.role === 'user' ? 'assistant' : 'user')}
            title="在這則上方插入新訊息"
          >
            ＋
          </button>
          <button
            type="button"
            style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#bbdefb', color: '#1565c0', fontWeight: 500, cursor: 'pointer' }}
            onClick={() => btnChangeRoleBelow(i)}
            title="以下Role相反"
          >
            以下Role相反
          </button>
        </div>
      ))}
    </>
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px #0001', padding: 24 }}>
      <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 24 }}>訊息編輯器</h2>
      <div>
        {loading ? 'Loading...' : ''}
      </div>
      {messages.length > 0 && (
        autoDetechUI()
      )}
      {messageUI()}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          style={{ padding: '8px 24px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginLeft: 12 }}
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            btnMessageMerge();
          }}
        >
          多訊息合併
        </button>
        <button
          type="button"
          style={{ padding: '8px 24px', borderRadius: 6, border: 'none', background: '#388e3c', color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginLeft: 12 }}
          onClick={() => submitMessages()}
        >
          提交 - 開始分析
        </button>
      </div>
    </div>

  )

}

/**
 * 等待輸入 SRT 內容的表單
 */
const StartForm: React.FC<PageState> = (state) => {

  const labelStyle = {
    display: 'block',
    fontWeight: 500,
    fontSize: 15,
    color: '#ccc',
    marginBottom: 6,
    letterSpacing: 0.5,
  }
  const inputStyle = {
    boxSizing: 'border-box' as const,
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '8px',
    fontSize: 16,
    background: '#fff',
    color: '#222',
    outline: 'none',
    transition: 'border 0.2s',
  }

  useEffect(() => {
    // 嘗試從 localStorage 讀取暫存的 SRT 內容
    const tmpSrt = localStorage.getItem('tmp');
    if (tmpSrt) {
      (document.getElementById('srtContent') as HTMLTextAreaElement).value = tmpSrt;
    }
  }, [])

  function formValidation() {
    const firstRole = (document.getElementById('firstRole') as HTMLSelectElement).value as SrtData['firstRole'];
    const srtContent = (document.getElementById('srtContent') as HTMLTextAreaElement).value.trim();

    if (!srtContent) {
      alert('請輸入 SRT 內容');
      return;
    }

    localStorage.setItem('tmp', srtContent);

    // 解析 SRT 內容
    const parser = new srtParser2();
    try {
      const parsedSrt = parser.fromSrt(srtContent);
      console.log('Parsed SRT:', parsedSrt);
      if (parsedSrt.length === 0) {
        throw new Error('SRT 內容解析失敗，請檢查格式是否正確。');
      }
      state.srt.current = {
        firstRole,
        content: srtContent,
        parsed: parsedSrt.map(item => ({
          id: item.id,
          start: item.startSeconds,
          end: item.endSeconds,
          text: item.text
        }))
      };
      state.setScene('check');
    } catch (error) {
      console.error('SRT parsing error:', error);
      alert('無法解析 SRT 內容，請檢查格式是否正確。');
    }
  }


  return (
    <form style={{ maxWidth: 600, width: '100%', padding: 24 }}>
      <label htmlFor="firstRole" style={labelStyle}>第一個說話的人的角色是?</label>
      <div style={{ marginBottom: 16 }}>
        <select id="firstRole" style={{ ...inputStyle, width: '100%' }}>
          <option value="assistant">assistant</option>
          <option value="user">user</option>
        </select>
      </div>
      <label htmlFor="srtContent" style={labelStyle}>SRT 內容</label>
      <div style={{ marginBottom: 16 }}>
        <textarea
          id="srtContent"
          placeholder="請輸入內容..."
          style={{ ...inputStyle, width: '100%', minHeight: '400px', resize: 'vertical' as const }}
        />
      </div>
      <div style={{ textAlign: 'right' }}>
        <button
          type="button"
          style={{
            padding: '8px 24px',
            fontSize: 16,
            borderRadius: 6,
            border: 'none',
            background: '#06D6A0',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
          onClick={formValidation}
        >
          送出
        </button>
      </div>
      {/* 這裡可加上送出按鈕或其他表單元件 */}
    </form>
  );
}

function autoDetectPrompt() {
  return [
    '在SRT中，出現的角色有兩個。',
    '分別是 業務員 和 客戶。',
    '業務員正在跟客戶討論保險產品。',
    '請幫我把 業務員標記為 user，客戶標記為 assistant。',
  ].join('\n');
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

function ReportGenPage() {

  const [scene, setScene] = useState<PageState['scene']>('init');
  const [pageBackground, setPageBackground] = useState("linear-gradient(135deg, rgb(26, 42, 52) 0%, rgb(46, 74, 63) 100%)");
  const srt = useRef({
    firstRole: 'user' as SrtData['firstRole'],
    content: '',
    parsed: [] as SrtData['parsed']
  });

  useEffect(() => {
    document.title = 'SRT 轉換器 - 報告生成';
  }, [])

  const pageState: PageState = {
    scene,
    setScene,
    srt,
    pageBackground,
    setPageBackground,
  }


  return (
    <div style={{ background: pageBackground, minHeight: '100dvh', padding: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {scene === 'init' ?
        <StartForm {...pageState} />
        :
        scene === 'check' ?
          <CheckForm {...pageState} />
          :
          scene === 'analyze' ?
            <WaitAnalysis {...pageState} />
            :
            // 預設用空白
            <div>設定錯誤...</div>
      }
    </div>
  )

}
// Use a client-only component to avoid hydration errors
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>

      <ReportGenPage />
    </Suspense>
  );
}