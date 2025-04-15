import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AnalysisRequest {
  message: string;
  rubric: {
    criteria: string[];
    weights?: number[];
  };
}

export interface AnalysisResponse {
  scores: {
    criterion: string;
    score: number;
    explanation: string;
  }[];
  overallScore: number;
  feedback: string;
}

export async function POST(request: Request) {
  try {
    const body: AnalysisRequest = await request.json();
    const { message, rubric } = body;

    if (!message || !rubric || !rubric.criteria) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `Analyze the following message according to these criteria: ${rubric.criteria.join(', ')}.
    For each criterion, provide:
    1. A score from 1-10
    2. A brief explanation of the score
    3. Specific examples from the text that support your evaluation

    Message to analyze: "${message}"

    Respond in JSON format with the following structure:
    {
      "scores": [
        {
          "criterion": "criterion name",
          "score": number,
          "explanation": "explanation"
        }
      ],
      "overallScore": number,
      "feedback": "overall feedback"
    }`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    // Apply weights if provided
    if (rubric.weights && rubric.weights.length === rubric.criteria.length) {
      let weightedScore = 0;
      let totalWeight = 0;
      
      analysis.scores.forEach((score: any, index: number) => {
        weightedScore += score.score * rubric.weights![index];
        totalWeight += rubric.weights![index];
      });
      
      analysis.overallScore = totalWeight > 0 ? weightedScore / totalWeight : analysis.overallScore;
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing conversation:', error);
    return NextResponse.json(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    );
  }
} 