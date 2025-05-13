'use client';

import React, { Suspense, useState, useEffect, useRef } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App, { AppRef } from "./App";
import {  useParams } from "next/navigation";
import { AgentConfig, Tool, TranscriptItem } from "@/app/types";
import { AppProvider, useAppContext } from "@/app/contexts/AppContext";




function createAgentConfig(apiResult: any): AgentConfig {
  const toolLogic: Record<string, (args: any, transcriptLogsFiltered: TranscriptItem[]) => Promise<any> | any> = {};
  
  // Convert tools to full Tool objects and build toolLogic
  const fullTools: Tool[] = apiResult.tools.map((tool: any) => {
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
  const instructions = `
  現在開始，請扮演${apiResult.prompt_name}，以下是你的角色和更多詳細資料：
  ## 你的角色：${apiResult.prompt_name}
  ${apiResult.prompt_personas}
  ## 你的對談對象
  ${apiResult.prompt_customers}
  ## 你的工具
  ${apiResult.prompt_tool_logics}
  ## 你的聲音風格
  ${apiResult.prompt_voice_styles}
  ## 你的對話模式
  ${apiResult.prompt_conversation_modes}
  ## 你的禁止詞
  ${apiResult.prompt_prohibited_phrases}
  `;

  return {
    name: apiResult.name,
    publicDescription: apiResult.public_description,
    instructions,
    tools: fullTools,
    toolLogic,
  };
}



function ClassChatPage() {
  const params = useParams();
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const appRef = useRef<AppRef>(null);
  const [pageBackground] = useState("linear-gradient(135deg, rgb(26, 42, 52) 0%, rgb(46, 74, 63) 100%)");


  useEffect(() => {
    const fetchAgentConfig = async () => {
      try {
        const response = await fetch(`/api/agents/${params.id}`);
        if (!response.ok) {
          throw new Error('Agent not found');
        }
        const data = await response.json();
        console.log('fetchAgentConfig data', data);
        const agentConfig = createAgentConfig(data.agent);
        console.log('agentConfig', agentConfig);
        setAgentConfig(agentConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentConfig();
  }, [params.id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !agentConfig) {
    return <div>Error: {error || 'Agent not found'}</div>;
  }



  return (
    <EventProvider>
      <TranscriptProvider>
        <AppProvider>
          <div style={{ background: pageBackground }}>
            
            <div>
              <App ref={appRef} agentConfig={agentConfig}/>
            </div>
          </div>
        </AppProvider>
      </TranscriptProvider>
    </EventProvider>
  );
}

// Use a client-only component to avoid hydration errors
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClassChatPage />
    </Suspense>
  );
} 