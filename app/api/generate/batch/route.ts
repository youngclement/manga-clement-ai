import { NextRequest, NextResponse } from 'next/server';
import { generateMangaImage, generateNextPrompt } from '@/lib/services/gemini-service';
import { MangaConfig, GeneratedManga } from '@/lib/types';
import { generateId } from '@/lib/utils/id';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      config,
      sessionHistory = [],
      totalPages = 10
    } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Config is required' },
        { status: 400 }
      );
    }

    const results: GeneratedManga[] = [];
    let currentPrompt = prompt || 'Start an exciting manga story';
    const isAutoContinue = config.autoContinueStory && sessionHistory.length > 0;
    let currentSessionHistory = [...sessionHistory];

    for (let i = 0; i < totalPages; i++) {
      try {
        const pageNumber = sessionHistory.length + i + 1;
        if (isAutoContinue || i > 0 || !prompt?.trim()) {
          try {
            currentPrompt = await generateNextPrompt(
              currentSessionHistory,
              config.context || '',
              i === 0 && prompt?.trim() ? prompt : '',
              pageNumber,
              totalPages,
              config
            );
          } catch (error: any) {
            console.error(`Error generating prompt for page ${i + 1}:`, error);
            currentPrompt = currentPrompt || 'Continue the manga story naturally';
          }
        }
        const imageUrl = await generateMangaImage(
          currentPrompt,
          config,
          currentSessionHistory
        );
        const generatedManga: GeneratedManga = {
          id: generateId(),
          prompt: currentPrompt,
          imageUrl: imageUrl,
          timestamp: Date.now(),
          config: { ...config }
        };

        results.push(generatedManga);
        currentSessionHistory.push(generatedManga);
      } catch (error: any) {
        console.error(`Error generating page ${i + 1}:`, error);
        if (i === 0) {
          throw error;
        }
        break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        pages: results,
        totalGenerated: results.length,
        totalRequested: totalPages
      }
    });
  } catch (error: any) {
    console.error('Error in batch generation:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate batch',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
