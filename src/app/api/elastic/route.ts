import { NextRequest, NextResponse } from 'next/server';
import { ElasticService } from '@/lib/elastic-service';

const elasticService = new ElasticService(
  process.env.NEXT_PUBLIC_ELASTIC_URL || 'https://voiss-1239sja.zeabur.app',
  'voiss-user-logs'  // Use the correct index name
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await elasticService.searchEvents(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Elasticsearch query error:', error);
    return NextResponse.json(
      { error: 'Failed to query Elasticsearch', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 