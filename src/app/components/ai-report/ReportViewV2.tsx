'use client';

import { useState, useEffect } from 'react';
import { FaChartBar, FaLightbulb, FaComments, FaHistory, FaArrowLeft, FaStar } from 'react-icons/fa';
import confetti from 'canvas-confetti';
import { AnalysisResponse } from '@/app/types/ai-report/common';


interface Props {
  /**
   * 分析結果數據，可以是 AnalysisResponse 對象或 JSON 字符串
   */
  data: AnalysisResponse | string;
  onBack?: () => void;
  /**
   * 保存的聊天紀錄 ( 可以是 JSON 字符串或 Array<Message> )
   */
  message?: any[] | string;
}

export default function ReportViewV2({ data: analysis, onBack, message = '' }: Props) {
  const [localAnalysis, setLocalAnalysis] = useState<AnalysisResponse | null>(null);
  const [localMessage, setLocalMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getStoredChatMessages() : string {
    if (typeof message === 'string' && message.trim() !== '') {
      return message
    }
    if (Array.isArray(message)) {
      return JSON.stringify(message);
    }
    if (typeof window === 'undefined') return '[]';
    return localStorage.getItem('chatMessages') || '[]';
  }
  function getStoredAnalysis() {
    if (typeof analysis === 'string' && analysis.trim() !== '') {
      return analysis
    }
    if (typeof analysis === 'object' && analysis != null) {
      return JSON.stringify(analysis);
    }
    if (typeof window === 'undefined') return '{}';
    return localStorage.getItem('analyzeChatHistoryByRubric');
  }


  // Check for history parameter in URL and retrieve analysis from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get the analysis result and chat history from localStorage
    const storedAnalysis = getStoredAnalysis();
    const storedChatMessages = getStoredChatMessages();
    // console.log("Stored Analysis:", {
    //   analysis,
    //   message,
    //   stored: {
    //     analysis: storedAnalysis,
    //     chatMessages: storedChatMessages
    //   }
    // });

    const getMsgContent = (msg: any) => {
      if (typeof msg === 'string') return msg;
      if (msg && typeof msg === 'object') {
        return (msg.content ?? msg.title) || '';
      }
      return '';
    }

    const storedChatHistory = storedChatMessages ?
      JSON.parse(storedChatMessages)
        .filter((msg: any) => msg.role !== 'system')
        .map((msg: any) => `${msg.role}: ${getMsgContent(msg)}`)
        .join('\n\n') : '';

    if (storedAnalysis && storedChatHistory) {
      try {
        const parsedAnalysis = JSON.parse(storedAnalysis);

        if (Array.isArray(parsedAnalysis.scores)) {
          for (const scoreItem of parsedAnalysis.scores) {
            if (Array.isArray(scoreItem.examples)) {
              scoreItem.examples = scoreItem.examples.map((example: string) => example.trim());
            }
          }
        }

        setLocalAnalysis(parsedAnalysis);
        setLocalMessage(storedChatHistory);
        setLoading(false);

        // Trigger confetti if score is high
        if (parsedAnalysis.overallScore >= 80) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 1000);
        }
      } catch (err) {
        console.error('Error parsing stored analysis:', err);
        setError('Error loading analysis results');
        setLoading(false);
      }
    } else {
      setError('No analysis results or chat history found');
      setLoading(false);
    }
  }, []);

  // Function to get overall score color
  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#FFE066]';
    if (score >= 60) return 'text-[#00A3E0]';
    if (score >= 40) return 'text-[#FFBD1F]';
    return 'text-red-400';
  };

  // Function to get emoji based on score
  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '👍';
    if (score >= 40) return '😐';
    return '😕';
  };

  // Function to get progress bar color based on score
  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-[#FFE066]';
    if (score >= 60) return 'bg-[#00A3E0]';
    if (score >= 40) return 'bg-[#FFBD1F]';
    return 'bg-red-400';
  };

  // Function to get localized UI text based on language
  const getLocalizedText = (key: string) => {
    const language = localAnalysis?.language || 'en';

    const localizedTexts: Record<string, Record<string, string>> = {
      en: {
        title: 'Conversation Analysis Report',
        backToDemo: 'Back',
        analyzing: 'Analyzing conversation...',
        error: 'Error',
        analysisResults: 'Analysis Results',
        conversationSummary: 'Conversation Summary',
        overallImprovementTips: 'Overall Improvement Tips',
        detailedScores: 'Detailed Scores',
        examples: 'Examples from the conversation:',
        improvementTips: 'Improvement Tips:',
        conversationHistory: 'Conversation History',
      },
      zh: {
        title: '對話分析報告',
        backToDemo: '返回',
        analyzing: '正在分析...',
        error: '錯誤',
        analysisResults: '分析結果',
        conversationSummary: '對話摘要',
        overallImprovementTips: '整體改進建議',
        detailedScores: '評分細節',
        examples: '對話中提到:',
        improvementTips: '改進建議:',
        conversationHistory: '對話紀錄',
      }
    };

    return localizedTexts[language]?.[key] || localizedTexts['en'][key];
  };

  return (
    <div className="analysis-page container mx-auto p-4 max-w-4xl bg-[#0F2D38] rounded-[20px] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
      {loading ? (
        <div className="text-white text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-red-400 text-center py-8">{error}</div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6 bg-[#194A54] p-4 rounded-[12px] shadow-[inset_0_0_6px_rgba(0,255,255,0.15)]">
            <h1 className="text-3xl font-bold text-white border-b pb-2 flex items-center">
              <FaChartBar className="mr-2 text-[#FFE066]" />
              {getLocalizedText('title')}
            </h1>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-[#00A3E0] text-white px-4 py-2 rounded-full hover:bg-[#00A3E0]/90 transition-colors duration-200 shadow-[0_2px_4px_rgba(0,160,255,0.3)] flex items-center"
              >
                <FaArrowLeft className="mr-2" />
                {getLocalizedText('backToDemo')}
              </button>
            )}
          </div>

          <div className="mt-8 space-y-6">
            <div className="p-6 bg-[#173944] rounded-[20px] border border-[#2D5A67] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <FaStar className="mr-2 text-[#FFE066]" />
                  {getLocalizedText('analysisResults')}
                </h2>
                <div className="flex flex-col items-end">
                  <div className={`text-4xl font-bold ${getOverallScoreColor(localAnalysis?.overallScore || 0)} flex items-center`}>
                    {localAnalysis?.overallScore.toFixed(0)}
                    <span className="text-2xl ml-1 text-white">/100</span>
                  </div>
                  <div className="text-2xl">{getScoreEmoji(localAnalysis?.overallScore || 0)}</div>
                </div>
              </div>
              <div className="w-full bg-[#2D5A67] rounded-full h-4 mb-4">
                <div
                  className={`h-full rounded-full ${getProgressBarColor(localAnalysis?.overallScore || 0)} transition-all duration-1000 ease-out`}
                  style={{ width: `${localAnalysis?.overallScore || 0}%` }}
                ></div>
              </div>
              <p className="text-white text-lg">{localAnalysis?.feedback}</p>
            </div>

            {/* Summary Section */}
            <div className="p-6 bg-[#173944] rounded-[20px] border border-[#2D5A67] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <FaComments className="mr-2 text-[#FFE066]" />
                {getLocalizedText('conversationSummary')}
              </h2>
              <p className="text-white text-lg">{localAnalysis?.summary}</p>
            </div>

            {/* Overall Improvement Tips */}
            <div className="p-6 bg-[#173944] rounded-[20px] border border-[#2D5A67] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <FaLightbulb className="mr-2 text-[#FFE066]" />
                {getLocalizedText('overallImprovementTips')}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                {localAnalysis?.overallImprovementTips.map((tip, index) => (
                  <li key={index} className="text-white flex items-start">
                    <span className="inline-block w-6 h-6 rounded-full bg-[#2D5A67] text-[#FFE066] flex items-center justify-center mr-2 mt-0.5 text-sm font-bold">
                      {index + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                <FaChartBar className="mr-2 text-[#FFE066]" />
                {getLocalizedText('detailedScores')}
              </h3>
              {localAnalysis?.scores.map((score, index) => (
                <div key={index} className={`p-5 rounded-[20px] border border-[#2D5A67] bg-[#173944] shadow-[0_4px_20px_rgba(0,160,255,0.15)] hover:shadow-[0_4px_20px_rgba(0,160,255,0.25)] transition-shadow duration-300`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg text-white">{score.criterion}</h3>
                    <div className="flex items-center">
                      <div className="w-32 h-6 bg-[#2D5A67] rounded-full mr-2 overflow-hidden">
                        <div
                          className={`h-full ${getProgressBarColor(score.score)} transition-all duration-1000 ease-out`}
                          style={{ width: `${score.score}%` }}
                        ></div>
                      </div>
                      <span className="text-lg font-bold text-white">{score.score.toFixed(0)}/100</span>
                      <span className="ml-2 text-xl">{getScoreEmoji(score.score)}</span>
                    </div>
                  </div>
                  <p className="text-white mb-3">{score.explanation}</p>

                  {/* Examples Section */}
                  <div className="mt-3 mb-3 bg-[#2D5A67] bg-opacity-50 p-3 rounded-[16px]">
                    <h4 className="font-semibold text-white mb-2 flex items-center">
                      <FaComments className="mr-2 text-[#FFE066]" />
                      {getLocalizedText('examples')}
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {score.examples.map((example, idx) => (
                        <li key={idx} className="text-white text-sm italic">&quot;{example}&quot;</li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvement Tips Section */}
                  <div className="mt-3 bg-[#2D5A67] bg-opacity-50 p-3 rounded-[16px]">
                    <h4 className="font-semibold text-white mb-2 flex items-center">
                      <FaLightbulb className="mr-2 text-[#FFE066]" />
                      {getLocalizedText('improvementTips')}
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {score.improvementTips.map((tip, idx) => (
                        <li key={idx} className="text-white text-sm flex items-start">
                          <span className="inline-block w-5 h-5 rounded-full bg-[#2D5A67] text-[#FFE066] flex items-center justify-center mr-2 mt-0.5 text-xs font-bold">
                            {idx + 1}
                          </span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {localMessage && (
              <div className="mt-8 p-6 bg-[#173944] rounded-[20px] border border-[#2D5A67]">
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                  <FaHistory className="mr-2 text-[#FFE066]" />
                  {getLocalizedText('conversationHistory')}
                </h3>
                <div className="bg-[#2D5A67] p-4 rounded-[16px] border border-[#2D5A67] max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-white">{localMessage}</pre>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 