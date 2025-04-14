import { Tool } from "@/app/types";

interface RAGSearchParams {
  query: string;
  topK?: number;
}

export const ragSearchTool: Tool = {
  type: "function",
  name: "ragSearch",
  description: "搜索员工评估标准文档并返回最相关的内容。当用户询问关于员工评估标准的问题时，使用此工具搜索相关信息。",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "搜索查询，例如：'领导能力'、'沟通能力'、'问题解决能力'等"
      },
      topK: {
        type: "number",
        description: "返回结果数量，默认为3"
      }
    },
    required: ["query"]
  }
};

// Add the tool logic to the agent config
export const ragSearchToolLogic = {
  ragSearch: async (args: RAGSearchParams) => {
    try {
      const { query, topK = 3 } = args;
      
      // Use the API endpoint instead of direct file operations
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
        throw new Error(errorData.error || '搜索文档时发生错误');
      }
      
      const data = await response.json();
      return {
        success: true,
        results: data.results.map((doc: any) => ({
          id: doc.id,
          content: doc.content
        }))
      };
    } catch (error) {
      console.error('RAG search error:', error);
      return {
        success: false,
        error: "搜索文档时发生错误"
      };
    }
  }
}; 