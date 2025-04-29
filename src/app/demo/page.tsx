'use client';

import React, { Suspense, useState, useEffect, useRef } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App, { AppRef } from "../App";
import { useRouter } from "next/navigation";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { FaMicrophone, FaPhone, FaVolumeUp, FaHashtag, FaSpinner, FaUser } from 'react-icons/fa';
import { AppProvider } from "@/app/contexts/AppContext";

function DemoContent() {
  const router = useRouter();
  const { transcriptItems } = useTranscript();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [isLogVisible, setIsLogVisible] = useState(false);
  const [isPersonInfoVisible, setIsPersonInfoVisible] = useState(false);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appRef = useRef<AppRef>(null);

  useEffect(() => {
    if (isCallStarted && !isCallEnded) {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isCallStarted, isCallEnded]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnalyzeChatHistory = async () => {
    if (transcriptItems.length === 0) {
      alert("No chat history available to analyze");
      return;
    }

    setIsAnalyzing(true);
    setIsCallEnded(true);
    setAnalysisProgress(10);

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

    // Stop the realtime connection and audio
    if (appRef.current) {
      appRef.current.disconnectFromRealtime();
    }

    const chatHistory = transcriptItems
      .filter(item => item.type === 'MESSAGE')
      .map(item => `${item.role}: ${item.title}`)
      .join('\n\n');

    try {
      setAnalysisProgress(30);

      // Perform analysis here before redirecting
      const criteria = [
        '1. G（Goal）目標設定 -評分目的：引導部屬描述希望達成的具體成果樣貌，避免籠統空泛。 運用開放式提問，以部屬為中心，引導其自主探索並表達自己真正想達成的目標。 -評分標準1： > 目標具體清晰 (Goal Specificity & Clarity)：引導部屬描述希望達成的具體成果樣貌，避免籠統空泛。 非常貼切： 目標描述非常具體，成果樣貌清晰可想像，且可驗證。 貼切： 目標大致具體，但部分描述仍有些模糊或不易驗證。 一點貼切： 目標描述籠統、空泛、不切實際。 -評分標準2： > 引導自主目標設定 (Guiding Self-Set Goals) ：運用開放式提問，以部屬為中心，引導其自主探索並表達自己真正想達成的目標。 非常貼切： 透過有效的開放式提問，成功引導部屬清晰表達出內心認同、自主設定的目標。 貼切： 嘗試使用開放式提問，部屬表達了目標，但自主性或清晰度稍弱，或受到主管較多暗示。 一點貼切： 主要由主管給定目標、使用封閉式提問，或未能引導部屬表達其真實想法。',
        '2. R（Reality）現況分析 -評分目的： 引導部屬釐清當前的具體狀況、已知資訊、已嘗試方法，並適時補充主管的客觀觀察/數據。協助部屬盤點目前遇到的困難、干擾因素，並探索可能的盲點或未被注意的面向。 -評分標準1： > 現況釐清與事實盤點 (Situation Clarification & Fact Inventory)： 引導部屬釐清當前的具體狀況、已知資訊、已嘗試方法，並適時補充主管的客觀觀察/數據。 非常貼切： 部屬充分陳述事實，主管有效補充關鍵資訊，雙方對客觀現況有清晰共識。 貼切： 部屬陳述了部分事實，主管有補充，但對整體狀況的掌握不夠全面。 一點貼切： 陳述不清、避重就輕，或參雜過多主觀臆測，未能釐清客觀事實。 -評分標準2： > 挑戰探索與盲點覺察 (Challenge Exploration & Blind Spot Awareness)：協助部屬盤點目前遇到的困難、干擾因素，並探索可能的盲點或未被注意的面向。 非常貼切：深入探討了核心困難與干擾因素，並成功引導部屬覺察到至少一個先前未意識到的盲點。 貼切：討論了表面困難，但對根本原因或潛在盲點的探索不夠深入。 一點貼切：未能有效引導部屬面對困難，或完全忽略了對盲點的探索。',
        '3. O（Options）方案選擇 -評分目的： 鼓勵部屬主動發想出多種不同的可行行動方案，避免陷入單一思維。 引導部屬思考選項時能連結相關經驗、資源（他人建議、外部資源等），並適時融入主管經驗共同探討。 -評分標準1： > 選項發想的廣度 (Breadth of Option Generation)： 鼓勵部屬主動發想出多種不同的可行行動方案，避免陷入單一思維。 非常貼切： 引導部屬主動提出 2個或以上 來自不同角度或思路的選項。 貼切：引導部屬提出 至少1個 選項，或選項同質性高、不夠多元。 一點貼切：未引導部屬思考，直接給答案，或只停留在單一、顯而易見的選項。 -評分標準2： > 選項探索的深度與資源連結 (Depth of Option Exploration & Resource Linking)：引導部屬思考選項時能連結相關經驗、資源（他人建議、外部資源等），並適時融入主管經驗共同探討。 非常貼切：能引導部屬從多元角度（經驗/資源/他人）思考，並結合主管經驗深入探討選項的可行性。 貼切：有嘗試引導從不同角度思考，但連結不夠深入，或主管經驗分享變成單向指導。 一點貼切： 選項思考侷限於部屬自身經驗，未引導連結其他資源或經驗。',
        '4. W（Will/ Way Forward）意願與行動 -評分目的： 引導部屬制定具體、可執行的下一步行動，包含「何時做」、「做什麼」。 確認部屬對行動計畫的執行承諾度，並建立清晰的追蹤方式。 -評分標準1： >  行動計畫的清晰度 (Clarity of Action Plan)：引導部屬制定具體、可執行的下一步行動，包含「何時做」、「做什麼」。 非常貼切：行動計畫非常具體（含人/事/時），步驟清晰、可操作性強。 貼切：行動計畫大致可行，但部分步驟或時間點不夠明確。 一點貼切：行動計畫模糊不清、缺乏具體步驟或時間規劃。 -評分標準2： > 執行承諾與追蹤 (Commitment & Follow-up)：確認部屬對行動計畫的執行承諾度，並建立清晰的追蹤方式。 非常貼切：部屬明確表達高承諾度（例如：意願分數高、語氣肯定），並共同約定具體的追蹤時間與方式。 貼切： 部屬口頭承諾，但意願感受不明顯或有猶豫，追蹤方式不夠具體。 一點貼切： 部屬意願低落或迴避承諾，未建立追蹤機制。'
      ];

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

      setAnalysisProgress(100);

      // Redirect to the analysis report page
      const back = encodeURIComponent('/demo');
      router.push(`/demo/analysis-report?back=${back}`);
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

  const handleStartCall = async () => {
    if (isCallStarted) {
      // If call is already started, stop it
      setIsCallStarted(false);
      setIsCallEnded(true);
      if (appRef.current) {
        appRef.current.disconnectFromRealtime();
      }
    } else {
      // Start a new call
      setIsCallStarted(true);
      setIsCallEnded(false);
      setCallDuration(0); // Reset call duration
      // Start the call session
      if (appRef.current) {
        await appRef.current.connectToRealtime();
      }
    }
  };

  const handleToggleLog = () => {
    setIsLogVisible(!isLogVisible);
  };

  const handleTogglePersonInfo = () => {
    setIsPersonInfoVisible(!isPersonInfoVisible);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Call Header */}
      <div className={`flex-1 flex flex-col items-center justify-center p-8 ${isCallEnded ? 'bg-gray-950' : ''}`}>
        <div className={`w-32 h-32 rounded-full ${isCallEnded ? 'bg-gray-800' : isCallStarted ? 'bg-green-700' : 'bg-gray-700'} mb-6 flex items-center justify-center`}>
          <span className="text-4xl">👤</span>
        </div>
        <h1 className="text-2xl font-semibold mb-2">AI Assistant</h1>
        <p className="text-gray-400 mb-1">
          {isCallEnded ? 'Call ended' : isCallStarted ? 'Call in progress' : 'Ready to call'}
        </p>
        {isCallStarted && !isCallEnded && <p className="text-gray-400">{formatDuration(callDuration)}</p>}
      </div>

      {/* Call Controls */}
      <div className="p-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <button 
            className={`flex flex-col items-center p-4 rounded-full ${isCallStarted ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-500'}`}
            onClick={handleStartCall}
          >
            <FaPhone className="text-2xl mb-2" />
            <span className="text-sm">{isCallStarted ? 'End Call' : 'Call'}</span>
          </button>
          <button 
            className={`flex flex-col items-center p-4 rounded-full ${isLogVisible ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700'}`}
            onClick={handleToggleLog}
          >
            <FaHashtag className="text-2xl mb-2" />
            <span className="text-sm">{isLogVisible ? 'Hide Log' : 'Show Log'}</span>
          </button>
          <button 
            className={`flex flex-col items-center p-4 rounded-full ${isPersonInfoVisible ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-800 hover:bg-gray-700'}`}
            onClick={handleTogglePersonInfo}
          >
            <FaUser className="text-2xl mb-2" />
            <span className="text-sm">Person Info</span>
          </button>
        </div>

        <button
          onClick={handleAnalyzeChatHistory}
          disabled={isAnalyzing || transcriptItems.length === 0 || !isCallEnded}
          className="w-full bg-red-500 text-white p-4 rounded-full flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
        >
          <FaPhone className="transform rotate-135 mr-2" />
          {isAnalyzing ? (
            <span className="flex items-center">
              <FaSpinner className="animate-spin mr-2" />
              <span>Preparing Analysis</span>
              <span className="inline-flex ml-2">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce animation-delay-200">.</span>
                <span className="animate-bounce animation-delay-400">.</span>
              </span>
            </span>
          ) : 'Analyze Chat History'}
        </button>

        {isAnalyzing && (
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-red-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-400 mt-2">
              {analysisProgress < 30 ? 'Processing conversation...' :
                analysisProgress < 70 ? 'Analyzing content...' :
                  analysisProgress < 100 ? 'Finalizing results...' :
                    'Redirecting to report...'}
            </p>
          </div>
        )}
      </div>

      {/* Hidden App Component */}
      <div className="hidden">
        <App hideLogs={true} ref={appRef} />
      </div>

      {/* Conversation Log */}
      {isLogVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Conversation Log</h2>
              <button 
                onClick={handleToggleLog}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {transcriptItems.length === 0 ? (
                <p className="text-gray-400 text-center">No conversation yet</p>
              ) : (
                <div className="space-y-4">
                  {transcriptItems.map((item, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg ${
                        item.role === 'user' ? 'bg-blue-900 ml-8' : 'bg-gray-700 mr-8'
                      }`}
                    >
                      <div className="font-semibold mb-1">
                        {item.role === 'user' ? 'You' : 'AI Assistant'}
                      </div>
                      <div>{item.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Person Info Modal */}
      {isPersonInfoVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Person Information</h2>
              <button 
                onClick={handleTogglePersonInfo}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mr-4">
                  <span className="text-3xl">👤</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">小陳</h3>
                  <p className="text-gray-400">資深研發工程師</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Department</h4>
                  <p>電子動力系統事業部</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Languages</h4>
                  <p>English, Japanese, Chinese</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Summary</h4>
                  <p className="text-sm">近期負責的專案時程多次延誤，雖然技術方案可行，但在與採購部門和生產製造部門的協作上頻繁出現摩擦與衝突...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <EventProvider>
      <AppProvider>
        <TranscriptProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <DemoContent />
          </Suspense>
        </TranscriptProvider>
      </AppProvider>
    </EventProvider>
  );
} 