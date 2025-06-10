import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
if (!genAI) {
  throw new Error('Google Generative AI is not initialized');
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audioFile') as File;
    const prompt = `Please transcribe the audio and label the emotion of each sentence. label the emotion example: [Emotion: xxx]`;

    if (!audioFile) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    // Initialize the model with generation config
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3,  // 降低溫度使輸出更穩定
        maxOutputTokens: 2048,
      }
    });

    // Create audio part
    const audioPart = {
      data: Buffer.from(fileBytes).toString('base64'),
      mimeType: "audio/mpeg"  // Explicitly set for MP3 files
    };


    // Generate content
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: audioPart }
    ]);

    const response = await result.response;
    const text = response.text();

    // Split the text into lines and process each line
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    const emotions = [];
    let currentEmotion = '';
    
    for (const line of lines) {
      // Check if this line contains an emotion tag
      const emotionMatch = line.match(/\((.*?)\)|\[Emotion:\s*(.*?)\]/);
      
      if (emotionMatch) {
        // This is an emotion line or line with emotion tag
        const emotion = (emotionMatch[1] || emotionMatch[2]).trim();
        const sentence = line.replace(/\s*\([^)]*\)|\s*\[Emotion:[^\]]*\]/, '').trim();
        
        if (sentence) {
          // Emotion tag is in the same line as the sentence
          emotions.push({
            sentence,
            emotion
          });
        } else {
          // Standalone emotion tag
          currentEmotion = emotion;
        }
      } else {
        // This is a sentence line
        if (currentEmotion) {
          emotions.push({
            sentence: line,
            emotion: currentEmotion
          });
          currentEmotion = '';
        } else {
          emotions.push({
            sentence: line,
            emotion: '未標記'  // or any default emotion you want to use
          });
        }
      }
    }

    // Combine all sentences for transcription
    const transcriptionSection = emotions
      .map(e => e.sentence)
      .join('\n');

    return NextResponse.json({
      result: text,
      analysis: {
        transcription: transcriptionSection,
        emotions,
      }
    });
  } catch (error: any) {
    console.error('Error in Gemini API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process with Gemini' },
      { status: 500 }
    );
  }
} 