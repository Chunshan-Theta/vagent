import { AgentConfig, Tool, TranscriptItem } from "@/app/types";

/**
 * This defines and adds "transferAgents" tool dynamically based on the specified downstreamAgents on each agent.
 */
export function injectTransferTools(agentDefs: AgentConfig[]): AgentConfig[] {
  // Iterate over each agent definition
  agentDefs.forEach((agentDef) => {
    const downstreamAgents = agentDef.downstreamAgents || [];

    // Only proceed if there are downstream agents
    if (downstreamAgents.length > 0) {
      // Build a list of downstream agents and their descriptions for the prompt
      const availableAgentsList = downstreamAgents
        .map(
          (dAgent) =>
            `- ${dAgent.name}: ${dAgent.publicDescription ?? "No description"}`
        )
        .join("\n");

      // Create the transfer_agent tool specific to this agent
      const transferAgentTool: Tool = {
        type: "function",
        name: "transferAgents",
        description: `Triggers a transfer of the user to a more specialized agent. 
  Calls escalate to a more specialized LLM agent or to a human agent, with additional context. 
  Only call this function if one of the available agents is appropriate. Don't transfer to your own agent type.
  
  Let the user know you're about to transfer them before doing so.
  
  Available Agents:
  ${availableAgentsList}
        `,
        parameters: {
          type: "object",
          properties: {
            rationale_for_transfer: {
              type: "string",
              description: "The reasoning why this transfer is needed.",
            },
            conversation_context: {
              type: "string",
              description:
                "Relevant context from the conversation that will help the recipient perform the correct action.",
            },
            destination_agent: {
              type: "string",
              description:
                "The more specialized destination_agent that should handle the user's intended request.",
              enum: downstreamAgents.map((dAgent) => dAgent.name),
            },
          },
          required: [
            "rationale_for_transfer",
            "conversation_context",
            "destination_agent",
          ],
        },
      };

      // Ensure the agent has a tools array
      if (!agentDef.tools) {
        agentDef.tools = [];
      }

      // Add the newly created tool to the current agent's tools
      agentDef.tools.push(transferAgentTool);
    }

    // so .stringify doesn't break with circular dependencies
    agentDef.downstreamAgents = agentDef.downstreamAgents?.map(
      ({ name, publicDescription }) => ({
        name,
        publicDescription,
      })
    );
  });

  return agentDefs;
}

function createAgentConfig({
  name,
  public_description,
  prompt_name,
  prompt_personas,
  prompt_customers,
  prompt_tool_logics,
  tools = [],
  prompt_voice_styles,
  prompt_conversation_modes,
  prompt_prohibited_phrases
}: {
  name: string;
  public_description: string;
  prompt_name: string;
  prompt_personas: string;
  prompt_customers: string;
  prompt_tool_logics: string;
  tools?: Array<{ name: string; description: string; id: string }>;
  prompt_voice_styles?: string;
  prompt_conversation_modes?: string;
  prompt_prohibited_phrases?: string;
}): AgentConfig {
  const toolLogic: Record<string, (args: any, transcriptLogsFiltered: TranscriptItem[]) => Promise<any> | any> = {};
  
  // Convert tools to full Tool objects and build toolLogic
  const fullTools: Tool[] = tools.map(tool => {
    // Add tool logic
    toolLogic[tool.name] = async ({ question }) => {
      console.info(`Tool ${tool.name} called:`, question);
      try {
        const response = await fetch(`/api/tools/${tool.id}/use`, {
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
  現在開始，請扮演${prompt_name}，以下是你的角色和更多詳細資料：
  ## 你的角色：${prompt_name}
  ${prompt_personas}
  ## 你的對談對象
  ${prompt_customers}
  ## 你的工具
  ${prompt_tool_logics}
  ## 你的聲音風格
  ${prompt_voice_styles}
  ## 你的對話模式
  ${prompt_conversation_modes}
  ## 你的禁止詞
  ${prompt_prohibited_phrases}
  `;

  return {
    name,
    publicDescription: public_description,
    instructions,
    tools: fullTools,
    toolLogic,
  };
}

