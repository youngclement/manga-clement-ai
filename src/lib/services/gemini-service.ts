import { GoogleGenAI } from "@google/genai";
import { MANGA_SYSTEM_INSTRUCTION, LAYOUT_PROMPTS } from "@/lib/constants";
import { MangaConfig, GeneratedManga } from "@/lib/types";
import { cleanUserPrompt, isUserProvidedPrompt, extractUserIntent } from "@/lib/utils/prompt-utils";
import { loadProjectImages } from "@/lib/services/storage-service";
import { delay } from "@/lib/utils/common";

function isOverloadedError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || error.toString?.() || '').toString();
  return (
    error.code === 503 ||
    error.status === 'UNAVAILABLE' ||
    msg.includes('The model is overloaded') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('503')
  );
}

import { requireEnv } from '@/lib/utils/env';

function getApiKey(): string {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing API_KEY or GEMINI_API_KEY environment variable');
  }
  return apiKey;
}

async function resolveImagesToBase64(
  sources: (string | undefined | null)[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  const valid = (sources || []).filter(
    (s): s is string => !!s && typeof s === "string",
  );

  if (valid.length === 0) return result;

  const nonBase64: string[] = [];
  for (const src of valid) {
    if (src.startsWith("data:image/")) {
      result[src] = src;
    } else {
      nonBase64.push(src);
    }
  }

  if (nonBase64.length > 0) {
    try {
      const images = await loadProjectImages(nonBase64);
      for (const key of Object.keys(images)) {
        const value = images[key];
        if (typeof value === "string" && value.length > 0) {
          result[key] = value;
        }
      }
    } catch (err) {
    }
  }

  return result;
}

const TEXT_GENERATION_MODEL = 'gemini-2.5-flash';
const IMAGE_GENERATION_MODEL = 'gemini-2.5-flash-image';

export const generateNextPrompt = async (
  sessionHistory: GeneratedManga[],
  context: string,
  originalPrompt: string,
  pageNumber: number,
  totalPages: number,
  config?: MangaConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  let previousPagesInfo = '';
  const recentPages = sessionHistory.slice(-10);
  const lastPage = sessionHistory[sessionHistory.length - 1];

  const allPreviousPrompts = sessionHistory.map(p => p.prompt).filter(p => p && p.trim());
  const recentPrompts = recentPages.map(p => p.prompt).filter(p => p && p.trim());

  if (recentPages.length > 0) {
    previousPagesInfo += `\n⚠️ CRITICAL - MOST RECENT PAGE (Page ${sessionHistory.length}):\n`;
    previousPagesInfo += `"${lastPage.prompt}"\n`;
    previousPagesInfo += `\nThis is the page you MUST continue from. Your new page (Page ${pageNumber}) should continue IMMEDIATELY after what happened in Page ${sessionHistory.length}.\n`;

    if (recentPages.length > 1) {
      previousPagesInfo += `\n📚 ADDITIONAL CONTEXT - Recent pages for story flow:\n`;
      recentPages.slice(0, -1).forEach((page, idx) => {
        const pageNum = sessionHistory.length - recentPages.length + idx + 1;
        previousPagesInfo += `\nPage ${pageNum}: ${page.prompt}\n`;
  });
    }
  }

  let promptUniquenessNote = '';
  if (allPreviousPrompts.length > 0) {
    promptUniquenessNote = `\n🚫 CRITICAL - PROMPT UNIQUENESS REQUIREMENT:
⚠️⚠️⚠️ YOUR NEW PROMPT MUST BE COMPLETELY DIFFERENT FROM ALL PREVIOUS PROMPTS IN THIS SESSION ⚠️⚠️⚠️

PREVIOUS PROMPTS USED IN THIS SESSION (DO NOT REPEAT OR SIMILAR):
${allPreviousPrompts.map((p, idx) => `${idx + 1}. "${p}"`).join('\n')}

REQUIREMENTS:
✓ Your new prompt must describe a DIFFERENT scene, action, or moment
✓ DO NOT reuse similar wording, phrases, or descriptions from previous prompts
✓ DO NOT describe the same type of action or event
✓ DO NOT use similar character actions or situations
✓ Create a UNIQUE prompt that advances the story in a NEW direction
✓ If previous prompts mentioned "fight", "run", "talk" - use DIFFERENT actions
✓ If previous prompts had similar settings - use a DIFFERENT location or context
✓ Be creative and ensure your prompt is DISTINCT from all previous ones

VERIFICATION:
Before finalizing your prompt, check:
- Is this prompt similar to any previous prompt? → If yes, CHANGE IT
- Does this use similar words/phrases? → If yes, REPHRASE IT
- Does this describe a similar scene? → If yes, CREATE A DIFFERENT SCENE
- Is this too similar to the last prompt? → If yes, MAKE IT MORE DISTINCT

Your prompt must be UNIQUE and DIFFERENT from all ${allPreviousPrompts.length} previous prompt(s)!\n`;
  }

  const layout = config?.layout || (sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1].config?.layout : undefined);
  const layoutInfo = layout ? LAYOUT_PROMPTS[layout] || layout : '';

  let panelCountRequirement = '';
  if (layout) {
    if (layout === 'Single Panel') {
      panelCountRequirement = 'EXACTLY ONE PANEL ONLY - NO MULTIPLE PANELS - FORCE SINGLE PANEL';
    } else if (layout === 'Dramatic Spread' || layout === 'Widescreen Cinematic') {
      panelCountRequirement = 'SINGLE PANEL or minimal panels';
    } else if (layout === 'Dynamic Freestyle' || layout === 'Asymmetric Mixed') {
      panelCountRequirement = '5-8 PANELS with varied sizes';
    } else if (layout.includes('Action Sequence')) {
      panelCountRequirement = '5-7 ACTION PANELS';
    } else if (layout.includes('Conversation')) {
      panelCountRequirement = '4-6 HORIZONTAL PANELS';
    } else if (layout === 'Z-Pattern Flow') {
      panelCountRequirement = '5-6 PANELS in Z-pattern';
    } else if (layout === 'Vertical Strip') {
      panelCountRequirement = '3-5 WIDE HORIZONTAL PANELS';
    } else if (layout === 'Climax Focus') {
      panelCountRequirement = 'ONE DOMINANT PANEL + 4-5 SMALLER PANELS';
    } else if (layout.includes('Double')) {
      panelCountRequirement = 'TWO PANELS';
    } else if (layout.includes('Triple')) {
      panelCountRequirement = 'THREE PANELS';
    } else {
      panelCountRequirement = 'FOUR PANELS';
    }
  }

  const storyDirectionNote = config?.storyDirection && config.storyDirection.trim()
    ? `\n📖 STORY FLOW DIRECTION (Follow this overall direction):
${config.storyDirection.trim()}

⚠️ IMPORTANT: Use this story direction as a guide for the overall narrative flow. When generating pages, ensure the story progresses according to this direction while maintaining natural storytelling and continuity from previous pages.
`
    : '';

  const promptGenerationRequest = `You are a professional manga story writer. Your task is to generate the NEXT scene prompt for a manga page.

CONTEXT:
${context}

ORIGINAL STORY DIRECTION (for reference):
${originalPrompt}
${storyDirectionNote}
${previousPagesInfo ? `PREVIOUS PAGES:
${previousPagesInfo}` : ''}
${promptUniquenessNote}

${layout ? `📐 LAYOUT CONTEXT:
The previous pages used "${layout}" layout with ${panelCountRequirement}.
${layout === 'Single Panel' ? '⚠️ CRITICAL: This page MUST use SINGLE PANEL layout - EXACTLY ONE PANEL ONLY - NO MULTIPLE PANELS' : 'You can suggest a scene that works with various layouts - layout variety adds visual interest to manga.'}
${layoutInfo ? `Previous layout details: ${layoutInfo}` : ''}

` : ''}CURRENT STATUS:
- You are creating the prompt for PAGE ${pageNumber} of ${totalPages}
- ${sessionHistory.length > 0 ? `This page MUST continue DIRECTLY from Page ${sessionHistory.length} (the most recent page)` : 'This is the first page of the story'}
- ${layout === 'Single Panel' ? '⚠️ CRITICAL: This page MUST use SINGLE PANEL layout - EXACTLY ONE PANEL ONLY' : 'Layout can vary between pages - focus on the story, not matching previous layout exactly'}

YOUR TASK:
${sessionHistory.length > 0 ? `⚠️ CRITICAL: Analyze what happened in Page ${sessionHistory.length} (the MOST RECENT page) and write a prompt for what happens NEXT.

Think about:
- What was the LAST moment or action shown in Page ${sessionHistory.length}?
- What would logically happen IMMEDIATELY AFTER that moment?
- How does the story progress from where Page ${sessionHistory.length} ended?

Your prompt should describe the NEXT scene that continues chronologically from Page ${sessionHistory.length}.` : 'Write a prompt for the opening scene of this manga story.'}

The prompt should:
1. ${sessionHistory.length > 0 ? `Continue IMMEDIATELY from Page ${sessionHistory.length} - what happens next in the timeline?` : 'Start the story with an engaging opening scene'}
2. Advance the story forward chronologically - show progression, not repetition
3. Be specific about the scene, characters, and action
4. Maintain story pacing appropriate for page ${pageNumber}/${totalPages}
5. ${pageNumber >= totalPages * 0.8 ? 'Build towards the climax - we are approaching the end' : 'Continue building the story naturally'}
6. ${layout === 'Single Panel' ? '⚠️ CRITICAL: Describe a SINGLE MOMENT/SCENE for ONE PANEL ONLY - this page will have EXACTLY ONE PANEL - do NOT describe multiple scenes or moments' : 'Describe a scene that can work with various panel layouts - layout variety is encouraged'}
7. ${sessionHistory.length > 0 ? `DO NOT repeat what happened in Page ${sessionHistory.length} - always move forward` : ''}
8. ${allPreviousPrompts.length > 0 ? `🚫 CRITICAL: Your prompt MUST be COMPLETELY DIFFERENT from all previous prompts. Check the list above and ensure your prompt is UNIQUE and DISTINCT.` : ''}
${layout && panelCountRequirement.includes('PANEL') && !panelCountRequirement.includes('SINGLE') ? `
7. OPTIONAL - MULTI-PANEL STORY FLOW (if using multi-panel layout):
   If the page uses multiple panels, your prompt should describe a SCENE SEQUENCE that can be broken into multiple moments:
   - The prompt should describe a series of connected actions/events that flow naturally
   - Think of it as describing a short sequence of events, not just one static moment
   - Example: Instead of "The hero stands there", use "The hero runs toward the enemy, dodges an attack, then counter-attacks"
   - This allows multiple panels to show different moments in the sequence
   - But remember: layout can vary, so focus on the story first
` : ''}

IMPORTANT: Write ONLY the prompt text (2-3 sentences), nothing else. No explanations, no meta-commentary.

Example format:
"The hero realizes his mistake and rushes back to the village. Enemies are attacking from all sides. He must protect the villagers with his newfound power."

Now generate the prompt for page ${pageNumber}:`;

  try {
    const contentParts: any[] = [{ text: promptGenerationRequest }];

    if (sessionHistory && sessionHistory.length > 0) {
      const recentPageImages = sessionHistory.slice(-1);
      const sources = recentPageImages.map((p) => p.url);
      const imageMap = await resolveImagesToBase64(sources);

      for (const page of recentPageImages) {
        if (!page.url) continue;
        const raw = imageMap[page.url];
        if (!raw) continue;

        const base64Data = raw.includes('base64,')
          ? raw.split('base64,')[1]
          : raw;

        let mimeType = 'image/jpeg';
        if (raw.includes('data:image/')) {
          const mimeMatch = raw.match(/data:(image\/[^;]+)/);
          if (mimeMatch) {
            mimeType = mimeMatch[1];
          }
        }

        contentParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
      }
    }

    let response: any;
    let attempts = 0;
    const maxAttempts = 3;
    while (true) {
      try {
        response = await ai.models.generateContent({
          model: TEXT_GENERATION_MODEL,
          contents: { parts: contentParts },
          config: {
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
              { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
            ] as any,
          },
        });
        break;
      } catch (err: any) {
        attempts += 1;
        if (!isOverloadedError(err) || attempts >= maxAttempts) {
          throw err;
        }
        const backoffMs = 500 * Math.pow(2, attempts - 1);
        await delay(backoffMs);
      }
    }

    let generatedPrompt = response.text?.trim() || '';

    if (allPreviousPrompts.length > 0 && generatedPrompt) {
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        const isTooSimilar = allPreviousPrompts.some(prevPrompt => {
          const similarity = calculatePromptSimilarity(generatedPrompt.toLowerCase(), prevPrompt.toLowerCase());
          return similarity > 0.7;
        });

        if (!isTooSimilar) {
          break;
        }

        retryCount++;

        const retryRequest = promptGenerationRequest + `\n\n⚠️⚠️⚠️ RETRY REQUEST - PREVIOUS ATTEMPT WAS TOO SIMILAR:
Your previous attempt was too similar to existing prompts. Generate a COMPLETELY DIFFERENT prompt.
- Use DIFFERENT words, phrases, and descriptions
- Describe a DIFFERENT type of scene or action
- Change the focus, perspective, or situation
- Make it DISTINCT and UNIQUE from all previous prompts listed above.`;

        try {
          const retryResponse = await ai.models.generateContent({
            model: TEXT_GENERATION_MODEL,
            contents: {
              parts: contentParts.map((part, idx) =>
                idx === 0 ? { text: retryRequest } : part
              )
            },
            config: {
              safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any }
              ] as any
            }
          });

          generatedPrompt = retryResponse.text?.trim() || generatedPrompt;
        } catch (retryError) {
          break;
        }
      }
    }

    return generatedPrompt;
  } catch (error) {
    return `Continue the story naturally from page ${pageNumber - 1}. Show what happens next.`;
  }
};

