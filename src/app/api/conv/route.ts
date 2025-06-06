import * as convApi from '@/db/api/conv';

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Parse the request body if needed
    const body = await req.json();

    const conv = await convApi.createConv({
      // uid: body.uid,
      email: body.email || null,
      uname: body.uname || null,
      agentType: body.agentType,
      agentId: body.agentId,
    })
    return NextResponse.json(conv.toJSON());
  } catch (error: any) {
    console.error('Error creating conv:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
