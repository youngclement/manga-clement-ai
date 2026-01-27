import { GoogleGenAI } from "@google/genai";
import { MANGA_SYSTEM_INSTRUCTION, LAYOUT_PROMPTS } from "@/lib/constants";
import { MangaConfig, GeneratedManga } from "@/lib/types";
import { cleanUserPrompt, isUserProvidedPrompt, extractUserIntent } from "@/lib/utils/prompt-utils";
import { loadProjectImages } from "@/lib/services/storage-service";

// Simple helpers for retries
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

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: resolve a list of image URLs/IDs to base64 data URLs using backend
async function resolveImagesToBase64(
  sources: (string | undefined | null)[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  const valid = (sources || []).filter(
    (s): s is string => !!s && typeof s === "string",
  );

  if (valid.length === 0) return result;

  // Short‑circuit for values that are already data URLs
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
      console.error("Failed to load project images for Gemini references:", err);
    }
  }

  return result;
}

// Model configuration - easily changeable
const TEXT_GENERATION_MODEL = 'gemini-2.5-flash'; // For prompt generation
const IMAGE_GENERATION_MODEL = 'gemini-2.5-flash-image'; // For manga image generation
// Alternative models you can use:
// - 'gemini-1.5-pro' (more capable, slower)
// - 'gemini-1.5-flash' (faster, less capable)
// - 'gemini-2.0-flash-exp' (experimental)
// - 'gemini-2.0-flash' (stable version)
// - 'gemini-2.5-flash' (latest stable, recommended)
// - 'gemini-2.5-flash-image' (optimized for images)
// - 'gemini-3-flash' (newest version)

// Generate next prompt based on previous pages
export const generateNextPrompt = async (
  sessionHistory: GeneratedManga[],
  context: string,
  originalPrompt: string,
  pageNumber: number,
  totalPages: number,
  config?: MangaConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'AIzaSyCWdZeeNGdHbRGqoisSNI4_nj2hHpCQqiI' });
  
  // Prepare previous pages info - emphasize the MOST RECENT page
  let previousPagesInfo = '';
  const recentPages = sessionHistory.slice(-10);
  const lastPage = sessionHistory[sessionHistory.length - 1];
  
  // Collect all previous prompts to avoid duplication
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
  
  // Add prompt uniqueness requirement
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
  
  // Get layout info from config or previous pages
  const layout = config?.layout || (sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1].config?.layout : undefined);
  const layoutInfo = layout ? LAYOUT_PROMPTS[layout] || layout : '';
  
  // Determine panel count requirement based on layout
  let panelCountRequirement = '';
  if (layout) {
    if (layout === 'Single Panel' || layout === 'Dramatic Spread' || layout === 'Widescreen Cinematic') {
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

  // Include story direction if provided
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

${layout ? `📐 LAYOUT CONTEXT (for reference, but feel free to vary):
The previous pages used "${layout}" layout with ${panelCountRequirement}.
You can suggest a scene that works with various layouts - layout variety adds visual interest to manga.
${layoutInfo ? `Previous layout details: ${layoutInfo}` : ''}

` : ''}CURRENT STATUS:
- You are creating the prompt for PAGE ${pageNumber} of ${totalPages}
- ${sessionHistory.length > 0 ? `This page MUST continue DIRECTLY from Page ${sessionHistory.length} (the most recent page)` : 'This is the first page of the story'}
- Layout can vary between pages - focus on the story, not matching previous layout exactly

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
6. Describe a scene that can work with various panel layouts - layout variety is encouraged
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
    // Prepare content parts with text and reference images
    const contentParts: any[] = [{ text: promptGenerationRequest }];

    // Add previous manga pages as visual references (use base64, not Cloudinary URL)
    if (sessionHistory && sessionHistory.length > 0) {
      // Only need the very last page as reference for text continuation
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

    // Lightweight retry on temporary overloads
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
        console.warn(`Gemini text model overloaded, retrying in ${backoffMs}ms (attempt ${attempts}/${maxAttempts})`);
        await delay(backoffMs);
      }
    }

    let generatedPrompt = response.text?.trim() || '';
    
    // Check for prompt similarity and retry if too similar
    if (allPreviousPrompts.length > 0 && generatedPrompt) {
      const maxRetries = 3;
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        // Check similarity with previous prompts
        const isTooSimilar = allPreviousPrompts.some(prevPrompt => {
          const similarity = calculatePromptSimilarity(generatedPrompt.toLowerCase(), prevPrompt.toLowerCase());
          return similarity > 0.7; // 70% similarity threshold
        });
        
        if (!isTooSimilar) {
          break; // Prompt is unique enough
        }
        
        retryCount++;
        console.warn(`⚠️ Generated prompt is too similar to previous prompts. Retrying (${retryCount}/${maxRetries})...`);
        
        // Add stronger uniqueness requirement
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
          console.warn('Retry failed, using generated prompt:', retryError);
          break;
        }
      }
      
      if (retryCount >= maxRetries) {
        console.warn('⚠️ Could not generate completely unique prompt after retries, but proceeding with generated prompt.');
      }
    }
    
    return generatedPrompt;
  } catch (error) {
    console.error("Error generating next prompt:", error);
    // Fallback: generate a simple continuation
    return `Continue the story naturally from page ${pageNumber - 1}. Show what happens next.`;
  }
};

