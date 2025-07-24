import * as convApi from '@/db/api/conv';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: AsyncRouteContext<{ convId: string, analysisName: string }>) {
  try {
    const body = await req.json();
    const { convId, analysisName } = await params;
    const message = await convApi.setConvAnalysis(convId, analysisName, '', body);
    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error adding conv message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: AsyncRouteContext<{ convId: string, analysisName: string }>) {
  try {
    const { convId, analysisName } = await params;
    const analysis = await convApi.getConvAnalysis(convId, analysisName);
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error getting conv analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}