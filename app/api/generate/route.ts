import { NextRequest, NextResponse } from 'next/server';
import { generateMangaImage, generateNextPrompt } from '@/lib/services/gemini-service';
import { MangaConfig, GeneratedManga } from '@/lib/types';

// POST - Generate single page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      config,
      sessionHistory = [],
      isAutoContinue = false
    } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Config is required' },
        { status: 400 }
      );
    }

    const pageNumber = sessionHistory.length + 1;
    const totalPages = 1; // Single page generation

    // Generate prompt if auto-continue or no prompt provided
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
        // Fallback to default prompt
        finalPrompt = prompt || 'Continue the manga story naturally';
      }
    }

    // Generate image
    const imageUrl = await generateMangaImage(
      finalPrompt,
      config,
      sessionHistory
    );

    // Create generated manga object
    const generatedManga: GeneratedManga = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
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

