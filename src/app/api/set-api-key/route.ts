import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Create .env file content
    const envContent = `OPENAI_API_KEY=${apiKey}`;
    
    // Write to .env file
    fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);

    return NextResponse.json({ message: 'API key saved successfully' });
  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 });
  }
} 