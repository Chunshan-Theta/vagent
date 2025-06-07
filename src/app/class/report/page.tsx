'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import type { AnalysisResponse } from '@/app/api/analysis/route';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { FaChartBar, FaLightbulb, FaComments, FaHistory, FaArrowLeft, FaStar } from 'react-icons/fa';
import confetti from 'canvas-confetti';

import { getChatHistoryText, handleAnalysisExamples } from '@/app/lib/ai-chat/utils'
import { getTranslation } from '@/app/i18n/translations'
import type { Language } from '@/app/i18n/translations'

interface TimelineItem {
  mainColor: string;
  title: string;
  subtitleColor: string;
  subtitle: string;
  aiRole: string;
  userRole: string;
  aiSay: string;
  userSay: string;
  analysis: string[];
  keyPoint: {
    sentences: string[];
    problems: string[];
  };
  time: number;
}

interface Report {
  timeline: TimelineItem[];
}

function AnalysisReportContent() {
  const [lang, setLang] = useState<Language>('zh');
  const [message, setMessage] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const roleMap = useMemo(() => ({
    user: getTranslation(lang, 'chat_view.participants.user'),
    assistant: getTranslation(lang, 'chat_view.participants.assistant')
  }), [lang]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('client-language') as Language || 'zh';
      setLang(storedLang);
    }
  }, []);

  // Check for history parameter in URL and retrieve analysis from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get the analysis result and chat history from localStorage
    const storedReport = localStorage.getItem('report');
    const storedChatMessages = localStorage.getItem('chatMessages');

    const storedChatHistory = getChatHistoryText(JSON.parse(storedChatMessages || '[]').filter((msg: any) => msg.role !== 'system'), { roleMap })

    if (storedReport && storedChatHistory) {
      try {
        const parsedReport = JSON.parse(storedReport);
        setReport(parsedReport);
        setMessage(storedChatHistory);
        setLoading(false);

        // Trigger confetti if there are positive emotions
        const hasPositiveEmotions = parsedReport.timeline.some((item: TimelineItem) => 
          item.subtitle.includes('open') || item.subtitle.includes('netural')
        );
        if (hasPositiveEmotions) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 1000);
        }
      } catch (err) {
        console.error('Error parsing stored report:', err);
        setError('Error loading analysis results');
        setLoading(false);
      }
    } else {
      setError('No analysis results or chat history found');
      setLoading(false);
    }
  }, [roleMap]);

  // Function to get localized UI text based on language
  const getLocalizedText = (key: string) => {
    const localizedTexts: Record<string, Record<string, string>> = {
      en: {
        title: 'Conversation Analysis Report',
        backToDemo: 'Back to Demo',
        analyzing: 'Analyzing conversation...',
        error: 'Error',
        analysisResults: 'Analysis Results',
        conversationSummary: 'Conversation Summary',
        overallImprovementTips: 'Overall Improvement Tips',
        detailedScores: 'Detailed Scores',
        examples: 'Examples from the conversation:',
        improvementTips: 'Improvement Tips:',
        conversationHistory: 'Conversation History',
        noAnalysisResults: 'No analysis results or chat history found',
        errorLoadingResults: 'Error loading analysis results',
        keyPoints: 'Key Points',
        problems: 'Problems',
        analysis: 'Analysis'
      },
      zh: {
        title: '對話分析報告',
        backToDemo: '開始新對話',
        analyzing: '正在分析...',
        error: '錯誤',
        analysisResults: '分析結果',
        conversationSummary: '對話摘要',
        overallImprovementTips: '整體改進建議',
        detailedScores: '評分細節',
        examples: '對話中提到:',
        improvementTips: '改進建議:',
        conversationHistory: '對話紀錄',
        noAnalysisResults: '未找到分析结果或對話歷史',
        errorLoadingResults: '加载分析结果錯誤',
        keyPoints: '重點',
        problems: '問題',
        analysis: '分析'
      }
    };

    return localizedTexts[lang]?.[key] || localizedTexts['en'][key];
  };

  const handleBackToDemo = () => {
    router.back();
  };

  return (
    <div className="analysis-page container mx-auto p-4 max-w-4xl bg-[#0F2D38] rounded-[20px] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
      <div className="flex justify-between items-center mb-6 bg-[#194A54] p-4 rounded-[12px] shadow-[inset_0_0_6px_rgba(0,255,255,0.15)]">
        <h1 className="text-3xl font-bold text-white border-b pb-2 flex items-center">
          <FaChartBar className="mr-2 text-[#FFE066]" />
          {getLocalizedText('title')}
        </h1>
        <button
          onClick={handleBackToDemo}
          className="bg-[#00A3E0] text-white px-4 py-2 rounded-full hover:bg-[#00A3E0]/90 transition-colors duration-200 shadow-[0_2px_4px_rgba(0,160,255,0.3)] flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          {getLocalizedText('backToDemo')}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00A3E0] mb-4"></div>
          <p className="text-xl text-white">{getLocalizedText('analyzing')}</p>
        </div>
      ) : error ? (
        <div className="mt-4 p-4 bg-[#173944] text-red-400 rounded-[20px] border border-[#2D5A67]">
          <p className="font-medium">{getLocalizedText('error')}</p>
          <p>{error}</p>
        </div>
      ) : report ? (
        <div className="mt-8 space-y-6">
          {report.timeline.map((item, index) => (
            <div key={index} className="p-6 bg-[#173944] rounded-[20px] border border-[#2D5A67] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  {item.title}
                </h2>
                <div className="text-2xl" style={{ color: item.mainColor }}>
                  {item.subtitle}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="bg-[#2D5A67] p-4 rounded-[16px] border border-[#2D5A67]">
                  <div className="text-white">
                    <div><strong>{item.aiRole}:</strong> {item.aiSay}</div>
                    <div><strong>{item.userRole}:</strong> {item.userSay}</div>
                  </div>
                </div>

                {item.keyPoint.sentences.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{getLocalizedText('keyPoints')}</h3>
                    <ul className="list-disc list-inside text-white">
                      {item.keyPoint.sentences.map((sentence, i) => (
                        <li key={i}>{sentence}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.keyPoint.problems.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{getLocalizedText('problems')}</h3>
                    <ul className="list-disc list-inside text-white">
                      {item.keyPoint.problems.map((problem, i) => (
                        <li key={i}>{problem}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.analysis.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{getLocalizedText('analysis')}</h3>
                    <ul className="list-disc list-inside text-white">
                      {item.analysis.map((analysis, i) => (
                        <li key={i}>{analysis}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="mt-8 p-6 bg-[#173944] rounded-[20px] border border-[#2D5A67]">
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
              <FaHistory className="mr-2 text-[#FFE066]" />
              {getLocalizedText('conversationHistory')}
            </h3>
            <div className="bg-[#2D5A67] p-4 rounded-[16px] border border-[#2D5A67] max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-white">{message}</pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AnalysisReportContentWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalysisReportContent />
    </Suspense>
  );
}

export default function AnalysisReportDemo() {
  return <AnalysisReportContentWithSuspense />;
} 