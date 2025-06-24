'use client';
import React, { useEffect, useState } from 'react';

const API_URL = '/api/agents'; // API 路徑改為 /agents

export default function FetchPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('API 錯誤');
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>載入中...</div>;
  if (error) return <div>錯誤：{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">API 資料</h1>
      <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
