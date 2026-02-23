import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

function getApiKey(): string {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing API_KEY or GEMINI_API_KEY environment variable');
  }
  return apiKey;
}

const TEXT_GENERATION_MODEL = 'gemini-2.5-flash';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      context,
      panelDescription,
      panelNumber,
      totalPanels,
    } = body;

    if (!context && !panelDescription) {
      return NextResponse.json(
        { error: 'Context or panel description is required' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const systemPrompt = `You are an expert manga/manhwa story writer and visual prompt engineer. 
Your task is to generate detailed, vivid, and visually descriptive prompts for manga panels that can be used with AI image generation.

GUIDELINES for generating panel prompts:
1. Be SPECIFIC about character appearances, expressions, poses, and actions
2. Include setting/background details
3. Describe the mood, lighting, and atmosphere
4. Use cinematic composition terms when appropriate (close-up, wide shot, dramatic angle, etc.)
5. Keep prompts focused on visual elements that can be drawn
6. Avoid abstract concepts - describe what the reader will SEE
7. Include dialogue hints if needed (e.g., "character speaking with determination")
8. Consider panel composition and flow

OUTPUT FORMAT:
Return ONLY the panel prompt text, nothing else. No explanations, no meta-commentary.
The prompt should be 2-4 sentences, detailed but concise.`;

    const userPrompt = `
Story Context:
${context}

Panel Number: ${panelNumber} of ${totalPanels}
Panel Description: ${panelDescription || 'No specific description provided'}

Generate a detailed visual prompt for this manga panel that:
1. Continues naturally from the previous panels (if any)
2. Captures the essence of the panel description
3. Is suitable for AI image generation
4. Maintains character consistency with the story context

Remember: Output ONLY the panel prompt, nothing else.`;

    const response = await ai.models.generateContent({
      model: TEXT_GENERATION_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
        maxOutputTokens: 500,
      },
    });

    const suggestion = response.text?.trim() || '';

    if (!suggestion) {
      throw new Error('Failed to generate suggestion');
    }

    return NextResponse.json({
      success: true,
      data: {
        suggestion,
        panelNumber,
      }
    });
  } catch (error: any) {
    console.error('Error generating story outline:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate story outline',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
