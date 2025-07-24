'use client';
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";


export default function ConvReportPageContainer() {
  return (
    <Suspense>
      <CheckPage />
    </Suspense>
  )
}

function CheckPage() {
  const query = useSearchParams();
  const canOpen = useMemo(() => {
    return query.get('dev') === 'voiss';
  }, [query]);
  if (!canOpen) {
    return <div className="text-center text-gray-500">無法開啟</div>
  }
  return <ConvReportPage />;
}

function ConvReportPage() {
  const [convId, setConvId] = useState("");
  const [reportName, setReportName] = useState("");
  const router = useRouter();


  const reportTypes = [
    { title: '一般劇本分析', value: 'analysis-v1' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convId || !reportName) return;
    router.push(`/conv-report/${convId}/?report=${encodeURIComponent(reportName)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80 space-y-4" style={{ width: '100%', maxWidth: '500px' }}>
        <h1 className="text-2xl font-bold mb-4 text-center">分析報告</h1>
        <div>
          <label className="block mb-1 font-medium">convId</label>
          <input
            type="text"
            value={convId}
            onChange={e => setConvId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="請輸入 convId"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">reportName</label>
          <input
            type="text"

            list="report-types"
            value={reportName}
            onChange={e => setReportName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="請輸入報告名稱"
            required
          />

          <datalist id="report-types">
            {reportTypes.map(s => (
              <option key={s.value} value={s.value}>{s.title || s.value}</option>
            ))}
          </datalist>

        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          前往報告頁面
        </button>
      </form>
    </div>
  );
}
