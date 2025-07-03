import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = `${process.env.N8N_HOST}/webhook/2a35500d-36b6-4bc0-b048-b41a4fc799da`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Forward the request to n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in auto-gen agent:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
} 