'use client';

import { useState, useEffect, Suspense } from 'react';
import { AnalysisResponse } from '../../api/analysis/route';
import { useTranscript } from '../../contexts/TranscriptContext';
import { useSearchParams } from 'next/navigation';
import { TranscriptProvider } from '../../contexts/TranscriptContext';
import { EventProvider } from '../../contexts/EventContext';
import { useRouter } from 'next/navigation';

function AnalysisReportContent() {
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { } = useTranscript();
  const searchParams = useSearchParams();
  const router = useRouter();
  
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

  const handleBackToDemo = () => {
    router.push('/demo');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 border-b pb-2">Conversation Analysis Report</h1>
        <button 
          onClick={handleBackToDemo}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-sm"
        >
          Back to Demo
        </button>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-xl text-gray-700">Analyzing conversation...</p>
        </div>
      ) : error ? (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md border border-red-300">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      ) : analysis ? (
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
          
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Conversation History</h3>
            <div className="bg-white p-4 rounded-md border border-gray-200 max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{message}</pre>
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
    <TranscriptProvider>
      <EventProvider>
        <AnalysisReportContentWithSuspense />
      </EventProvider>
    </TranscriptProvider>
  );
} 