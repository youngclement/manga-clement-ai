import { NextRequest, NextResponse } from 'next/server';
import { generateMangaImage, generateNextPrompt } from '@/lib/services/gemini-service';
import { MangaConfig, GeneratedManga } from '@/lib/types';
import { generateId } from '@/lib/utils/id';
import { validateRequest, generateRequestSchema } from '@/lib/utils/validation';
const MAX_BODY_SIZE = 10 * 1024 * 1024;
export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large. Maximum size is 10MB.' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const validated = validateRequest(generateRequestSchema, body);
    const {
      prompt,
      config,
      sessionHistory = [],
      isAutoContinue = false
    } = validated;

    const pageNumber = sessionHistory.length + 1;
    const totalPages = 1;
    let finalPrompt = prompt;
    if (isAutoContinue || !prompt?.trim()) {
      try {
        finalPrompt = await generateNextPrompt(
          sessionHistory,
          config.context || '',
          prompt || '',
          pageNumber,
          totalPages,
          config
        );
      } catch (error: any) {
        console.error('Error generating prompt:', error);
        finalPrompt = prompt || 'Continue the manga story naturally';
      }
    }
    const imageUrl = await generateMangaImage(
      finalPrompt,
      config,
      sessionHistory
    );
    const generatedManga: GeneratedManga = {
      id: generateId(),
      prompt: finalPrompt,
      imageUrl: imageUrl,
      timestamp: Date.now(),
      config: { ...config }
    };

    return NextResponse.json({
      success: true,
      data: {
        page: generatedManga,
        prompt: finalPrompt,
        imageUrl: imageUrl
      }
    });
  } catch (error: any) {
    console.error('Error generating manga:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate manga',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
