import { useState } from 'react';

interface Document {
  id: string;
  content: string;
  embedding: number[];
}

interface UseRagServiceReturn {
  search: (query: string, topK?: number) => Promise<Document[]>;
  isLoading: boolean;
  error: string | null;
}

export function useRagService(): UseRagServiceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string, topK: number = 3): Promise<Document[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search',
          query,
          topK,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search documents');
      }
      
      const data = await response.json();
      return data.results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    search,
    isLoading,
    error,
  };
} 