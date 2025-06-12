'use client';

import { Suspense, useState, useEffect } from 'react';
import ClassReportComponent from '@/app/components/ai-report/ClassReportComponent';
import ReportViewV2 from '@/app/components/ai-report/ReportViewV2';
import { AnalysisResponse, ReportDatas } from '@/app/types/ai-report/common';

type ReportTab = 'v1' | 'v2';

function ReportContent() {
  const [activeTab, setActiveTab] = useState<ReportTab>('v2');
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const KEY = {
    analysis: 'deltaww/v3/analysis',
    messages: 'deltaww/v3/messages',
  }

  useEffect(() => {
    init();
  }, []);


  async function fetchAnalysisData(): Promise<AnalysisResponse> {
    const analysisStr = localStorage.getItem(KEY.analysis);
    if (!analysisStr) {
      throw new Error('No analysis data found in local storage');
    }
    const analysisData = JSON.parse(analysisStr) as AnalysisResponse;
    return analysisData;
  }

  async function init() {
    try {
      // load messages from local storage
      const sMessages = JSON.parse(localStorage.getItem(KEY.messages) || '[]');
      setMessages(sMessages);
      const analysis = await fetchAnalysisData()
      setAnalysisData(analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Render tab buttons
  const renderTabs = () => (
    <div className="flex justify-between items-center mb-6">
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 rounded-lg transition-colors duration-200 bg-[#173944] text-gray-300 hover:bg-[#194A54]"
      >
        ← Back
      </button>
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('v2')}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'v2'
              ? 'bg-[#00A3E0] text-white'
              : 'bg-[#173944] text-gray-300 hover:bg-[#194A54]'
          }`}
        >
          總體分析
        </button>
      </div>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00A3E0]"></div>
        </div>
      );
    }

    if (!analysisData) {
      return (
        <div className="text-white text-center p-8">
          No report data found
        </div>
      );
    }

    if (activeTab === 'v1') {
      return (
        <ClassReportComponent />
      );
    }
    return (
      <ReportViewV2
        data={analysisData} 
        message={messages} 
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#0F2D38] p-4">
      {renderTabs()}
      {renderContent()}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
} 