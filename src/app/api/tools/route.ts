import { NextResponse } from 'next/server';
import { createTool, getToolConfig, updateToolConfig } from '@/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tool_id, name, api_url, api_key, agent_id, session_id } = body;

    if (!tool_id || !name) {
      return NextResponse.json(
        { error: 'tool_id and name are required' },
        { status: 400 }
      );
    }

    const tool = await createTool(tool_id, name, {
      api_url,
      api_key,
      agent_id,
      session_id
    });

    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { error: `Failed to create tool: ${error}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('tool_id');

    if (!toolId) {
      return NextResponse.json(
        { error: 'tool_id is required' },
        { status: 400 }
      );
    }

    const tool = await getToolConfig(toolId);
    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error getting tool:', error);
    return NextResponse.json(
      { error: 'Failed to get tool' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { tool_id, ...updates } = body;

    if (!tool_id) {
      return NextResponse.json(
        { error: 'tool_id is required' },
        { status: 400 }
      );
    }

    const tool = await updateToolConfig(tool_id, updates);
    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error updating tool:', error);
    return NextResponse.json(
      { error: 'Failed to update tool' },
      { status: 500 }
    );
  }
} 