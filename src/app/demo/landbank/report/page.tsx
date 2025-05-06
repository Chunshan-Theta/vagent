'use client';

import { useState, useEffect, Suspense } from 'react';
import { AnalysisResponse } from '../../../api/analysis/route';
import { useTranscript } from '../../../contexts/TranscriptContext';
import { TranscriptProvider } from '../../../contexts/TranscriptContext';
import { EventProvider } from '../../../contexts/EventContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaChartBar, FaLightbulb, FaComments, FaHistory, FaArrowLeft, FaStar } from 'react-icons/fa';
import confetti from 'canvas-confetti';

export function AnalysisReportContent() {
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for history parameter in URL and retrieve analysis from localStorage
  useEffect(() => {
    // Get the analysis result and chat history from localStorage
    const storedAnalysis = localStorage.getItem('analysisResult');
    const storedChatHistory = localStorage.getItem('chatHistory');

    if (storedAnalysis && storedChatHistory) {
      try {
        const parsedAnalysis = JSON.parse(storedAnalysis);
        setAnalysis(parsedAnalysis);
        setMessage(storedChatHistory);
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
    const language = analysis?.language || 'en';

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
        errorLoadingResults: 'Error loading analysis results'
      },
      zh: {
        title: '對話分析報告',
        backToDemo: '重新對話',
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
        errorLoadingResults: '加载分析结果錯誤'
      },
      ja: {
        title: '会話分析レポート',
        backToDemo: 'デモに戻る',
        analyzing: '会話を分析中...',
        error: 'エラー',
        analysisResults: '分析結果',
        conversationSummary: '会話の要約',
        overallImprovementTips: '全体的な改善のヒント',
        detailedScores: '詳細スコア',
        examples: '会話からの例:',
        improvementTips: '改善のヒント:',
        conversationHistory: '会話履歴',
        noAnalysisResults: '分析結果または会話履歴が見つかりません',
        errorLoadingResults: '分析結果の読み込み中にエラーが発生しました'
      },
      ko: {
        title: '대화 분석 보고서',
        backToDemo: '데모로 돌아가기',
        analyzing: '대화 분석 중...',
        error: '오류',
        analysisResults: '분석 결과',
        conversationSummary: '대화 요약',
        overallImprovementTips: '전체 개선 팁',
        detailedScores: '상세 점수',
        examples: '대화에서의 예시:',
        improvementTips: '개선 팁:',
        conversationHistory: '대화 기록',
        noAnalysisResults: '분석 결과 또는 대화 기록이 없습니다',
        errorLoadingResults: '분석 결과를 로드하는 중 오류가 발생했습니다'
      },
      es: {
        title: 'Informe de Análisis de Conversación',
        backToDemo: 'Volver a la Demostración',
        analyzing: 'Analizando conversación...',
        error: 'Error',
        analysisResults: 'Resultados del Análisis',
        conversationSummary: 'Resumen de la Conversación',
        overallImprovementTips: 'Consejos Generales de Mejora',
        detailedScores: 'Puntuaciones Detalladas',
        examples: 'Ejemplos de la conversación:',
        improvementTips: 'Consejos de Mejora:',
        conversationHistory: 'Historial de Conversación',
        noAnalysisResults: 'No se encontraron resultados de análisis o historial de conversación',
        errorLoadingResults: 'Error al cargar los resultados del análisis'
      },
      fr: {
        title: 'Rapport d\'Analyse de Conversation',
        backToDemo: 'Retour à la Démo',
        analyzing: 'Analyse de la conversation...',
        error: 'Erreur',
        analysisResults: 'Résultats de l\'Analyse',
        conversationSummary: 'Résumé de la Conversation',
        overallImprovementTips: 'Conseils d\'Amélioration Généraux',
        detailedScores: 'Scores Détaillés',
        examples: 'Exemples de la conversation:',
        improvementTips: 'Conseils d\'Amélioration:',
        conversationHistory: 'Historique de Conversation',
        noAnalysisResults: 'Aucun résultat d\'analyse ou historique de conversation trouvé',
        errorLoadingResults: 'Erreur lors du chargement des résultats d\'analyse'
      },
      de: {
        title: 'Konversationsanalysebericht',
        backToDemo: 'Zurück zur Demo',
        analyzing: 'Konversation wird analysiert...',
        error: 'Fehler',
        analysisResults: 'Analyseergebnisse',
        conversationSummary: 'Konversationszusammenfassung',
        overallImprovementTips: 'Allgemeine Verbesserungstipps',
        detailedScores: 'Detaillierte Bewertungen',
        examples: 'Beispiele aus der Konversation:',
        improvementTips: 'Verbesserungstipps:',
        conversationHistory: 'Konversationsverlauf',
        noAnalysisResults: 'Keine Analyseergebnisse oder Konversationsverlauf gefunden',
        errorLoadingResults: 'Fehler beim Laden der Analyseergebnisse'
      }
    };

    return localizedTexts[language]?.[key] || localizedTexts['en'][key];
  };

  const handleBackToDemo = () => {
    if (searchParams.has('back')) {
      const backUrl = searchParams.get('back') || '/demo';
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  // 原本顏色是 #0F2D38 ，現在要是修改成 #1a2a34
  const background = 'rgb(26, 42, 52)'
  // 根據新配色，調整以下整頁的相關顏色

  return (
    <div className="analysis-page container mx-auto p-4 max-w-4xl bg-[#1a2a34] rounded-[20px] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
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
      ) : analysis ? (
        <div className="mt-8 space-y-6">
          <div className="p-6 bg-[#173944] rounded-[20px] border border-[#2D5A67] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaStar className="mr-2 text-[#FFE066]" />
                {getLocalizedText('analysisResults')}
              </h2>
              <div className="flex flex-col items-end">
                <div className={`text-4xl font-bold ${getOverallScoreColor(analysis.overallScore)} flex items-center`}>
                  {analysis.overallScore.toFixed(0)}
                  <span className="text-2xl ml-1 text-white">/100</span>
                </div>
                <div className="text-2xl">{getScoreEmoji(analysis.overallScore)}</div>
              </div>
            </div>
            <div className="w-full bg-[#2D5A67] rounded-full h-4 mb-4">
              <div
                className={`h-full rounded-full ${getProgressBarColor(analysis.overallScore)} transition-all duration-1000 ease-out`}
                style={{ width: `${analysis.overallScore}%` }}
              ></div>
            </div>
            <p className="text-white text-lg">{analysis.feedback}</p>
          </div>

          {/* Summary Section */}
          <div className="p-6 bg-[#173944] rounded-[20px] border border-[#2D5A67] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <FaComments className="mr-2 text-[#FFE066]" />
              {getLocalizedText('conversationSummary')}
            </h2>
            <p className="text-white text-lg">{analysis.summary}</p>
          </div>

          {/* Overall Improvement Tips */}
          <div className="p-6 bg-[#173944] rounded-[20px] border border-[#2D5A67] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <FaLightbulb className="mr-2 text-[#FFE066]" />
              {getLocalizedText('overallImprovementTips')}
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              {analysis.overallImprovementTips.map((tip, index) => (
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
            {analysis.scores.map((score, index) => (
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

// Wrapper component that uses useSearchParams inside Suspense
function AnalysisReportContentWithSuspense() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <AnalysisReportContent />
    </Suspense>
  );
}

export default function AnalysisReportDemo() {
  return (
    <AnalysisReportContentWithSuspense />
  );
} 