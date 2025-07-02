import { NextRequest, NextResponse } from 'next/server';
import { elasticService } from '../db/elastic';
import { UserBehaviorEvent } from '@/lib/elastic-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      '@timestamp': timestamp = new Date().toISOString(),
      event_name,
      event_id,
      user,
      client_device,
      event_situation,
      action,
      message = {
        error: false,
        content: '',
        code: 200
      }
    } = body as UserBehaviorEvent;

    // Validate required fields
    if (!event_name) {
      return NextResponse.json(
        { error: 'Missing required field: event_name' },
        { status: 400 }
      );
    }

    if (!user || !client_device || !event_situation) {
      return NextResponse.json(
        { error: 'Missing required context fields: user, client_device, event_situation' },
        { status: 400 }
      );
    }

    if (!action || !action.action_category || !action.action_subtype) {
      return NextResponse.json(
        { error: 'Missing required action fields: action_category, action_subtype' },
        { status: 400 }
      );
    }

    const eventData = {
      '@timestamp': timestamp,
      event_name,
      event_id,
      user,
      client_device,
      event_situation,
      action,
      message
    };

    const result = await elasticService.insertEvent(eventData);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error adding log:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 