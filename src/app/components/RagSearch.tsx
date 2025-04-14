'use client';

import { useState } from 'react';
import { useRagService } from '../hooks/useRagService';

interface Document {
  id: string;
  content: string;
  embedding: number[];
}

export default function RagSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const { search, isLoading, error } = useRagService();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const searchResults = await search(query);
    setResults(searchResults);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">员工评估标准搜索</h2>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入搜索关键词，如：领导能力、沟通能力、问题解决..."
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isLoading ? '搜索中...' : '搜索'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
          错误: {error}
        </div>
      )}
      
      {results.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">搜索结果</h3>
          {results.map((doc) => (
            <div key={doc.id} className="p-4 border border-gray-200 rounded">
              <div className="whitespace-pre-line">{doc.content}</div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center text-gray-500">
            输入关键词搜索员工评估标准
          </div>
        )
      )}
    </div>
  );
} 