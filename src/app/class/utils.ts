
import { AgentConfig, Tool, TranscriptItem } from "@/app/types";


export async function fetchAgentConfig(id: string): Promise<AgentConfig[]> {
  const response = await fetch(`/api/agents/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error('Agent not found');
  }
  const data = await response.json();
  return data.agent;
};

/**
 * 處理 api 回傳的 tools data
 * @param tools 
 * @returns 
 */
export function handleApiTools(tools: any[]) {
  if(!Array.isArray(tools)) {
    throw new Error('Tools must be an array');
  }

  const toolLogic: Record<string, (args: any, transcriptLogsFiltered: TranscriptItem[]) => Promise<any> | any> = {};
  const pTools:Tool[] = tools.map((tool: any) => {
    // Add tool logic
    toolLogic[tool.name] = async ({ question }) => {
      console.info(`Tool ${tool.name} called:`, question);
      try {
        const response = await fetch(`/api/tools/${tool.tool_id}/use`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question })
        });
        if (!response.ok) throw new Error(`${tool.name} API request failed`);
        const data = await response.json();
        console.info(`${tool.name} results:`, data);
        return data;
      } catch (error) {
        console.error(`${tool.name} error:`, error);
        return { success: false, error: `Error communicating with ${tool.name} service` };
      }
    };

    return {
      type: "function",
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The question to ask"
          }
        },
        required: ["question"]
      }
    };
  });

  return {
    tools: pTools,
    toolLogic
  }
}