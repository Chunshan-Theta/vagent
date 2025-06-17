"use client";

import React, { useRef, useState } from "react";
import { createRealtimeConnection } from "../../lib/realtimeConnection";

// 複製 JSON 到剪貼簿
function copyJsonToClipboard(obj: any) {
  const json = JSON.stringify(obj, null, 2);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(json);
  } else {
    // fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = json;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

export default function RealtimeUsageDemo() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [tokenUsage, setTokenUsage] = useState(0);
  const [rtcInfo, setRtcInfo] = useState<{ sampleRate: number; channels: number } | null>(null);
  const [rtcConnected, setRtcConnected] = useState(false);
  const [serverEvents, setServerEvents] = useState<any[]>([]); // 所有 server 事件
  const [usageEvents, setUsageEvents] = useState<any[]>([]);   // 所有 usage 事件
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 連線到 OpenAI Realtime API (WebRTC)
  const connectRTC = async () => {
    setMessages([]);
    setTokenUsage(0);
    setRtcInfo(null);
    setServerEvents([]);
    setUsageEvents([]);
    // 取得 ephemeral key
    const res = await fetch("/api/session");
    const data = await res.json();
    const ephemeralKey = data.client_secret?.value;
    if (!ephemeralKey) {
      setMessages(["無法取得 ephemeral key"]);
      return;
    }
    try {
      const rtc = await createRealtimeConnection(ephemeralKey, audioRef);
      setRtcInfo(rtc.getInfo());
      setRtcConnected(true);
      setMessages(["WebRTC 已連線 (語音/資料通道)"]);
      // 監聽 DataChannel 訊息
      rtc.dc.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setServerEvents(prev => [...prev, data]);
        const usage = data?.usage ?? data?.response?.usage
        if (usage) {
          setUsageEvents(prev => [...prev, usage]);
        }
        if (usage && usage.total_tokens) {
          setTokenUsage(usage.total_tokens);
        }
        if (data.choices && data.choices[0]?.delta?.content) {
          setMessages((prev) => [...prev, data.choices[0].delta.content]);
        }
      };
      rtc.dc.onclose = () => {
        setRtcConnected(false);
        setMessages((prev) => [...prev, "WebRTC 資料通道已關閉"]);
      };
      rtc.dc.onerror = () => {
        setMessages((prev) => [...prev, "WebRTC 資料通道錯誤"]);
      };
      // 可選：自動播放遠端音訊
      // await rtc.getRS();
    } catch (e) {
      setMessages(["WebRTC 連線失敗: " + (e as Error).message]);
    }
  };

  const sendMessage = () => {
    // WebRTC DataChannel 訊息發送 (需根據實際需求擴充)
    // 這裡僅作為佔位，實際應根據 rtc.dc 實例發送
    setInput("");
  };

  // 統計 usageEvents 的 token 數量，input/output/audio/text/cached 皆分開
  function getTokenStats() {
    const stats: Record<string, number> = {};
    const detailsStats: Record<string, number> = {};
    usageEvents.forEach((usage) => {
      // 一般 usage 統計
      [
        "input_tokens", "output_tokens", "total_tokens",
        "prompt_tokens", "completion_tokens"
      ].forEach((key) => {
        if (typeof usage[key] === "number") {
          stats[key] = (stats[key] || 0) + usage[key];
        }
      });
      // input_token_details
      if (usage.input_token_details) {
        Object.entries(usage.input_token_details).forEach(([key, value]) => {
          if (typeof value === "number") {
            detailsStats[`input_details.${key}`] = (detailsStats[`input_details.${key}`] || 0) + value;
          }
        });
        // input_token_details.cached_tokens_details
        if (usage.input_token_details.cached_tokens_details) {
          Object.entries(usage.input_token_details.cached_tokens_details).forEach(([key, value]) => {
            if (typeof value === "number") {
              detailsStats[`input_details.cached_tokens_details.${key}`] = (detailsStats[`input_details.cached_tokens_details.${key}`] || 0) + value;
            }
          });
        }
      }
      // output_token_details
      if (usage.output_token_details) {
        Object.entries(usage.output_token_details).forEach(([key, value]) => {
          if (typeof value === "number") {
            detailsStats[`output_details.${key}`] = (detailsStats[`output_details.${key}`] || 0) + value;
          }
        });
      }
    });
    return { stats, detailsStats };
  }

  const { stats, detailsStats } = getTokenStats();

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">OpenAI Realtime API Demo</h2>
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded ${rtcConnected ? "bg-gray-400" : "bg-purple-600 text-white"}`}
          onClick={connectRTC}
          disabled={rtcConnected}
        >
          {rtcConnected ? "WebRTC 已連線" : "連線 WebRTC (語音/資料)"}
        </button>
      </div>
      {rtcInfo && (
        <div className="mb-2 text-gray-700 text-sm">WebRTC 音訊資訊：{rtcInfo.sampleRate}Hz / {rtcInfo.channels}ch</div>
      )}
      <audio ref={audioRef} autoPlay className="mb-2 w-full" />
      <div className="my-4">
        <input
          className="border px-2 py-1 rounded w-2/3"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          disabled={!rtcConnected}
          placeholder="輸入訊息..."
        />
        <button
          className="ml-2 px-3 py-1 rounded bg-blue-500 text-white"
          onClick={sendMessage}
          disabled={!rtcConnected || !input.trim()}
        >
          發送
        </button>
      </div>
      <div className="mb-2 text-gray-700">Token 使用量：<span className="font-mono">{tokenUsage}</span></div>
      <div className="bg-gray-100 rounded p-3 h-48 overflow-y-auto text-sm mb-4">
        {messages.map((msg, i) => (
          <div key={i} className="mb-1 whitespace-pre-wrap">{msg}</div>
        ))}
      </div>
      {/* Server 事件區塊 */}
      <div className="mb-4">
        <div className="flex items-center mb-1">
          <h3 className="font-bold text-gray-800 mr-2">所有 Server 事件</h3>
          <button
            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 border ml-auto"
            onClick={() => copyJsonToClipboard(serverEvents)}
            disabled={serverEvents.length === 0}
          >
            複製 JSON
          </button>
        </div>
        <ul className="bg-gray-50 border rounded p-2 h-32 overflow-y-auto text-xs list-decimal pl-5">
          {serverEvents.length === 0 ? (
            <li className="text-gray-400 list-none">尚無事件</li>
          ) : serverEvents.map((ev, i) => (
            <li key={i} className="mb-1 whitespace-pre-wrap break-all">
              <span className="font-mono" contentEditable suppressContentEditableWarning spellCheck={false} style={{ display: "inline-block", minWidth: "100%" }}>
                {JSON.stringify(ev, null, 2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {/* Usage 事件區塊 */}
      <div className="mb-4">
        <div className="flex items-center mb-1">
          <h3 className="font-bold text-gray-800 mr-2">所有 Usage 記錄</h3>
          <button
            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 border ml-auto"
            onClick={() => copyJsonToClipboard(usageEvents)}
            disabled={usageEvents.length === 0}
          >
            複製 JSON
          </button>
        </div>
        <ul className="bg-gray-50 border rounded p-2 h-32 overflow-y-auto text-xs list-decimal pl-5">
          {usageEvents.length === 0 ? (
            <li className="text-gray-400 list-none">尚無 usage</li>
          ) : usageEvents.map((usage, i) => (
            <li key={i} className="mb-1 whitespace-pre-wrap break-all">
              <span className="font-mono">{JSON.stringify(usage, null, 2)}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Usage 統計區塊 */}
      <div className="mb-4">
        <h3 className="font-bold text-gray-800 mb-1">Usage Token 統計</h3>
        <ul className="bg-gray-50 border rounded p-2 text-xs mb-2">
          {Object.keys(stats).length === 0 ? (
            <li className="text-gray-400 list-none">尚無 usage 統計</li>
          ) : (
            Object.entries(stats).map(([key, value]) => (
              <li key={key} className="mb-1"><span className="font-mono">{key}</span>: <span className="font-bold">{value}</span></li>
            ))
          )}
        </ul>
        <h4 className="font-bold text-gray-700 mb-1 mt-2">Usage Details 統計</h4>
        <ul className="bg-gray-50 border rounded p-2 text-xs">
          {Object.keys(detailsStats).length === 0 ? (
            <li className="text-gray-400 list-none">尚無 details 統計</li>
          ) : (
            Object.entries(detailsStats).map(([key, value]) => (
              <li key={key} className="mb-1"><span className="font-mono">{key}</span>: <span className="font-bold">{value}</span></li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
