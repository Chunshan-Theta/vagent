'use client';

import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import * as convApi from '@/app/lib/ai-chat/convApi';

export default function ConvPage() {

  return (
    <div className="space-y-6 max-w-lg mx-auto py-10">
      <ExportConvSection />
    </div>
  );
}


function ExportConvSection() {
  const convTypes = [
    { title: '靜態劇本', value: 'static' },
    { title: 'Agent', value: 'class' },
  ]
  const staticAgentIds: Array<{ title?: string; value: string }> = [
    { value: 'landbank-v2' },
    { value: 'deltaww' },
    { value: 'deltaww-v1' },
    { value: 'deltaww-v2' },
    { value: 'deltaww-v3' },
    { value: 'landbank' },
    { value: 'newdean-v1' },
  ]

  // agentType
  const [agentType, setAgentType] = useState(convTypes[0].value);
  const [agentId, setAgentId] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 切換類型後自動清除 scriptId
    setAgentId('');
  }, [agentType])

  // 根據selectedType套用不同的劇本ID候選項目
  const nowScriptIds = useMemo<typeof staticAgentIds>(() => {
    if (agentType === 'static') {
      return staticAgentIds;
    }
    return [];
  }, [agentType])

  const btnExportConvMessages = async () => {
    if (loading) return;
    if (!agentId) {
      alert('請輸入或選擇 Agent ID');
      return;
    }
    setLoading(true);
    const doDownload = async () => {
      const res = await apiGetConvLogs(agentType, agentId)
      const datas = res.data.flatMap((conv) => {

        const messages = conv.messages || []
        return messages.map((msg) => {
          return {
            convId: conv.id,
            agentId: conv.agentId,
            email: conv.email,
            name: conv.uname,

            ai: msg.role === 'assistant' ? msg.content : '',
            user: msg.role === 'user' ? msg.content : '',

            createdAt: conv.createdAt,
          }
        })
      })
      const csvData = dataToCsv(datas);
      if (!csvData) {
        alert('沒有資料可以匯出');
        return;
      }
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', `conv_logs.tsv`);
      link.click();
      URL.revokeObjectURL(url);
    }
    doDownload().finally(() => {
      setLoading(false);
    })
  };

  const dataToCsv = (data: any[]) => {
    if (!data || data.length === 0) return '';
    return Papa.unparse(data, {
      quoteChar: '"',
      escapeChar: '"',
      newline: '\r\n',
      delimiter: '\t',
      header: true,
      skipEmptyLines: true,
    })

  }

  const apiGetConvLogs = async (agentType: string, agentId: string) => {
    const res = await convApi.searchConvLogs({
      agentType,
      agentId,
    });
    return res;
  }
  return (
    <div className="mt-2">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 ml-1">匯出紀錄</h1>
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">選擇類型</label>
          <select
            value={agentType}
            onChange={e => setAgentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {convTypes.map(type => (
              <option key={type.value} value={type.value}>{type.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent ID</label>
          <input
            type="text"
            list="script-id-suggestions"
            value={agentId}
            onChange={e => setAgentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="輸入或選擇 Agent ID"
          />
          <datalist id="script-id-suggestions">
            {nowScriptIds.map(s => (
              <option key={s.value} value={s.value}>{s.title || s.value}</option>
            ))}
          </datalist>
        </div>
        <div className="flex justify-end">
          <button
            onClick={btnExportConvMessages}
            className={`px-4 py-2 rounded-md transition-colors text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={loading}
          >
            {loading ? '下載中...' : '下載'}
          </button>
        </div>
      </div>
    </div>
  );
}