// Helper function to calculate prompt similarity (simple word overlap)
function calculatePromptSimilarity(prompt1: string, prompt2: string): number {
  const words1 = new Set(prompt1.split(/\s+/).filter(w => w.length > 3)); // Only words longer than 3 chars
  const words2 = new Set(prompt2.split(/\s+/).filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  // Jaccard similarity
  return intersection.size / union.size;
}

export const generateMangaImage = async (
  prompt: string,
  config: MangaConfig,
  sessionHistory?: GeneratedManga[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'AIzaSyCWdZeeNGdHbRGqoisSNI4_nj2hHpCQqiI' });
  
  // Auto-continue story logic
  let actualPrompt = prompt;
  let isBatchContinuation = false;
  
  // CRITICAL: Always prepare context section first - must be included in ALL cases
  let contextSection = '';
  if (config.context && config.context.trim()) {
    try {
      // Sanitize context to prevent issues
      const sanitizedContext = config.context.trim().substring(0, 10000); // Limit length
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
      console.error("Error processing context:", error);
      // Continue without context if there's an error
    }
  }
  
  // CRITICAL: Clean user prompt first to remove formatting and instructions
  const cleanedPrompt = cleanUserPrompt(prompt);
  const userIntent = extractUserIntent(prompt);
  
  // CRITICAL: If we have sessionHistory, this is ALWAYS a continuation, regardless of autoContinueStory setting
  // This ensures proper story flow in batch generation (x10, x15, etc.)
  const hasPreviousPages = sessionHistory && sessionHistory.length > 0;
  
  // CRITICAL: Check if user provided a specific prompt FIRST
  // User prompt takes absolute priority - if user typed something, use it
  // Even when auto-continue is enabled, user prompt should be respected
  const hasUserPrompt = isUserProvidedPrompt(cleanedPrompt);
  
  if (hasPreviousPages) {
    // Check if this is a batch continuation (prompt contains "Continue the story naturally from page")
    isBatchContinuation = cleanedPrompt.includes('Continue the story naturally from page');
    
    // PRIORITY 1: If user provided a specific prompt, use it directly (highest priority)
    if (hasUserPrompt && !isBatchContinuation) {
      actualPrompt = userIntent || cleanedPrompt;
    } 
    // PRIORITY 2: Batch continuation (auto-generated)
    else if (isBatchContinuation) {
      const pageMatch = prompt.match(/page (\d+)\. This is page (\d+) of (\d+)/);
      if (pageMatch) {
        const currentPage = parseInt(pageMatch[2]);
        const totalPages = parseInt(pageMatch[3]);
        
        // Check what information sources we have
        const hasStoryDirection = config.storyDirection && config.storyDirection.trim();
        const hasContext = config.context && config.context.trim();
        
        actualPrompt = `Batch continuation: Page ${currentPage}/${totalPages}
${hasStoryDirection && config.storyDirection ? `\nStory direction: ${config.storyDirection.trim().substring(0, 100)}${config.storyDirection.trim().length > 100 ? '...' : ''}` : ''}
${hasContext ? '\nMaintain character consistency from context.' : ''}
Create the NEXT scene that follows from previous pages. Change: camera angle, character pose, composition. Advance narrative naturally.`;
      }
    } 
    // PRIORITY 3: Auto-continue (no user prompt, but auto-continue is enabled or we have history)
    // Only use auto-continue if there's NO user prompt
    // BUT: Still prioritize story direction and context if available
    else if (!hasUserPrompt && (!cleanedPrompt || cleanedPrompt.trim() === '' || cleanedPrompt === 'Continue the story naturally' || config.autoContinueStory)) {
      // This is a continuation - enhance the prompt to emphasize continuation from the LAST page
      const lastPageNum = sessionHistory!.length;
      
      // Check what information sources we have
      const hasStoryDirection = config.storyDirection && config.storyDirection.trim();
      const hasContext = config.context && config.context.trim();
      
      // Build continuation prompt with priority: Story Direction > Context > Visual Analysis
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
      
      // Visual analysis is still important but not the only source
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
    
    // Smart text accuracy approach - use simple words
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
  
  // Count only enabled reference images
  const enabledReferenceImages = config.referenceImages 
    ? config.referenceImages.filter(img => {
        if (typeof img === 'string') return true; // Old format: always enabled
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

  // Enhanced style descriptions
  const getStyleDescription = (style: string) => {
    const styleGuides: Record<string, string> = {
      'Modern Webtoon': 'Korean webtoon style with vibrant colors, dramatic lighting, glossy rendering, soft shadows, and cinematic atmosphere',
      'Korean Manhwa': 'Korean manhwa style with detailed facial features, realistic proportions, dynamic lighting, semi-realistic rendering',
      'Digital Painting': 'Fully painted digital art style with painterly brushstrokes, rich colors, atmospheric lighting, and textured rendering',
      'Realistic Manga': 'Realistic proportions and anatomy with manga aesthetics, detailed shading, lifelike facial features',
      'Clean Line Art': 'Crisp, clean lines with minimal detail, modern aesthetic, smooth curves, professional vector-like quality',
      'Cinematic Style': 'Movie-like composition with dramatic camera angles, cinematic lighting, depth of field effects, atmospheric rendering',
      'Semi-Realistic': 'Balance between anime/manga and realistic art, detailed features with stylized expressions',
      'Shonen': 'Dynamic action-focused style with bold lines, intense expressions, and energetic compositions',
      'Shoujo': 'Elegant style with soft lines, beautiful characters, decorative elements, and emotional expressions',
      'Seinen': 'Mature, detailed style with realistic proportions, complex shading, and sophisticated compositions',
      'Josei': 'Refined adult-oriented style with realistic characters, subtle emotions, and elegant linework',
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

  // Function to sanitize prompt for retry (make it less explicit)
  const sanitizePromptForRetry = (originalPrompt: string, attempt: number): string => {
    if (attempt === 1) {
      // First retry: Use more artistic/abstract language - replace explicit terms
      let sanitized = originalPrompt
        // English terms
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
        // Vietnamese terms
        .replace(/biến thái/gi, 'unconventional')
        .replace(/khiêu dâm/gi, 'mature content')
        .replace(/sex/gi, 'romance')
        .replace(/tình dục/gi, 'romance')
        .replace(/khỏa thân/gi, 'revealing')
        .replace(/18\+/g, 'mature');
      
      // Remove any remaining explicit phrases
      sanitized = sanitized
        .replace(/very.*explicit/gi, 'artistic')
        .replace(/highly.*sexual/gi, 'romantic')
        .replace(/graphic.*content/gi, 'artistic content');
      
      return sanitized + ' Use artistic and stylized approach, focus on manga aesthetics and visual storytelling.';
    } else if (attempt === 2) {
      // Second retry: Even more abstract - remove explicit terms entirely
      let sanitized = originalPrompt
        .replace(/explicit|hentai|sexual|sex|nude|nudity|naked|fetish|porn|pornography|erotic|biến thái|khiêu dâm|tình dục|khỏa thân|18\+|adult content|explicit content|nsfw/gi, '')
        .replace(/mature.*themes/gi, 'artistic themes')
        .replace(/explicit.*scenes/gi, 'artistic scenes')
        .replace(/romantic.*scenes/gi, 'emotional scenes')
        .replace(/intimate.*moments/gi, 'close moments');
      
      // Clean up multiple spaces
      sanitized = sanitized.replace(/\s+/g, ' ').trim();
      
      return sanitized + ' Focus on artistic manga style, expressive poses, and visual narrative. Use creative composition and manga aesthetics.';
    } else {
      // Third retry: Very safe, generic - use only safe description
      // Try to extract safe elements from original prompt
      let safeElements = originalPrompt
        .replace(/explicit|hentai|sexual|sex|nude|nudity|naked|fetish|porn|pornography|erotic|biến thái|khiêu dâm|tình dục|khỏa thân|18\+|adult|explicit|nsfw/gi, '')
        .replace(/mature.*themes?/gi, '')
        .replace(/explicit.*scenes?/gi, '')
        .trim();
      
      // If we have safe elements, use them; otherwise use generic
      if (safeElements.length > 20) {
        return safeElements + ' Create a manga page with expressive characters, dynamic poses, and engaging visual storytelling. Focus on artistic composition and manga aesthetics.';
      } else {
        return 'Create a manga page with expressive characters, dynamic poses, and engaging visual storytelling. Focus on artistic composition and manga aesthetics.';
      }
    }
  };
  
  // Function to sanitize entire enhanced prompt for retry
  const sanitizeEnhancedPromptForRetry = (originalEnhancedPrompt: string, originalActualPrompt: string, attempt: number): string => {
    const sanitizedActualPrompt = sanitizePromptForRetry(originalActualPrompt, attempt);
    
    // Replace the actualPrompt section in enhancedPrompt
    let sanitized = originalEnhancedPrompt.replace(
      originalActualPrompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      sanitizedActualPrompt
    );
    
    // Also sanitize the CONTENT POLICY section to be less explicit
    if (attempt >= 1) {
      sanitized = sanitized
        .replace(/hentai/gi, 'mature manga')
        .replace(/explicit content/gi, 'artistic content')
        .replace(/sexual themes/gi, 'intimate themes')
        .replace(/biến thái/gi, 'unconventional');
    }
    
    if (attempt >= 2) {
      sanitized = sanitized
        .replace(/18\+/g, 'mature')
        .replace(/adult.*themes/gi, 'artistic themes')
        .replace(/explicit.*scenes/gi, 'artistic scenes');
    }
    
    return sanitized;
  };

  // Determine if user provided a specific prompt (not auto-continue)
  // This should match the same logic used above
  const hasUserPromptFinal = hasUserPrompt && !isBatchContinuation;

  // Build priority order based on what's available
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

  // Build story sections in strict priority:
  // 1) System continuation text
  // 2) WRITE YOUR PROMPT (user prompt)
  // 3) CONTEXT (already in contextSection)
  // 4) STORY FLOW DIRECTION (guide auto-continue)
  let storyBaseSection = '';
  let userPromptSection = '';
  let storyDirectionSection = '';

  // 1) System continuation text / fallback narrative instruction
  if (continuityInstructions) {
    storyBaseSection = continuityInstructions;
  } else {
    storyBaseSection = actualPrompt || 'Create the scene as described.';
  }

  // 2) User prompt from "Write Your Prompt" (only when user really typed something)
  if (hasUserPromptFinal) {
    userPromptSection = `\nWRITE YOUR PROMPT (USER INPUT):\n${actualPrompt}`;
  }

  // 4) Story flow direction as a separate, lowest‑priority block
  if (config.storyDirection && config.storyDirection.trim()) {
    const trimmed = config.storyDirection.trim();
    storyDirectionSection = `\nSTORY FLOW DIRECTION (GUIDE AUTO-CONTINUE):\n${trimmed.substring(0, 500)}${trimmed.length > 500 ? '...' : ''}`;
  }

  // Build visual spec
  const layoutDesc = config.layout === 'Single Panel' || config.layout === 'Dramatic Spread' || config.layout === 'Widescreen Cinematic'
    ? 'Single full-page illustration, no panel borders'
    : config.layout === 'Dynamic Freestyle' || config.layout === 'Asymmetric Mixed'
      ? '5-8 panels, varied sizes, black borders'
      : config.layout.includes('Action Sequence')
        ? '5-7 action panels, black borders'
        : config.layout.includes('Conversation')
          ? '4-6 horizontal panels stacked'
          : config.layout === 'Z-Pattern Flow'
            ? '5-6 panels in Z-pattern'
            : config.layout === 'Vertical Strip'
              ? '3-5 wide horizontal panels'
              : config.layout === 'Climax Focus'
                ? '1 dominant panel + 4-5 supporting panels'
                : `${config.layout.includes('Double') ? '2' : config.layout.includes('Triple') ? '3' : '4'} panels, black borders`;

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
STYLE: ${config.style}, ${config.inking}, ${config.screentone}
COLOR: ${colorMode}
${dialogueInstructions}
${config.layout !== 'Single Panel' && config.layout !== 'Dramatic Spread' && config.layout !== 'Widescreen Cinematic' ? '\nMULTI-PANEL: Characters complete within ONE panel - NEVER split across borders. Vary camera angles and poses between panels.' : ''}
${sessionHistory && sessionHistory.length > 0 ? `\nCONTINUITY: Characters must be the SAME as previous pages. Use DIFFERENT composition/angle/pose than Page ${sessionHistory.length}.` : ''}
`;

  try {
    // Prepare content parts with text and reference images
    const contentParts: any[] = [{ text: enhancedPrompt }];
    
    // Add previous manga pages as visual references (limit to last 3 nearest pages) using base64 from backend
    if (sessionHistory && sessionHistory.length > 0) {
      // When generating multiple pages, always use only the 3 most recent pages
      const recentPages = sessionHistory.slice(-3);
      const sources = recentPages.map((p) => p.url);
      const imageMap = await resolveImagesToBase64(sources);
      
      for (const page of recentPages) {
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
    
    // Add uploaded reference images if provided (only enabled ones)
    if (config.referenceImages && config.referenceImages.length > 0) {
      for (const imageItem of config.referenceImages) {
        // Support both old format (string) and new format (ReferenceImage object)
        let imageData: string;
        let enabled: boolean = true; // Default to enabled for backward compatibility
        
        if (typeof imageItem === 'string') {
          // Old format: just a string URL
          imageData = imageItem;
          enabled = true;
        } else {
          // New format: ReferenceImage object
          imageData = imageItem.url;
          enabled = imageItem.enabled;
        }
        
        // Only add if enabled
        if (!enabled) continue;
        
        // Extract base64 data (remove data:image/...;base64, prefix if present)
        const base64Data = imageData.includes('base64,') 
          ? imageData.split('base64,')[1] 
          : imageData;
        
        // Detect mime type from data URL or default to jpeg
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

    // Retry logic for PROHIBITED_CONTENT - automatically modify prompt and retry
    let lastError: Error | null = null;
    let retryAttempt = 0;
    const maxRetries = 3;
    let response: any = null;
    let currentContentParts = contentParts;
    let currentActualPrompt = actualPrompt;
    
    while (retryAttempt <= maxRetries) {
      try {
        // If this is a retry, modify the prompt to be less explicit
        if (retryAttempt > 0) {
          console.warn(`🔄 Retry attempt ${retryAttempt}/${maxRetries}: Modifying prompt to be less explicit...`);
          const sanitizedEnhancedPrompt = sanitizeEnhancedPromptForRetry(enhancedPrompt, actualPrompt, retryAttempt);
          currentActualPrompt = sanitizePromptForRetry(actualPrompt, retryAttempt);
          
          // Update contentParts with sanitized prompt
          currentContentParts = [{ text: sanitizedEnhancedPrompt }, ...contentParts.slice(1)];
        }
        
        // Also handle temporary overloads from Gemini (UNAVAILABLE / 503)
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
            console.warn(
              `Gemini image model overloaded, retrying in ${backoffMs}ms (attempt ${innerAttempts}/${innerMaxAttempts})`,
            );
            await delay(backoffMs);
          }
        }

    // Check for errors in response
    if (response.promptFeedback?.blockReason) {
          if (response.promptFeedback.blockReason === 'PROHIBITED_CONTENT' && retryAttempt < maxRetries) {
            console.warn(`⚠️ Attempt ${retryAttempt + 1} blocked: PROHIBITED_CONTENT (promptFeedback). Retrying with modified prompt...`);
            retryAttempt++;
            lastError = new Error(`Content blocked: ${response.promptFeedback.blockReason}. ${response.promptFeedback.blockReasonMessage || ''}`);
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue; // Retry with modified prompt
          } else {
            // Either not PROHIBITED_CONTENT or max retries reached
            console.error("Prompt feedback:", response.promptFeedback);
            if (response.promptFeedback.blockReason === 'PROHIBITED_CONTENT') {
              console.warn("Content was blocked as PROHIBITED_CONTENT after all retry attempts.");
              console.warn("Note: Even with safety settings disabled, Gemini API may still block certain content types.");
              console.warn("Consider using alternative APIs or models that support adult content generation.");
            }
            throw new Error(`Content blocked: ${response.promptFeedback.blockReason}. ${response.promptFeedback.blockReasonMessage || ''}`);
          }
    }

    // Check if we have candidates
    if (!response.candidates || response.candidates.length === 0) {
      console.error("No candidates in response:", response);
      throw new Error("No candidates returned from Gemini API");
    }

    const candidate = response.candidates[0];
    
    // Check for PROHIBITED_CONTENT in finishReason
    if (candidate.finishReason === 'PROHIBITED_CONTENT' && retryAttempt < maxRetries) {
      console.warn(`⚠️ Attempt ${retryAttempt + 1} blocked: PROHIBITED_CONTENT (finishReason). Retrying with modified prompt...`);
      retryAttempt++;
      lastError = new Error(`Content blocked: PROHIBITED_CONTENT. ${candidate.finishMessage || 'The image violated Google\'s content policy.'}`);
      
      // Sanitize prompt for next retry
      console.warn(`🔄 Retry attempt ${retryAttempt}/${maxRetries}: Modifying prompt to be less explicit...`);
      const sanitizedEnhancedPrompt = sanitizeEnhancedPromptForRetry(enhancedPrompt, actualPrompt, retryAttempt);
      currentActualPrompt = sanitizePromptForRetry(actualPrompt, retryAttempt);
      currentContentParts = [{ text: sanitizedEnhancedPrompt }, ...contentParts.slice(1)];
      
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue; // Retry with modified prompt
    }
    
    // Check for IMAGE_SAFETY in finishReason (similar to PROHIBITED_CONTENT)
    if (candidate.finishReason === 'IMAGE_SAFETY' && retryAttempt < maxRetries) {
      console.warn(`⚠️ Attempt ${retryAttempt + 1} blocked: IMAGE_SAFETY (finishReason). Retrying with modified prompt...`);
      retryAttempt++;
      lastError = new Error(`Image blocked by safety filter (IMAGE_SAFETY): ${candidate.finishMessage || 'The image violated Google\'s content policy.'}`);
      
      // Sanitize prompt for next retry
      console.warn(`🔄 Retry attempt ${retryAttempt}/${maxRetries}: Modifying prompt to be less explicit...`);
      const sanitizedEnhancedPrompt = sanitizeEnhancedPromptForRetry(enhancedPrompt, actualPrompt, retryAttempt);
      currentActualPrompt = sanitizePromptForRetry(actualPrompt, retryAttempt);
      currentContentParts = [{ text: sanitizedEnhancedPrompt }, ...contentParts.slice(1)];
      
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue; // Retry with modified prompt
    }
    
    // Check for other finish reasons
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.error("Finish reason:", candidate.finishReason);
      console.error("Finish message:", candidate.finishMessage);
      
      // If IMAGE_SAFETY and max retries reached
      if (candidate.finishReason === 'IMAGE_SAFETY') {
        console.error("Image was blocked by IMAGE_SAFETY filter after all retry attempts");
        console.warn("The generated image violated Google's Generative AI Prohibited Use policy");
        console.warn("This can happen even with safety settings disabled due to Google's content policy");
        console.warn("Suggestions:");
        console.warn("1. Try rephrasing the prompt to be less explicit");
        console.warn("2. Use more artistic/abstract descriptions");
        console.warn("3. Consider using alternative APIs that support adult content");
        throw new Error(`Image blocked by safety filter (IMAGE_SAFETY): ${candidate.finishMessage || 'The image violated Google\'s content policy. Try rephrasing the prompt or using alternative APIs.'}`);
      }
      
      // For other finish reasons, throw error
      throw new Error(`Generation stopped: ${candidate.finishReason}. ${candidate.finishMessage || ''}`);
    }
        
    // Success - break out of retry loop
    console.log(`✅ Generation successful${retryAttempt > 0 ? ` after ${retryAttempt} retry attempt(s)` : ''}`);
    break;
      } catch (error: any) {
        // If it's a PROHIBITED_CONTENT or IMAGE_SAFETY error and we haven't reached max retries, retry
        if ((error.message?.includes('PROHIBITED_CONTENT') || error.message?.includes('IMAGE_SAFETY')) && retryAttempt < maxRetries) {
          const errorType = error.message?.includes('IMAGE_SAFETY') ? 'IMAGE_SAFETY' : 'PROHIBITED_CONTENT';
          console.warn(`⚠️ Attempt ${retryAttempt + 1} failed: ${errorType}. Retrying with modified prompt...`);
          retryAttempt++;
          lastError = error;
          
          // Sanitize prompt for next retry
          console.warn(`🔄 Retry attempt ${retryAttempt}/${maxRetries}: Modifying prompt to be less explicit...`);
          const sanitizedEnhancedPrompt = sanitizeEnhancedPromptForRetry(enhancedPrompt, actualPrompt, retryAttempt);
          currentActualPrompt = sanitizePromptForRetry(actualPrompt, retryAttempt);
          currentContentParts = [{ text: sanitizedEnhancedPrompt }, ...contentParts.slice(1)];
          
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        // Otherwise, throw the error
        throw error;
      }
    }
    
    // If we exhausted retries, throw the last error
    if (lastError && !response) {
      throw lastError;
    }
    
    if (!response) {
      throw new Error("Failed to generate content after all retry attempts");
    }

    // Check if we have candidates (should already be checked in retry loop, but double-check)
    if (!response.candidates || response.candidates.length === 0) {
      console.error("No candidates in response:", response);
      throw new Error("No candidates returned from Gemini API");
    }

    const candidate = response.candidates[0];
    
    // Final check for finish reason (should be STOP at this point after retries)
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      // If we get here, it means we've exhausted retries but still have an error
      console.error("Finish reason:", candidate.finishReason);
      console.error("Finish message:", candidate.finishMessage);
      
      if (candidate.finishReason === 'PROHIBITED_CONTENT' || candidate.finishReason === 'IMAGE_SAFETY') {
        console.warn("Content was blocked after all retry attempts.");
        console.warn("Note: Even with safety settings disabled, Gemini API may still block certain content types.");
        console.warn("Consider using alternative APIs or models that support adult content generation.");
      }
      
      throw new Error(`Generation stopped: ${candidate.finishReason}. ${candidate.finishMessage || ''}`);
    }

    // Check for content
    if (!candidate.content || !candidate.content.parts) {
      console.error("No content parts in candidate:", candidate);
      throw new Error("No content parts in response");
    }

    // Look for image data in parts
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    // If no image found, log the response structure for debugging
    console.error("Response structure:", JSON.stringify({
      candidates: response.candidates?.length,
      firstCandidate: {
        finishReason: candidate.finishReason,
        contentParts: candidate.content?.parts?.length,
        parts: candidate.content?.parts?.map((p: any) => Object.keys(p))
      }
    }, null, 2));

    throw new Error("No image data returned from Gemini - check console for details");
  } catch (error) {
    console.error("Error generating manga image:", error);
    throw error;
  }
};

