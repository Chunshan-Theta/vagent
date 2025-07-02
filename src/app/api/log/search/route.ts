import { NextRequest, NextResponse } from 'next/server';
import { elasticService } from '../../db/elastic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      from = 0,
      size = 10,
      sort = { '@timestamp': 'desc' },
      query,
      // 支援額外的搜尋參數
      event_name,
      action_category,
      action_subtype,
      start_time,
      end_time,
      user_id,
      session_id
    } = body;

    // 構建搜尋條件
    const must: any[] = [];
    
    // 如果有提供 query，直接使用它
    if (query) {
      must.push(query);
    }

    // 根據提供的參數構建搜尋條件
    if (event_name) {
      must.push({ match: { event_name } });
    }

    if (action_category) {
      must.push({ match: { 'action.action_category': action_category } });
    }

    if (action_subtype) {
      must.push({ match: { 'action.action_subtype': action_subtype } });
    }

    if (start_time || end_time) {
      const range: any = { '@timestamp': {} };
      if (start_time) range['@timestamp'].gte = start_time;
      if (end_time) range['@timestamp'].lte = end_time;
      must.push({ range });
    }

    if (user_id) {
      must.push({ match: { 'user.user_id': user_id } });
    }

    if (session_id) {
      must.push({ match: { 'user.session_id': session_id } });
    }

    // 執行搜尋
    const searchQuery = {
      from,
      size,
      sort,
      query: must.length > 0 ? { bool: { must } } : { match_all: {} }
    };

    const result = await elasticService.searchEvents(searchQuery);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error searching logs:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 