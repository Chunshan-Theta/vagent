import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { chatCompletion, AskRequest } from '@/app/s-lib/ai-analysis'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AnalysisRequest {
  role?: string;
  message: string;
  context?: string;
  rubric: {
    criteria: string[] | string;
    weights?: number[];
  };
  detectedLanguage?: string;
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
    const { message, rubric, detectedLanguage="zh", role, context } = body;

    if (!message || !rubric || !rubric.criteria) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    if (Array.isArray(rubric.criteria)) {
      rubric.criteria = rubric.criteria.join(', ');
    } else {
      rubric.criteria = rubric.criteria;
    }

    const roleName = role || 'user'
    const roleDesc1 =  roleName === 'user' ? '分析對象為 user。' : `分析對象為 user 且其扮演角色為 ${roleName}。`;
    const roleDesc2 =  roleName === 'user' ? '分析對象為 user，而不是其他角色' : `分析對象為 user ，user 在對話中扮演的角色為 ${roleName}，其他角色僅為對話情境參考。`;

    let languageInstruction = "";
    if (detectedLanguage === "zh" || detectedLanguage === "zh-TW") {
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

    const prompt = `
# 任務目標
根據這些標準(criteria)分析以下訊息：
對於每個標準(criteria)，請提供：
1. 1-100 分（100 分代表滿分，1 分代表最低分）
2. 關於給分的簡要原因說明，必須針對user的文字（而不是來自assistant和criteria）。
3. examples要引用來自user的文字（而不是來自 assistant 和 criteria ）來作為具體例子，支援您的評分和推理。
4. 針對此標準提出2-3個具體的改進建議，改進建議要包含引導例句。
5. 簡單概括整個對話（2-3 句）
6. 3-5條針對整個對話的整體改進建議，改進建議要包含引導例句。
7. ${roleDesc1}

# 重要提示：
1. 一切分析都應該以「user的文本」為基礎（忽略assistant的文字），主要著重分析使用者在當前對話中的表現。
2. examples中只包含user的文字。如果user的文字中沒有好的例子，就說「沒有找到相關的例子」並給出低分。
3. 所有內容都會使用繁體中文撰寫
4. 在建議與分析時，必須參照並引用 user 説的相關內容。
5. 若有提供建議，要加上具體的對話範例句子，讓內容更實用不籠統。
6. 分析應基於以下概念（以下概念是對話歷程之理解與思考分析的步驟，用來協助分析使用者內容，並不是criteria）：
  ## 羅傑斯對話分析
  運用卡爾羅傑斯溝通方法的原則分析以下對話。
  仔細執行每個步驟並提供深思熟慮的、以同理心為中心的評估。

  ### a. 閱讀並瞭解完整的對話
  - 仔細閱讀整個對話。
  - 確定背景和正在討論的主要主題。

  ### b. 確定每個人的核心觀點
  - 總結每個參與者表達的主要想法、信念和情感。
  - 他們潛在的擔憂或動機是什麼？

  ### c. 尋找共同點或潛在共識
  - 參與者之間是否有共同的目標、價值觀或觀點？
  - 強調任何隱含的協議或一致的利益。

  ### d. 分析理解與認同的表達
  - 每個人是否都理解或認同對方的觀點？
  - 即使他們不同意，他們是否在語言中表現出同理心或情感意識？

  ### e. 檢視問題是如何被提出的
  - 該主題或衝突是如何被引入和討論的？
  - 它是中立的嗎？還是帶有偏見、責備或對抗的語氣？
  - 如果需要，建議如何更有建設性地重新闡述這個問題。

  ### f.評估合作意願
  - 是否真誠地努力尋求共同的解決方案或加深理解？
  - 參與者是否對不同觀點表示開放或妥協？

  ### g. 總結關鍵見解
  - 簡要總結每個人的觀點、相互理解的程度以及任何一致的領域。
  - 評估對話與羅傑斯的同理心、真實性和尊重原則的契合程度。

  ### h. 提出改進建議
  - 根據分析，提出加強對話的具體方法。
  - 專注於促進同理心、相互理解和協作解決問題（例如，使用反思性傾聽、提出澄清問題、避免使用評判性語言）。

# criteria:
\`\`\`
${rubric.criteria}
\`\`\`

# context:
${context || 'reference 內包含了 user 和 assistant 的對話紀錄，請根據這些對話紀錄來補充內容。'}

# 需要分析的訊息紀錄：
\`\`\`
${message}
\`\`\`

# ${languageInstruction}

請針對上述訊息紀錄進行分析，且${roleDesc2}

# 以 JSON 格式回應，結構如下：
{
  "scores": [
    {
      "criterion": "criterion name",
      "score": number,
      "explanation": "explanation",
      "examples": ["user: example 1", "user: example 2"],
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

    console.log('usage', completion.usage)

    const analysis = JSON.parse(completion.choices[0].message.content || '{}') as AnalysisResponse;
    
    // Add the detected language to the response
    analysis.language = langAlias(detectedLanguage);

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

    // 嘗試用 report-v1/reference 任務來生成更完整的內容
    const generate = async (key: keyof typeof analysis)=>{
      const content = analysis[key] || '';
      if (!content) return '';
      console.log('run report-v1/reference for', key);
      const res = await chatCompletion({
        missionId: 'report-v1/reference',
        params: {
          context: context || '',
          content: analysis[key] || '',
          reference: `對話紀錄:\n"""${message}"""\n`,
          instruction: '請根據 context 和 reference 內的對話紀錄，補充 content 生成一個更完整的內容。\n針對合適的段落使用對話紀錄中的內容來補充，如果沒有合適的段落，則不需要補充。',
        },
        responseType: 'json_schema'
      })
      return res.json?.output || ''
    }

    // const old = {
    //   feedback: analysis.feedback || '',
    //   summary: analysis.summary || ''
    // };
    // console.log('original analysis', old);

    await Promise.all([
      generate('feedback').then((feedback) => (analysis.feedback = feedback)),
      generate('summary').then((summary) => (analysis.summary = summary)),
    ]).then(([feedback, summary])=>{
      // console.log('new analysis', {
      //   feedback: feedback || '',
      //   summary: summary || ''
      // })
    }).catch((err)=>{
      console.error('Error generating additional content:', err);
    })

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing conversation:', error);
    return NextResponse.json(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    );
  }
} 


function langAlias(source: string){
  source = source.toLowerCase().trim();
  const map:{[lang:string]:string} = {
    'zh-tw': 'zh'
  }
  return map[source] || source;
}