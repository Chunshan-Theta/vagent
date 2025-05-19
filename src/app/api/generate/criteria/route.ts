import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, public_description, prompt_name, prompt_personas, prompt_customers, prompt_tool_logics } = body;

    const prompt = `Based on the following agent information, generate 4 specific evaluation criteria points that would be used to assess this agent's performance. Each point should be clear, measurable, and relevant to the agent's purpose.

Agent Name: ${name}
Description: ${public_description}
Agent Name: ${prompt_name}
Personas: ${prompt_personas}
Customers: ${prompt_customers}
Tool Logic: ${prompt_tool_logics}

Generate 4 criteria points in the following format:
1. [First criteria]
2. [Second criteria]
3. [Third criteria]
4. [Fourth criteria]

Output format Only return the criteria points, no other text.
`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    const criteria = completion.choices[0].message.content;

    return NextResponse.json({ criteria });
  } catch (error) {
    console.error('Error generating criteria:', error);
    return NextResponse.json(
      { error: 'Failed to generate criteria' },
      { status: 500 }
    );
  }
} 