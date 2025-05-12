import { NextResponse } from 'next/server';
import { getToolConfig } from '@/db';

export async function POST(request: Request) {
  try {
    const { question, toolId } = await request.json();
    
    if (!toolId) {
      return NextResponse.json(
        { success: false, error: 'toolId is required' },
        { status: 400 }
      );
    }

    const toolConfig = await getToolConfig(toolId);
    if (!toolConfig) {
      return NextResponse.json(
        { success: false, error: 'Tool configuration not found' },
        { status: 404 }
      );
    }

    const apiUrl = toolConfig.api_url || "https://ragflow.lazyinwork.com/api/v1";
    const agentId = toolConfig.agent_id;
    const apiKey = toolConfig.api_key;
    const sessionId = toolConfig.session_id;

    if (!apiUrl || !agentId || !apiKey || !sessionId) {
      throw new Error('Missing required tool configuration');
    }

    const response = await fetch(`${apiUrl}/agents/${agentId}/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        question,
        tool_id: toolId,
        stream: false,
        session_id: sessionId
      })
    });

    if (!response.ok) {
      throw new Error('RAG API request failed');
    }

    const data = await response.json();
    return NextResponse.json({ success: true, response: data.response });
  } catch (error) {
    console.error('RAG service error:', error);
    return NextResponse.json(
      { success: false, error: `Error communicating with RAG service: ${error}` },
      { status: 500 }
    );
  }
} 