function calculatePromptSimilarity(prompt1: string, prompt2: string): number {
  const words1 = new Set(prompt1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(prompt2.split(/\s+/).filter(w => w.length > 3));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

export const generateMangaImage = async (
  prompt: string,
  config: MangaConfig,
  sessionHistory?: GeneratedManga[],
  selectedReferencePageIds?: string[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  let actualPrompt = prompt;
  let isBatchContinuation = false;

  let contextSection = '';
  if (config.context && config.context.trim()) {
    try {
      const sanitizedContext = config.context.trim().substring(0, 10000);
      contextSection = `\nWORLD SETTING & CHARACTER PROFILES (MUST FOLLOW EXACTLY):\n`;
      contextSection += `${sanitizedContext}\n`;
      contextSection += `\nCRITICAL CHARACTER CONSISTENCY REQUIREMENTS:\n`;
      contextSection += `All characters described above MUST maintain their EXACT appearance throughout this entire session:\n`;
      contextSection += `• FACE: Same facial structure, eye shape, eye color, nose, mouth, facial features\n`;
      contextSection += `• HAIR: Same hairstyle, hair color, hair length, hair texture, hair accessories\n`;
      contextSection += `• BODY: Same body proportions, height, build, body type\n`;
      contextSection += `• CLOTHING: Same outfit, same colors, same accessories (unless story requires change)\n`;
      contextSection += `• DISTINGUISHING FEATURES: Same scars, tattoos, jewelry, glasses, or unique features\n`;
      contextSection += `• SKIN TONE: Same skin color and tone\n`;
      contextSection += `• CHARACTER DESIGN: Every visual detail must be IDENTICAL to previous appearances\n`;
      contextSection += `If a character appeared in previous pages, they MUST look EXACTLY THE SAME in this page!\n`;
    } catch (error) {
    }
  }

  const cleanedPrompt = cleanUserPrompt(prompt);
  const userIntent = extractUserIntent(prompt);

  const hasPreviousPages = sessionHistory && sessionHistory.length > 0;

  const hasUserPrompt = isUserProvidedPrompt(cleanedPrompt);

  if (hasPreviousPages) {
    isBatchContinuation = cleanedPrompt.includes('Continue the story naturally from page');

    if (hasUserPrompt && !isBatchContinuation) {
      actualPrompt = userIntent || cleanedPrompt;
    }
    else if (isBatchContinuation) {
      const pageMatch = prompt.match(/page (\d+)\. This is page (\d+) of (\d+)/);
      if (pageMatch) {
        const currentPage = parseInt(pageMatch[2]);
        const totalPages = parseInt(pageMatch[3]);

        const hasStoryDirection = config.storyDirection && config.storyDirection.trim();
        const hasContext = config.context && config.context.trim();

        actualPrompt = `Batch continuation: Page ${currentPage}/${totalPages}
${hasStoryDirection && config.storyDirection ? `\nStory direction: ${config.storyDirection.trim().substring(0, 100)}${config.storyDirection.trim().length > 100 ? '...' : ''}` : ''}
${hasContext ? '\nMaintain character consistency from context.' : ''}
Create the NEXT scene that follows from previous pages. Change: camera angle, character pose, composition. Advance narrative naturally.`;
      }
    }
    else if (!hasUserPrompt && (!cleanedPrompt || cleanedPrompt.trim() === '' || cleanedPrompt === 'Continue the story naturally' || config.autoContinueStory)) {
      const lastPageNum = sessionHistory!.length;

      const hasStoryDirection = config.storyDirection && config.storyDirection.trim();
      const hasContext = config.context && config.context.trim();

      let continuationGuidance = '';

      if (hasStoryDirection && config.storyDirection) {
        continuationGuidance += `\nSTORY DIRECTION (HIGHEST PRIORITY - FOLLOW THIS):\n${config.storyDirection.trim()}\n\n`;
        continuationGuidance += `CRITICAL: The story direction above is your PRIMARY guide. Use it to determine what should happen next in the story.\n`;
        continuationGuidance += `Combine this direction with what happened in Page ${lastPageNum} to create the next scene.\n\n`;
      }

      if (hasContext) {
        continuationGuidance += `CONTEXT & CHARACTER SETTING:\n`;
        continuationGuidance += `Remember the characters, world, and setting described in the context. Maintain consistency with these elements.\n\n`;
      }

      continuationGuidance += `VISUAL CONTINUATION FROM PAGE ${lastPageNum}:\n`;
      continuationGuidance += `Study Page ${lastPageNum}'s LAST PANEL to understand where the story left off visually.\n`;
      continuationGuidance += `Use this visual information to ensure smooth visual flow, but prioritize the story direction and context above.\n\n`;

      const storyDirectionNote = hasStoryDirection && config.storyDirection
        ? `\nSTORY DIRECTION (PRIMARY GUIDE): ${config.storyDirection.trim().substring(0, 200)}${config.storyDirection.trim().length > 200 ? '...' : ''}\n`
        : '';

      actualPrompt = `Continue from Page ${lastPageNum} to Page ${lastPageNum + 1}
${hasStoryDirection && config.storyDirection ? `\nStory direction: ${config.storyDirection.trim().substring(0, 100)}${config.storyDirection.trim().length > 100 ? '...' : ''}` : ''}
${hasContext ? '\nMaintain character consistency from context.' : ''}
Panel 1 shows the IMMEDIATE NEXT MOMENT after Page ${lastPageNum}'s last panel. Change: camera angle, character pose, composition. Do NOT repeat any scene, pose, or composition from Page ${lastPageNum}. Advance the narrative naturally.`;
    }
  }

  let continuityInstructions = '';

  if (sessionHistory && sessionHistory.length > 0) {
    const lastPageNum = sessionHistory.length;
    continuityInstructions = `Continue from Page ${lastPageNum} to Page ${lastPageNum + 1}:
• Panel 1 shows the IMMEDIATE NEXT MOMENT after Page ${lastPageNum}'s last panel
• Change: camera angle, character pose, composition
• Do NOT repeat any scene, pose, or composition from Page ${lastPageNum}
• Advance the narrative naturally`;
  }

  let dialogueInstructions = '';
  if (config.dialogueDensity && config.dialogueDensity !== 'No Dialogue') {
    let dialogueAmount = '';
    if (config.dialogueDensity === 'Light Dialogue') {
      dialogueAmount = '1-2 bubbles (5-10 words each)';
    } else if (config.dialogueDensity === 'Medium Dialogue') {
      dialogueAmount = '3-5 bubbles (10-20 words each)';
    } else if (config.dialogueDensity === 'Heavy Dialogue') {
      dialogueAmount = '6+ bubbles with narration';
    }

    let textGuidance = '';
    if (config.language === 'English') {
      textGuidance = `TEXT: Use short, simple English sentences. Avoid uncommon or complex words. Prefer basic vocabulary you are 100% confident is spelled correctly.`;
    } else if (config.language === 'Vietnamese') {
      textGuidance = `TEXT: Use simple Vietnamese words. Verify "đ" vs "d" - they are DIFFERENT. Check all diacritics are present.`;
    } else if (config.language === 'Japanese') {
      textGuidance = `TEXT: Use correct Hiragana, Katakana, and Kanji. Every character must be correct.`;
    } else if (config.language === 'Korean') {
      textGuidance = `TEXT: Use correct Hangul. Verify syllable blocks are correctly formed.`;
    } else if (config.language === 'Chinese') {
      textGuidance = `TEXT: Use correct characters. Use consistent script (Traditional OR Simplified).`;
    } else {
      textGuidance = `TEXT: Use simple ${config.language} words. Verify spelling is correct.`;
    }

    dialogueInstructions = `DIALOGUE: ${dialogueAmount}
${textGuidance}
Language: ${config.language.toUpperCase()} only`;
  } else {
    dialogueInstructions = `NO DIALOGUE: Silent/visual-only page`;
  }

  let referenceImageInstructions = '';
  let hasRefPreviousPages = sessionHistory && sessionHistory.length > 0;

  const enabledReferenceImages = config.referenceImages
    ? config.referenceImages.filter(img => {
        if (typeof img === 'string') return true;
        return img.enabled;
      })
    : [];
  let hasUploadedReferences = enabledReferenceImages.length > 0;

  if (hasUploadedReferences || hasRefPreviousPages) {
    referenceImageInstructions = '';

    if (hasRefPreviousPages) {
      const recentPagesCount = Math.min(10, sessionHistory!.length);
      referenceImageInstructions = `CHARACTER CONSISTENCY: Study previous ${recentPagesCount} page(s). Characters must clearly be the SAME individuals: same face structure, hairstyle, body type, outfit, and overall design.`;
    }

    if (hasUploadedReferences) {
      referenceImageInstructions += hasRefPreviousPages ? ' ' : '';
      referenceImageInstructions += `${enabledReferenceImages.length} reference image(s) provided for style/character consistency.`;
    }
  }

  const getStyleDescription = (style: string) => {
    const styleGuides: Record<string, string> = {
      'Modern Webtoon': 'Modern Korean WEBTOON style: vertical-reading composition, clean polished digital rendering, vibrant pastel colors, soft shading, thin elegant line art, subtle gradients, cinematic lighting, focus on faces and emotions.',
      'Korean Manhwa': 'Traditional Korean MANHWA style: semi-realistic proportions, detailed faces, sharp but elegant line art, rich color palettes, dramatic lighting, fashion-focused clothing, smooth gradient shading.',
      'Manhwa 3D': 'MANHWA 3D style: three-dimensional rendering with depth and volume, semi-realistic proportions with 3D modeling aesthetics, detailed faces with dimensional lighting, sharp but elegant line art, rich vibrant color palettes, dramatic three-dimensional lighting with shadows and highlights, fashion-focused clothing with 3D texture rendering, SMOOTH GLOSSY SHINY POLISHED rendering with silky smooth surfaces, reflective glossy materials, sleek polished skin and hair, smooth gradient shading with volumetric effects and glossy highlights, ultra-smooth glossy finish, cinematic depth of field, realistic perspective and camera angles, professional 3D game/animation quality rendering with glossy polished surfaces.',
      'Digital Painting': 'Full DIGITAL PAINTING style: painterly brush strokes, visible texture, blended edges, strong light and shadow shapes, rich color harmonies, atmospheric perspective, soft but detailed rendering.',
      'Realistic Manga': 'REALISTIC manga style: accurate human anatomy, realistic proportions, detailed facial features, strong three-dimensional shading, subtle screentones, grounded camera angles while keeping manga aesthetics.',
      'Realistic People': 'REALISTIC PEOPLE style: photorealistic human anatomy and proportions, lifelike facial features and expressions, natural skin textures and hair, realistic lighting and shadows, authentic clothing and environments, true-to-life body language and poses, photographic quality rendering with detailed facial features, realistic eye reflections, natural skin imperfections, authentic material textures, cinematic depth of field, professional photography aesthetics.',
      'Clean Line Art': 'CLEAN LINE ART style: crisp vector-like outlines, uniform line weight or very controlled variation, minimal hatching, flat or very simple shading, graphic and modern look with clear silhouettes.',
      'Cinematic Style': 'CINEMATIC style: movie-like framing, extreme close-ups and wide shots, dramatic contrast lighting, depth of field blur, lens effects, dynamic perspective, very atmospheric backgrounds.',
      'Semi-Realistic': 'SEMI-REALISTIC style: balance between anime and realism, believable anatomy but stylized faces, detailed rendering of hair and skin, controlled line work, soft but accurate lighting.',
      'Shonen': 'SHONEN manga style: high-energy action, exaggerated expressions, strong dynamic poses, thick energetic line art, speed lines, impact frames, high contrast screentones, youthful character designs.',
      'Shoujo': 'SHOUJO manga style: delicate graceful line art, large sparkling eyes, thin flowing hair, elegant poses, decorative screentones (flowers, sparkles), soft shading, focus on romance and emotion.',
      'Seinen': 'SEINEN manga style: mature and detailed, realistic body proportions, complex hatching and screentones, gritty textures, grounded camera angles, subtle but powerful expressions.',
      'Josei': 'JOSEI manga style: adult slice-of-life tone, realistic but gentle proportions, fashionable clothing, clean refined line art, soft screentones, nuanced facial expressions and body language.',
    };
    return styleGuides[style] || style;
  };

  const getInkingDescription = (inking: string) => {
    const inkingGuides: Record<string, string> = {
      'Digital Painting': 'Full digital painting with blended colors, no hard line art, painterly texture and brushwork',
      'Soft Brush': 'Soft, organic brush strokes with gentle edges and smooth transitions',
      'Clean Digital': 'Precise, clean digital lines with consistent weight and smooth curves',
      'Airbrush': 'Smooth airbrush shading with soft gradients and subtle color transitions',
      'Painterly': 'Expressive painterly strokes with visible brush texture and artistic flair',
      'G-Pen': 'Traditional manga G-pen with variable line weight, crisp blacks',
      'Tachikawa Pen': 'Thin, consistent lines with delicate detail work',
      'Brush Ink': 'Dynamic brush strokes with natural variation in thickness',
      'Marker': 'Bold marker-like lines with solid, even strokes',
      'Digital': 'Standard digital inking with clean, consistent lines',
    };
    return inkingGuides[inking] || inking;
  };

  const adjustPromptWithAI = async (originalPrompt: string, blockReason: string, attempt: number): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });

      const adjustmentRequest = `You are a prompt engineering assistant. A manga image generation prompt was blocked by Google's content policy with reason: ${blockReason}.

ORIGINAL PROMPT:
"${originalPrompt}"

YOUR TASK:
Rewrite this prompt to maintain the same artistic intent and story elements while making it compliant with content policies.

REQUIREMENTS:
1. Keep the core story, characters, and scene description
2. Use more artistic, abstract, or stylized language instead of explicit terms
3. Focus on visual storytelling, composition, and manga aesthetics
4. Remove or replace any terms that might trigger content filters
5. Maintain the emotional tone and narrative intent
6. Use professional manga terminology

IMPORTANT:
- Do NOT change the fundamental story or scene
- Do NOT remove important character or setting details
- Do NOT make it completely generic
- DO make it more artistic and policy-compliant
- DO preserve the creative intent

Return ONLY the rewritten prompt, nothing else. No explanations, no meta-commentary.`;

      const response = await ai.models.generateContent({
        model: TEXT_GENERATION_MODEL,
        contents: { parts: [{ text: adjustmentRequest }] },
        config: {
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
            { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
          ] as any,
        },
      });

      const adjustedPrompt = response.text?.trim() || '';

      if (adjustedPrompt && adjustedPrompt.length > 10) {
        return adjustedPrompt;
      } else {
        return sanitizePromptForRetry(originalPrompt, attempt);
      }
    } catch (error) {
      return sanitizePromptForRetry(originalPrompt, attempt);
    }
  };

  const sanitizePromptForRetry = (originalPrompt: string, attempt: number): string => {
    if (attempt === 1) {

      let sanitized = originalPrompt

        .replace(/explicit/gi, 'artistic')
        .replace(/hentai/gi, 'mature manga')
        .replace(/sexual/gi, 'intimate')
        .replace(/sex/gi, 'romance')
        .replace(/nude/gi, 'revealing')
        .replace(/nudity/gi, 'revealing scenes')
        .replace(/naked/gi, 'unclothed')
        .replace(/fetish/gi, 'special interest')
        .replace(/porn/gi, 'mature content')
        .replace(/pornography/gi, 'mature content')
        .replace(/erotic/gi, 'sensual')
        .replace(/18\+/g, 'mature')
        .replace(/adult.*content/gi, 'mature content')
        .replace(/explicit.*content/gi, 'artistic content')
        .replace(/nsfw/gi, 'mature')

        .replace(/biến thái/gi, 'unconventional')
        .replace(/khiêu dâm/gi, 'mature content')
        .replace(/sex/gi, 'romance')
        .replace(/tình dục/gi, 'romance')
        .replace(/khỏa thân/gi, 'revealing')
        .replace(/18\+/g, 'mature');

      sanitized = sanitized
        .replace(/very.*explicit/gi, 'artistic')
        .replace(/highly.*sexual/gi, 'romantic')
        .replace(/graphic.*content/gi, 'artistic content');

      return sanitized + ' Use artistic and stylized approach, focus on manga aesthetics and visual storytelling.';
    } else if (attempt === 2) {

      let sanitized = originalPrompt
        .replace(/explicit|hentai|sexual|sex|nude|nudity|naked|fetish|porn|pornography|erotic|biến thái|khiêu dâm|tình dục|khỏa thân|18\+|adult content|explicit content|nsfw/gi, '')
        .replace(/mature.*themes/gi, 'artistic themes')
        .replace(/explicit.*scenes/gi, 'artistic scenes')
        .replace(/romantic.*scenes/gi, 'emotional scenes')
        .replace(/intimate.*moments/gi, 'close moments');

      sanitized = sanitized.replace(/\s+/g, ' ').trim();

      return sanitized + ' Focus on artistic manga style, expressive poses, and visual narrative. Use creative composition and manga aesthetics.';
    } else {

      let safeElements = originalPrompt
        .replace(/explicit|hentai|sexual|sex|nude|nudity|naked|fetish|porn|pornography|erotic|biến thái|khiêu dâm|tình dục|khỏa thân|18\+|adult|explicit|nsfw/gi, '')
        .replace(/mature.*themes?/gi, '')
        .replace(/explicit.*scenes?/gi, '')
        .trim();

      if (safeElements.length > 20) {
        return safeElements + ' Create a manga page with expressive characters, dynamic poses, and engaging visual storytelling. Focus on artistic composition and manga aesthetics.';
      } else {
        return 'Create a manga page with expressive characters, dynamic poses, and engaging visual storytelling. Focus on artistic composition and manga aesthetics.';
      }
    }
  };

  const sanitizeEnhancedPromptForRetry = (originalEnhancedPrompt: string, originalActualPrompt: string, attempt: number): string => {
    const sanitizedActualPrompt = sanitizePromptForRetry(originalActualPrompt, attempt);

    let sanitized = originalEnhancedPrompt.replace(
      originalActualPrompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      sanitizedActualPrompt
    );

    if (attempt >= 1) {
      sanitized = sanitized
        .replace(/hentai/gi, 'mature manga')
        .replace(/explicit content/gi, 'artistic content')
        .replace(/sexual themes/gi, 'intimate themes');
    }

    if (attempt >= 2) {
      sanitized = sanitized
        .replace(/18\+/g, 'mature')
        .replace(/adult.*themes/gi, 'artistic themes')
        .replace(/explicit.*scenes/gi, 'artistic scenes');
    }

    return sanitized;
  };

  const hasUserPromptFinal = hasUserPrompt && !isBatchContinuation;

  const priorities = [];
  if (config.language === 'English') {
    priorities.push('1. English text accuracy (NO spelling or grammar errors)');
  } else if (config.language === 'Vietnamese') {
    priorities.push('1. Vietnamese text accuracy (all diacritics correct, verify "đ" vs "d")');
  } else {
    priorities.push(`1. ${config.language} text accuracy (NO errors)`);
  }
  if (sessionHistory && sessionHistory.length > 0) {
    priorities.push('2. Character appearance consistency with previous pages');
    priorities.push('3. Story continuity from previous page');
  }
  priorities.push('4. Visual variation (different pose, angle, composition)');
  priorities.push('5. Artistic quality');

  const priorityOrder = priorities.join('\n');

  let storyBaseSection = '';
  let userPromptSection = '';
  let storyDirectionSection = '';

  if (continuityInstructions) {
    storyBaseSection = continuityInstructions;
  } else {
    storyBaseSection = actualPrompt || 'Create the scene as described.';
  }

  if (hasUserPromptFinal) {
    userPromptSection = `\nWRITE YOUR PROMPT (USER INPUT):\n${actualPrompt}`;
  }

  if (config.storyDirection && config.storyDirection.trim()) {
    const trimmed = config.storyDirection.trim();
    storyDirectionSection = `\nSTORY FLOW DIRECTION (GUIDE AUTO-CONTINUE):\n${trimmed.substring(0, 500)}${trimmed.length > 500 ? '...' : ''}`;
  }

  const hasSpacing = config.panelBorderStyle === 'Full Border' || !config.panelBorderStyle;
  const spacingText = hasSpacing ? 'with spacing' : 'no spacing';

  const layoutDesc = config.layout === 'Single Panel'
    ? `EXACTLY ONE SINGLE PANEL ONLY - Full-page illustration ${hasSpacing ? 'with spacing' : 'no spacing'} - FORCE SINGLE PANEL - DO NOT CREATE MULTIPLE PANELS`
    : config.layout === 'Dramatic Spread' || config.layout === 'Widescreen Cinematic'
    ? `Single full-page illustration, ${hasSpacing ? 'with spacing' : 'no spacing'}`
    : config.layout === 'Dynamic Freestyle' || config.layout === 'Asymmetric Mixed'
      ? `5-8 panels, varied sizes, ${spacingText}`
      : config.layout.includes('Action Sequence')
        ? `5-7 action panels, ${spacingText}`
        : config.layout.includes('Conversation')
          ? `4-6 horizontal panels stacked${hasSpacing ? ', with spacing' : ', no spacing'}`
          : config.layout === 'Z-Pattern Flow'
            ? `5-6 panels in Z-pattern${hasSpacing ? ', with spacing' : ', no spacing'}`
            : config.layout === 'Vertical Strip'
              ? `3-5 wide horizontal panels${hasSpacing ? ', with spacing' : ', no spacing'}`
              : config.layout === 'Climax Focus'
                ? `1 dominant panel + 4-5 supporting panels${hasSpacing ? ', with spacing' : ', no spacing'}`
                : `${config.layout.includes('Double') ? '2' : config.layout.includes('Triple') ? '3' : '4'} panels, ${spacingText}`;

  const colorMode = config.useColor
    ? 'FULL COLOR - all elements must have colors, NO grayscale'
    : 'Black and white only - use screentones for shading';

  const enhancedPrompt = `MANGA PAGE GENERATION

CORE RULES (Priority Order):
${priorityOrder}

STORY CONTINUATION:
${storyBaseSection}${userPromptSection}
${contextSection ? `\n${contextSection}` : ''}${storyDirectionSection}
${referenceImageInstructions ? `\n${referenceImageInstructions}` : ''}

VISUAL + TEXT SPEC:
FORMAT: ${layoutDesc}
${config.layout === 'Single Panel' ? `\n⚠️⚠️⚠️ CRITICAL PANEL REQUIREMENT ⚠️⚠️⚠️
EXACTLY ONE PANEL ONLY - DO NOT CREATE MULTIPLE PANELS - FORCE SINGLE PANEL
This page MUST have EXACTLY ONE SINGLE PANEL - NO panel divisions, NO multiple panels
The entire page is ONE continuous illustration${hasSpacing ? ' with spacing' : ' no spacing'}`
: ''}
${config.layout === 'Single Panel' ? '' : hasSpacing ? '\nWith spacing' : '\nNo spacing'}
STYLE: ${config.style}, ${config.inking}, ${config.screentone}
COLOR: ${colorMode}
${dialogueInstructions}
${config.layout !== 'Single Panel' && config.layout !== 'Dramatic Spread' && config.layout !== 'Widescreen Cinematic' ? `\nMULTI-PANEL: Characters complete within ONE panel. Vary camera angles and poses between panels.` : ''}
${config.layout === 'Single Panel' ? '\n⚠️ FINAL REMINDER: This page has EXACTLY ONE PANEL - the entire page is a single continuous illustration. DO NOT create multiple panels or panel divisions.' : ''}
${sessionHistory && sessionHistory.length > 0 ? `\nCONTINUITY: Characters must be the SAME as previous pages. Use DIFFERENT composition/angle/pose than Page ${sessionHistory.length}.` : ''}
`;

  try {

    const contentParts: any[] = [{ text: enhancedPrompt }];

    if (sessionHistory && sessionHistory.length > 0) {
      let pagesToUse: GeneratedManga[] = [];

      if (selectedReferencePageIds && selectedReferencePageIds.length > 0) {
        pagesToUse = sessionHistory.filter(page => selectedReferencePageIds.includes(page.id));
      } else {
        pagesToUse = sessionHistory.slice(-2);
      }

      if (pagesToUse.length > 0) {
        const sources = pagesToUse.map((p) => p.url);
      const imageMap = await resolveImagesToBase64(sources);

        for (const page of pagesToUse) {
        if (!page.url) continue;
        const raw = imageMap[page.url];
        if (!raw) continue;

        const base64Data = raw.includes('base64,')
          ? raw.split('base64,')[1]
          : raw;

        let mimeType = 'image/jpeg';
        if (raw.includes('data:image/')) {
          const mimeMatch = raw.match(/data:(image\/[^;]+)/);
          if (mimeMatch) {
            mimeType = mimeMatch[1];
          }
        }

        contentParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
        }
      }
    }

    if (config.referenceImages && config.referenceImages.length > 0) {
      for (const imageItem of config.referenceImages) {

        let imageData: string;
        let enabled: boolean = true;

        if (typeof imageItem === 'string') {

          imageData = imageItem;
          enabled = true;
        } else {

          imageData = imageItem.url;
          enabled = imageItem.enabled;
        }

        if (!enabled) continue;

        const base64Data = imageData.includes('base64,')
          ? imageData.split('base64,')[1]
          : imageData;

        let mimeType = 'image/jpeg';
        if (imageData.includes('data:image/')) {
          const mimeMatch = imageData.match(/data:(image\/[^;]+)/);
          if (mimeMatch) {
            mimeType = mimeMatch[1];
          }
        }

        contentParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
    }

    let lastError: Error | null = null;
    let retryAttempt = 0;
    const maxRetries = 5;
    let response: any = null;
    let currentContentParts = contentParts;
    let currentActualPrompt = actualPrompt;
    let aiAdjusted = false;

    while (retryAttempt <= maxRetries) {
      try {
        if (retryAttempt > 0 && !aiAdjusted) {
          const sanitizedEnhancedPrompt = sanitizeEnhancedPromptForRetry(enhancedPrompt, actualPrompt, retryAttempt);
          currentActualPrompt = sanitizePromptForRetry(actualPrompt, retryAttempt);

          currentContentParts = [{ text: sanitizedEnhancedPrompt }, ...contentParts.slice(1)];
        }

        aiAdjusted = false;

        let innerAttempts = 0;
        const innerMaxAttempts = 3;
        while (true) {
          try {
            response = await ai.models.generateContent({
              model: IMAGE_GENERATION_MODEL,
              contents: { parts: currentContentParts },
              config: {
                systemInstruction: MANGA_SYSTEM_INSTRUCTION,
                imageConfig: {
                  aspectRatio: config.aspectRatio as any,
                },
                safetySettings: [
                  { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
                  { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
                  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
                  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
                ] as any,
              },
            });
            break;
          } catch (overErr: any) {
            innerAttempts += 1;
            if (!isOverloadedError(overErr) || innerAttempts >= innerMaxAttempts) {
              throw overErr;
            }
            const backoffMs = 1000 * Math.pow(2, innerAttempts - 1);
            await delay(backoffMs);
          }
        }

    if (response.promptFeedback?.blockReason) {
          if (response.promptFeedback.blockReason === 'PROHIBITED_CONTENT' && retryAttempt < maxRetries) {
            retryAttempt++;
            lastError = new Error(`Content blocked: ${response.promptFeedback.blockReason}. ${response.promptFeedback.blockReasonMessage || ''}`);

            try {
              const adjustedPrompt = await adjustPromptWithAI(
                actualPrompt,
                response.promptFeedback.blockReason,
                retryAttempt
              );

              currentActualPrompt = adjustedPrompt;

              const userPromptSectionMatch = enhancedPrompt.match(/WRITE YOUR PROMPT \(USER INPUT\):\n([\s\S]*?)(?=\n|$)/);
              let newEnhancedPrompt = enhancedPrompt;

              if (userPromptSectionMatch) {

                newEnhancedPrompt = enhancedPrompt.replace(
                  userPromptSectionMatch[0],
                  `WRITE YOUR PROMPT (USER INPUT):\n${adjustedPrompt}`
                );
              } else {

                const storySectionMatch = enhancedPrompt.match(/STORY CONTINUATION:\n([\s\S]*?)(?=\n[A-Z])/);
                if (storySectionMatch) {
                  newEnhancedPrompt = enhancedPrompt.replace(
                    storySectionMatch[1],
                    adjustedPrompt
                  );
                } else {

                  newEnhancedPrompt = enhancedPrompt.replace(
                    actualPrompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                    adjustedPrompt
                  );
                }
              }

              currentContentParts = [{ text: newEnhancedPrompt }, ...contentParts.slice(1)];
              aiAdjusted = true;

            } catch (adjustError) {
              const sanitizedEnhancedPrompt = sanitizeEnhancedPromptForRetry(enhancedPrompt, actualPrompt, retryAttempt);
              currentActualPrompt = sanitizePromptForRetry(actualPrompt, retryAttempt);
              currentContentParts = [{ text: sanitizedEnhancedPrompt }, ...contentParts.slice(1)];
              aiAdjusted = false;
            }

            await new Promise(resolve => setTimeout(resolve, 1500));
            continue;
          } else {
            if (response.promptFeedback.blockReason === 'PROHIBITED_CONTENT') {
              const error = new Error(`Content blocked after ${retryAttempt} attempts: ${response.promptFeedback.blockReason}. ${response.promptFeedback.blockReasonMessage || 'The prompt violated Google\'s content policy.'}`);
              (error as any).retryCount = retryAttempt;
              (error as any).maxRetries = maxRetries;
              throw error;
            }
            throw new Error(`Content blocked: ${response.promptFeedback.blockReason}. ${response.promptFeedback.blockReasonMessage || ''}`);
          }
    }

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API");
    }

    const candidate = response.candidates[0];

    if (candidate.finishReason === 'PROHIBITED_CONTENT' && retryAttempt < maxRetries) {
      retryAttempt++;
      lastError = new Error(`Content blocked: PROHIBITED_CONTENT. ${candidate.finishMessage || 'The image violated Google\'s content policy.'}`);

      try {
        const adjustedPrompt = await adjustPromptWithAI(
          actualPrompt,
          'PROHIBITED_CONTENT',
          retryAttempt
        );

        currentActualPrompt = adjustedPrompt;

        const userPromptSectionMatch = enhancedPrompt.match(/WRITE YOUR PROMPT \(USER INPUT\):\n([\s\S]*?)(?=\n|$)/);
        let newEnhancedPrompt = enhancedPrompt;

        if (userPromptSectionMatch) {
          newEnhancedPrompt = enhancedPrompt.replace(
            userPromptSectionMatch[0],
            `WRITE YOUR PROMPT (USER INPUT):\n${adjustedPrompt}`
          );
        } else {
          const storySectionMatch = enhancedPrompt.match(/STORY CONTINUATION:\n([\s\S]*?)(?=\n[A-Z])/);
          if (storySectionMatch) {
            newEnhancedPrompt = enhancedPrompt.replace(
              storySectionMatch[1],
              adjustedPrompt
            );
          } else {
            newEnhancedPrompt = enhancedPrompt.replace(
              actualPrompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              adjustedPrompt
            );
          }
        }

        currentContentParts = [{ text: newEnhancedPrompt }, ...contentParts.slice(1)];
        aiAdjusted = true;

      } catch (adjustError) {
      const sanitizedEnhancedPrompt = sanitizeEnhancedPromptForRetry(enhancedPrompt, actualPrompt, retryAttempt);
      currentActualPrompt = sanitizePromptForRetry(actualPrompt, retryAttempt);
      currentContentParts = [{ text: sanitizedEnhancedPrompt }, ...contentParts.slice(1)];
        aiAdjusted = false;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      continue;
    }

    if (candidate.finishReason === 'IMAGE_SAFETY' && retryAttempt < maxRetries) {
      retryAttempt++;
      lastError = new Error(`Image blocked by safety filter (IMAGE_SAFETY): ${candidate.finishMessage || 'The image violated Google\'s content policy.'}`);

      try {
        const adjustedPrompt = await adjustPromptWithAI(
          actualPrompt,
          'IMAGE_SAFETY',
          retryAttempt
        );

        currentActualPrompt = adjustedPrompt;

        const userPromptSectionMatch = enhancedPrompt.match(/WRITE YOUR PROMPT \(USER INPUT\):\n([\s\S]*?)(?=\n|$)/);
        let newEnhancedPrompt = enhancedPrompt;

        if (userPromptSectionMatch) {
          newEnhancedPrompt = enhancedPrompt.replace(
            userPromptSectionMatch[0],
            `WRITE YOUR PROMPT (USER INPUT):\n${adjustedPrompt}`
          );
        } else {
          const storySectionMatch = enhancedPrompt.match(/STORY CONTINUATION:\n([\s\S]*?)(?=\n[A-Z])/);
          if (storySectionMatch) {
            newEnhancedPrompt = enhancedPrompt.replace(
              storySectionMatch[1],
              adjustedPrompt
            );
          } else {
            newEnhancedPrompt = enhancedPrompt.replace(
              actualPrompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              adjustedPrompt
            );
          }
        }

        currentContentParts = [{ text: newEnhancedPrompt }, ...contentParts.slice(1)];
        aiAdjusted = true;

      } catch (adjustError) {
      const sanitizedEnhancedPrompt = sanitizeEnhancedPromptForRetry(enhancedPrompt, actualPrompt, retryAttempt);
      currentActualPrompt = sanitizePromptForRetry(actualPrompt, retryAttempt);
      currentContentParts = [{ text: sanitizedEnhancedPrompt }, ...contentParts.slice(1)];
        aiAdjusted = false;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      continue;
    }

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      if (candidate.finishReason === 'IMAGE_SAFETY') {
        const error = new Error(`Image blocked by safety filter (IMAGE_SAFETY) after ${retryAttempt} attempts: ${candidate.finishMessage || 'The image violated Google\'s content policy. Try rephrasing the prompt or using alternative APIs.'}`);
        (error as any).retryCount = retryAttempt;
        (error as any).maxRetries = maxRetries;
        throw error;
      }

      throw new Error(`Generation stopped: ${candidate.finishReason}. ${candidate.finishMessage || ''}`);
    }

    break;
      } catch (error: any) {
        if ((error.message?.includes('PROHIBITED_CONTENT') || error.message?.includes('IMAGE_SAFETY')) && retryAttempt < maxRetries) {
          const errorType = error.message?.includes('IMAGE_SAFETY') ? 'IMAGE_SAFETY' : 'PROHIBITED_CONTENT';
          retryAttempt++;
          lastError = error;

          try {
            const adjustedPrompt = await adjustPromptWithAI(
              actualPrompt,
              errorType,
              retryAttempt
            );

            currentActualPrompt = adjustedPrompt;

            const userPromptSectionMatch = enhancedPrompt.match(/WRITE YOUR PROMPT \(USER INPUT\):\n([\s\S]*?)(?=\n|$)/);
            let newEnhancedPrompt = enhancedPrompt;

            if (userPromptSectionMatch) {
              newEnhancedPrompt = enhancedPrompt.replace(
                userPromptSectionMatch[0],
                `WRITE YOUR PROMPT (USER INPUT):\n${adjustedPrompt}`
              );
            } else {
              const storySectionMatch = enhancedPrompt.match(/STORY CONTINUATION:\n([\s\S]*?)(?=\n[A-Z])/);
              if (storySectionMatch) {
                newEnhancedPrompt = enhancedPrompt.replace(
                  storySectionMatch[1],
                  adjustedPrompt
                );
              } else {
                newEnhancedPrompt = enhancedPrompt.replace(
                  actualPrompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                  adjustedPrompt
                );
              }
            }

            currentContentParts = [{ text: newEnhancedPrompt }, ...contentParts.slice(1)];
            aiAdjusted = true;

          } catch (adjustError) {
          const sanitizedEnhancedPrompt = sanitizeEnhancedPromptForRetry(enhancedPrompt, actualPrompt, retryAttempt);
          currentActualPrompt = sanitizePromptForRetry(actualPrompt, retryAttempt);
          currentContentParts = [{ text: sanitizedEnhancedPrompt }, ...contentParts.slice(1)];
            aiAdjusted = false;
          }

          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }
        throw error;
      }
    }

    if (lastError && !response) {
      const error = new Error(`Failed to generate after ${retryAttempt} attempts: ${lastError.message}`);
      (error as any).retryCount = retryAttempt;
      (error as any).maxRetries = maxRetries;
      throw error;
    }

    if (!response) {
      const error = new Error(`Failed to generate content after ${retryAttempt} retry attempts`);
      (error as any).retryCount = retryAttempt;
      (error as any).maxRetries = maxRetries;
      throw error;
    }

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API");
    }

    const candidate = response.candidates[0];

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      if (candidate.finishReason === 'PROHIBITED_CONTENT' || candidate.finishReason === 'IMAGE_SAFETY') {
        const error = new Error(`Generation stopped after ${retryAttempt} attempts: ${candidate.finishReason}. ${candidate.finishMessage || 'The image violated Google\'s content policy.'}`);
        (error as any).retryCount = retryAttempt;
        (error as any).maxRetries = maxRetries;
        throw error;
      }

      throw new Error(`Generation stopped: ${candidate.finishReason}. ${candidate.finishMessage || ''}`);
    }

    if (!candidate.content || !candidate.content.parts) {
      throw new Error("No content parts in response");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data returned from Gemini");
  } catch (error) {
    throw error;
  }
};
