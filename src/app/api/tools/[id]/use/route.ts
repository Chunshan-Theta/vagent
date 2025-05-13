import { NextResponse } from 'next/server';
import { getToolConfig } from '@/db';


const tool_call_ragflow = async (toolConfig: any, question: string) => {
    const apiUrl = toolConfig.api_url;
    const agentId = toolConfig.agent_id;
    const apiKey = toolConfig.api_key;
    const sessionId = toolConfig.session_id;

    if (!apiUrl || !agentId || !apiKey || !sessionId) {
      throw new Error('Missing required tool configuration');
    }
    const body = {
        question,
        stream: false,
        session_id: sessionId
    }
    const url = `${apiUrl}/agents/${agentId}/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Tool API request failed');
    }
    console.log(`tool.request.url: ${url}`);
    console.log(`tool.request.body: ${JSON.stringify(body)}`);
    console.log(`tool.request.response: ${JSON.stringify(response)}`);

    const data = await response.json();
    return NextResponse.json({ success: true, response: data.response, data: data });
}

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const { question } = await request.json();
    const toolId = params.id;
    
    if (!toolId) {
      return NextResponse.json(
        { success: false, error: 'toolId is required' },
        { status: 400 }
      );
    }

    const toolConfig = await getToolConfig(toolId);
    if (!toolConfig) {
      return NextResponse.json(
        { success: false, error: `Tool configuration not found. Please check the tool ID: ${toolId}` },
        { status: 404 }
      );
    }

    switch (toolConfig.tool_type) {
        case "ragflow":
            return await tool_call_ragflow(toolConfig, question);
        default:
            return NextResponse.json(
                { success: false, error: `Unsupported tool type: ${toolConfig.tool_type}` },
                { status: 500 }
            );
    }
  } catch (error) {
    console.error('Tool service error:', error);
    return NextResponse.json(
      { success: false, error: `Error communicating with tool service: ${error}` },
      { status: 500 }
    );
  }
} 