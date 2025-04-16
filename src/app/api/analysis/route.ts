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
    examples: string[];
    improvementTips: string[];
  }[];
  overallScore: number;
  feedback: string;
  summary: string;
  overallImprovementTips: string[];
  language: string;
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

    // Detect the language of the conversation
    // const languageDetectionPrompt = `Detect the primary language of the following text. Respond with only the language code (e.g., "en", "zh", "ja", "ko", "es", "fr", "de"). If you're unsure, respond with "en".

    // Text: "${message.substring(0, 500)}..."`;

    // const languageDetection = await openai.chat.completions.create({
    //   messages: [{ role: "user", content: languageDetectionPrompt }],
    //   model: "gpt-4-turbo-preview",
    //   response_format: { type: "text" },
    // });

    // const detectedLanguage = languageDetection.choices[0].message.content?.trim() || "en";
    const detectedLanguage = "zh";
    
    // Create language-specific instructions
    let languageInstruction = "";
    if (detectedLanguage === "zh") {
      languageInstruction = "請用中文回答分析結果。";
    } else if (detectedLanguage === "ja") {
      languageInstruction = "分析結果を日本語で回答してください。";
    } else if (detectedLanguage === "ko") {
      languageInstruction = "분석 결과를 한국어로 답변해 주세요.";
    } else if (detectedLanguage === "es") {
      languageInstruction = "Responda el resultado del análisis en español.";
    } else if (detectedLanguage === "fr") {
      languageInstruction = "Répondez au résultat de l'analyse en français.";
    } else if (detectedLanguage === "de") {
      languageInstruction = "Beantworten Sie das Analyseergebnis auf Deutsch.";
    } else {
      languageInstruction = "Respond in English.";
    }

    const prompt = `Analyze the following message according to these criteria: ${rubric.criteria.join(', ')}.
    For each criterion, provide:
    1. A score from 1-100 (where 100 is perfect and 1 is the lowest)
    2. A brief explanation of the score
    3. Specific examples from the text that support your evaluation
    4. 2-3 specific improvement tips for this criterion

    Also provide:
    5. A concise summary of the overall conversation (2-3 sentences)
    6. 3-5 overall improvement tips for the entire conversation

    ${languageInstruction}

    Message to analyze: "${message}"

    Respond in JSON format with the following structure:
    {
      "scores": [
        {
          "criterion": "criterion name",
          "score": number,
          "explanation": "explanation",
          "examples": ["example 1", "example 2"],
          "improvementTips": ["tip 1", "tip 2"]
        }
      ],
      "overallScore": number,
      "feedback": "overall feedback",
      "summary": "concise summary of the conversation",
      "overallImprovementTips": ["tip 1", "tip 2", "tip 3"]
    }`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Add the detected language to the response
    analysis.language = detectedLanguage;

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