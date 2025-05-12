import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { question } = await request.json();
    
    const apiUrl = process.env.RAGFLOW_API_URL;
    const agentId = process.env.RAGFLOW_AGENT_ID;
    const apiKey = process.env.RAGFLOW_API_KEY;
    const sessionId = process.env.RAGFLOW_SESSION_ID;

    if (!apiUrl || !agentId || !apiKey || !sessionId) {
      throw new Error('Missing required environment variables');
    }

    const response = await fetch(`${apiUrl}/agents/${agentId}/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        question,
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
      { success: false, error: "Error communicating with RAG service" },
      { status: 500 }
    );
  }
} 