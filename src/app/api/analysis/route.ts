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
      languageInstruction = "請用台灣繁體中文回答分析結果。";
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
    3. Specific examples from the user's text (not from the assistant and rubric) that support your scoring and reasoning.
    4. 2-3 specific improvement tips for this criterion
    5. A concise summary of the overall conversation (2-3 sentences)
    6. 3-5 overall improvement tips for the entire conversation

    Important Note: 
      1. All analysis should be based on the "user's text" (ignore the assistant's text), with the main focus being on analyzing the user's performance in the current conversation.
      2. Do not include the assistant's text in your analysis and examples. if there are no good examples in the user's text, just say "No relevant examples found" and give a low score.

    Analysis should be based on the following concepts:
    ## 🧠 Rogers Dialogue Analysis 
    analyze the following dialogue using the principles of Carl Rogers’ communication method. 
    Go through each step carefully and provide a thoughtful, empathy-centered evaluation.

    ### 1. Read and Understand the Full Dialogue
    - Carefully read the entire conversation.
    - Identify the context and the main topic(s) being discussed.

    ### 2. Identify Each Person’s Core Perspectives
    - Summarize the main ideas, beliefs, and emotions expressed by each participant.
    - What are their underlying concerns or motivations?

    ### 3. Look for Common Ground or Potential Consensus
    - Are there any shared goals, values, or perspectives between the participants?
    - Highlight any implicit agreements or aligned interests.

    ### 4. Analyze Expressions of Understanding and Acknowledgment
    - Did each person show understanding or acknowledgment of the other’s point of view?
    - Even if they disagree, did they demonstrate empathy or emotional awareness in their language?

    ### 5. Examine How the Issue Was Framed
    - How was the topic or conflict introduced and discussed?
    - Was it framed neutrally, or did it carry bias, blame, or adversarial tones?
    - Suggest how the issue could be reframed more constructively if needed.

    ### 6. Evaluate Willingness to Collaborate
    - Was there a genuine effort to find a mutual solution or to deepen understanding?
    - Did participants express openness to different perspectives or compromise?

    ### 7. Summarize Key Insights
    - Provide a concise summary of each person's views, level of mutual understanding, and any areas of agreement.
    - Assess how well the dialogue aligns with Rogers’ principles of empathy, authenticity, and respect.

    ### 8. Offer Suggestions for Improvement
    - Based on the analysis, suggest specific ways to enhance the dialogue.
    - Focus on promoting empathy, mutual understanding, and collaborative problem-solving (e.g., use of reflective listening, asking clarifying questions, avoiding judgmental language).


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
      "summary": "concise summary of the user's behavior or performance",
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