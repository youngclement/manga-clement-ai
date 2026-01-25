import { NextRequest, NextResponse } from 'next/server';
import { generateMangaImage, generateNextPrompt } from '@/lib/services/gemini-service';
import { MangaConfig, GeneratedManga } from '@/lib/types';

// POST - Generate multiple pages (batch)
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
        
        // Generate prompt if auto-continue or not first page or no prompt
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
            // Fallback
            currentPrompt = currentPrompt || 'Continue the manga story naturally';
          }
        }

        // Generate image
        const imageUrl = await generateMangaImage(
          currentPrompt,
          config,
          currentSessionHistory
        );

        // Create generated manga object
        const generatedManga: GeneratedManga = {
          id: Date.now().toString() + Math.random().toString(36).substring(2),
          prompt: currentPrompt,
          imageUrl: imageUrl,
          timestamp: Date.now(),
          config: { ...config }
        };

        results.push(generatedManga);
        currentSessionHistory.push(generatedManga);
      } catch (error: any) {
        console.error(`Error generating page ${i + 1}:`, error);
        // Continue with next page instead of failing completely
        if (i === 0) {
          // If first page fails, return error
          throw error;
        }
        break; // Stop batch on error after first page
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

