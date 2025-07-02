import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const elasticUrl = process.env.NEXT_PUBLIC_ELASTIC_URL || 'https://voiss-1239sja.zeabur.app';
    const indexName = body.indexName || 'voiss-user-logs';
    
    // Remove indexName from body before forwarding
    const { indexName: _, ...eventData } = body;

    const response = await axios.post(
      `${elasticUrl}/${indexName}/_doc`,
      eventData,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error proxying to Elasticsearch:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.response?.status || 500 }
    );
  }
} 