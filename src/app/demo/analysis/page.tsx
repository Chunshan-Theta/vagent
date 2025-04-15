'use client';

import { useState, useEffect } from 'react';
import { AnalysisRequest, AnalysisResponse } from '../../api/analysis/route';
import { useTranscript } from '../../contexts/TranscriptContext';
import { useSearchParams } from 'next/navigation';
import { TranscriptProvider } from '../../contexts/TranscriptContext';
import { EventProvider } from '../../contexts/EventContext';

function AnalysisContent() {
  const [message, setMessage] = useState('');
  const [criteria, setCriteria] = useState(['1. 評分標準標題：G（Goal）目標設定 -評分目的：引導部屬描述希望達成的具體成果樣貌，避免籠統空泛。 運用開放式提問，以部屬為中心，引導其自主探索並表達自己真正想達成的目標。 -評分標準1： > 目標具體清晰 (Goal Specificity & Clarity)：引導部屬描述希望達成的具體成果樣貌，避免籠統空泛。 非常貼切： 目標描述非常具體，成果樣貌清晰可想像，且可驗證。 貼切： 目標大致具體，但部分描述仍有些模糊或不易驗證。 一點貼切： 目標描述籠統、空泛、不切實際。 -評分標準2： > 引導自主目標設定 (Guiding Self-Set Goals) ：運用開放式提問，以部屬為中心，引導其自主探索並表達自己真正想達成的目標。 非常貼切： 透過有效的開放式提問，成功引導部屬清晰表達出內心認同、自主設定的目標。 貼切： 嘗試使用開放式提問，部屬表達了目標，但自主性或清晰度稍弱，或受到主管較多暗示。 一點貼切： 主要由主管給定目標、使用封閉式提問，或未能引導部屬表達其真實想法。', '2. R（Reality）現況分析 -評分目的： 引導部屬釐清當前的具體狀況、已知資訊、已嘗試方法，並適時補充主管的客觀觀察/數據。協助部屬盤點目前遇到的困難、干擾因素，並探索可能的盲點或未被注意的面向。 -評分標準1： > 現況釐清與事實盤點 (Situation Clarification & Fact Inventory)： 引導部屬釐清當前的具體狀況、已知資訊、已嘗試方法，並適時補充主管的客觀觀察/數據。 非常貼切： 部屬充分陳述事實，主管有效補充關鍵資訊，雙方對客觀現況有清晰共識。 貼切： 部屬陳述了部分事實，主管有補充，但對整體狀況的掌握不夠全面。 一點貼切： 陳述不清、避重就輕，或參雜過多主觀臆測，未能釐清客觀事實。 -評分標準2： > 挑戰探索與盲點覺察 (Challenge Exploration & Blind Spot Awareness)：協助部屬盤點目前遇到的困難、干擾因素，並探索可能的盲點或未被注意的面向。 非常貼切：深入探討了核心困難與干擾因素，並成功引導部屬覺察到至少一個先前未意識到的盲點。 貼切：討論了表面困難，但對根本原因或潛在盲點的探索不夠深入。 一點貼切：未能有效引導部屬面對困難，或完全忽略了對盲點的探索。', '3. O（Options）方案選擇 -評分目的： 鼓勵部屬主動發想出多種不同的可行行動方案，避免陷入單一思維。 引導部屬思考選項時能連結相關經驗、資源（他人建議、外部資源等），並適時融入主管經驗共同探討。 -評分標準1： > 選項發想的廣度 (Breadth of Option Generation)： 鼓勵部屬主動發想出多種不同的可行行動方案，避免陷入單一思維。 非常貼切： 引導部屬主動提出 2個或以上 來自不同角度或思路的選項。 貼切：引導部屬提出 至少1個 選項，或選項同質性高、不夠多元。 一點貼切：未引導部屬思考，直接給答案，或只停留在單一、顯而易見的選項。 -評分標準2： > 選項探索的深度與資源連結 (Depth of Option Exploration & Resource Linking)：引導部屬思考選項時能連結相關經驗、資源（他人建議、外部資源等），並適時融入主管經驗共同探討。 非常貼切：能引導部屬從多元角度（經驗/資源/他人）思考，並結合主管經驗深入探討選項的可行性。 貼切：有嘗試引導從不同角度思考，但連結不夠深入，或主管經驗分享變成單向指導。 一點貼切： 選項思考侷限於部屬自身經驗，未引導連結其他資源或經驗。','4. W（Will/ Way Forward）意願與行動 -評分目的： 引導部屬制定具體、可執行的下一步行動，包含「何時做」、「做什麼」。 確認部屬對行動計畫的執行承諾度，並建立清晰的追蹤方式。 -評分標準1： >  行動計畫的清晰度 (Clarity of Action Plan)：引導部屬制定具體、可執行的下一步行動，包含「何時做」、「做什麼」。 非常貼切：行動計畫非常具體（含人/事/時），步驟清晰、可操作性強。 貼切：行動計畫大致可行，但部分步驟或時間點不夠明確。 一點貼切：行動計畫模糊不清、缺乏具體步驟或時間規劃。 -評分標準2： > 執行承諾與追蹤 (Commitment & Follow-up)：確認部屬對行動計畫的執行承諾度，並建立清晰的追蹤方式。 非常貼切：部屬明確表達高承諾度（例如：意願分數高、語氣肯定），並共同約定具體的追蹤時間與方式。 貼切： 部屬口頭承諾，但意願感受不明顯或有猶豫，追蹤方式不夠具體。 一點貼切： 部屬意願低落或迴避承諾，未建立追蹤機制。']);
  const [weights, setWeights] = useState([0.5, 0.5, 0.5, 0.5]);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { transcriptItems } = useTranscript();
  const searchParams = useSearchParams();
  const [shouldAnalyze, setShouldAnalyze] = useState(false);
  
  // Check for history parameter in URL
  useEffect(() => {
    const historyParam = searchParams.get('history');
    if (historyParam) {
      setMessage(decodeURIComponent(historyParam));
      // Set flag to analyze after message is updated
      setShouldAnalyze(true);
    }
  }, [searchParams]);

  // Separate effect to handle analysis after message is updated
  useEffect(() => {
    if (shouldAnalyze && message) {
      handleAnalyze();
      setShouldAnalyze(false);
    }
  }, [message, shouldAnalyze]);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          rubric: {
            criteria,
            weights,
          },
        } as AnalysisRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze message');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };


  // Function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 6) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  // Function to get overall score color
  const getOverallScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Conversation Analysis Demo</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Message to Analyze
        </label>
        <textarea
          className="w-full p-3 border rounded-md h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message here..."
          readOnly={true}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Analysis Criteria
        </label>
        <p className="block text-sm font-medium mb-2 text-gray-700">{loading ? 'Analyzing...' : 'Analyze finished.'}</p>
        <div className="space-y-3 bg-gray-50 p-4 rounded-md" hidden={true}>
          {criteria.map((criterion, index) => (
            <div key={index} className="flex items-center gap-4">
              <input
                type="text"
                className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                value={criterion}
                onChange={(e) => {
                  const newCriteria = [...criteria];
                  newCriteria[index] = e.target.value;
                  setCriteria(newCriteria);
                }}
              />
              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-600">Weight:</label>
                <input
                  type="number"
                  className="w-20 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={weights[index]}
                  onChange={(e) => {
                    const newWeights = [...weights];
                    newWeights[index] = parseFloat(e.target.value);
                    setWeights(newWeights);
                  }}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex gap-4 mb-6" hidden={true}>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 shadow-sm"
          onClick={handleAnalyze}
          disabled={loading || !message}
          hidden={true}
        >
          {loading ? 'Analyzing...' : 'Analyze Message'}
        </button>
        
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md border border-red-300">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {analysis && (
        <div className="mt-8 space-y-6">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Analysis Results</h2>
              <div className={`text-3xl font-bold ${getOverallScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore.toFixed(1)}/10
              </div>
            </div>
            <p className="text-gray-700 text-lg">{analysis.feedback}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Detailed Scores</h3>
            {analysis.scores.map((score, index) => (
              <div key={index} className={`p-5 rounded-lg border ${getScoreColor(score.score)} shadow-sm`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg">{score.criterion}</h3>
                  <div className="flex items-center">
                    <div className="w-24 h-6 bg-gray-200 rounded-full mr-2 overflow-hidden">
                      <div 
                        className={`h-full ${score.score >= 8 ? 'bg-green-500' : score.score >= 6 ? 'bg-blue-500' : score.score >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${score.score * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-bold">{score.score}/10</span>
                  </div>
                </div>
                <p className="text-gray-800">{score.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalysisDemo() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <AnalysisContent />
      </EventProvider>
    </TranscriptProvider>
  );
} 