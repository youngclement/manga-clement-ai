import { GoogleGenAI } from "@google/genai";
import { MANGA_SYSTEM_INSTRUCTION, LAYOUT_PROMPTS } from "@/lib/constants";
import { MangaConfig, GeneratedManga } from "@/lib/types";

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
  
  // Prepare previous pages info
  let previousPagesInfo = '';
  const recentPages = sessionHistory.slice(-3);
  recentPages.forEach((page, idx) => {
    previousPagesInfo += `\nPage ${sessionHistory.length - recentPages.length + idx + 1}: ${page.prompt}\n`;
  });
  
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

  const promptGenerationRequest = `You are a professional manga story writer. Your task is to generate the NEXT scene prompt for a manga page.

CONTEXT:
${context}

ORIGINAL STORY DIRECTION:
${originalPrompt}

PREVIOUS PAGES:
${previousPagesInfo}

${layout ? `⚠️ CRITICAL LAYOUT REQUIREMENT:
The previous pages used "${layout}" layout with ${panelCountRequirement}.
You MUST generate a prompt that will result in the SAME layout structure: ${panelCountRequirement}.
This is ESSENTIAL for visual consistency - the next page MUST have the same number and arrangement of panels as previous pages.
${layoutInfo ? `Layout details: ${layoutInfo}` : ''}

` : ''}CURRENT STATUS:
- You are creating the prompt for PAGE ${pageNumber} of ${totalPages}
- This is a continuation of the story from the previous page(s)
${layout ? `- The page MUST use "${layout}" layout with ${panelCountRequirement} (same as previous pages)` : ''}

YOUR TASK:
Analyze what happened in the previous pages and write a SHORT, CLEAR prompt (2-3 sentences) describing what should happen NEXT in the story.

The prompt should:
1. Continue naturally from the previous scene
2. Advance the story forward
3. Be specific about the scene, characters, and action
4. Maintain story pacing appropriate for page ${pageNumber}/${totalPages}
5. Build towards climax if approaching the end
${layout ? `6. CRITICAL: The scene must work with "${layout}" layout requiring ${panelCountRequirement} - structure your prompt to support multiple panels if needed` : ''}
${layout && panelCountRequirement.includes('PANEL') && !panelCountRequirement.includes('SINGLE') ? `
7. IMPORTANT - MULTI-PANEL STORY FLOW:
   Since this page will have ${panelCountRequirement}, your prompt should describe a SCENE SEQUENCE that can be broken into multiple moments:
   - The prompt should describe a series of connected actions/events that flow naturally
   - Think of it as describing a short sequence of events, not just one static moment
   - Example: Instead of "The hero stands there", use "The hero runs toward the enemy, dodges an attack, then counter-attacks"
   - This allows the multiple panels to show: Panel 1 (running), Panel 2 (dodging), Panel 3 (counter-attacking)
   - Each panel will show the next moment in the sequence you describe
` : ''}

IMPORTANT: Write ONLY the prompt text (2-3 sentences), nothing else. No explanations, no meta-commentary.

Example format:
"The hero realizes his mistake and rushes back to the village. Enemies are attacking from all sides. He must protect the villagers with his newfound power."

Now generate the prompt for page ${pageNumber}:`;

  try {
    // Prepare content parts with text and reference images
    const contentParts: any[] = [{ text: promptGenerationRequest }];
    
    // Add previous manga pages as visual references
    if (sessionHistory && sessionHistory.length > 0) {
      const recentPageImages = sessionHistory.slice(-2); // Last 2 pages for visual reference
      
      for (const page of recentPageImages) {
        if (page.url) {
          const base64Data = page.url.includes('base64,') 
            ? page.url.split('base64,')[1] 
            : page.url;
          
          let mimeType = 'image/jpeg';
          if (page.url.includes('data:image/')) {
            const mimeMatch = page.url.match(/data:(image\/[^;]+)/);
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: contentParts
      }
    });

    const generatedPrompt = response.text?.trim() || '';
    return generatedPrompt;
  } catch (error) {
    console.error("Error generating next prompt:", error);
    // Fallback: generate a simple continuation
    return `Continue the story naturally from page ${pageNumber - 1}. Show what happens next.`;
  }
};

export const generateMangaImage = async (
  prompt: string,
  config: MangaConfig,
  sessionHistory?: GeneratedManga[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'AIzaSyCWdZeeNGdHbRGqoisSNI4_nj2hHpCQqiI' });
  
  // Auto-continue story logic
  let actualPrompt = prompt;
  let isBatchContinuation = false;
  
  if (config.autoContinueStory && sessionHistory && sessionHistory.length > 0) {
    // Check if this is a batch continuation (prompt contains "Continue the story naturally from page")
    isBatchContinuation = prompt.includes('Continue the story naturally from page');
    
    if (isBatchContinuation) {
      const pageMatch = prompt.match(/page (\d+)\. This is page (\d+) of (\d+)/);
      if (pageMatch) {
        const currentPage = parseInt(pageMatch[2]);
        const totalPages = parseInt(pageMatch[3]);
        actualPrompt = `📖 BATCH STORY CONTINUATION (Page ${currentPage}/${totalPages}):
        
You are creating page ${currentPage} in a ${totalPages}-page manga sequence. This is an AUTOMATIC story continuation.

INSTRUCTIONS:
• Carefully analyze ALL previous pages (especially the most recent one)
• Create the NEXT scene that logically follows from what just happened
• Advance the story forward naturally - what happens next?
• Maintain story pacing appropriate for page ${currentPage} of ${totalPages}
• Build towards a climax if approaching page ${totalPages}
• Keep the narrative flowing smoothly between pages
• You have full creative freedom to develop the story in an engaging way

Create the next scene that continues this manga story naturally.`;
      }
    } else if (!prompt || prompt.trim() === '' || prompt === 'Continue the story naturally') {
      actualPrompt = `Automatically continue the story from the previous scene. Analyze what just happened in the previous page(s) and create the next logical scene that flows naturally. You have full creative freedom to advance the narrative in a compelling way.`;
    } else {
      actualPrompt = `Continue the story naturally from the previous scene, moving toward this direction: "${prompt}". Create the next scene that follows smoothly from what happened before while incorporating this story direction.`;
    }
  }
  
  let continuityInstructions = '';
  
  if (config.context && config.context.trim()) {
    continuityInstructions += `\n═══════════════════════════════════════════════════════════\n`;
    continuityInstructions += `🌍 WORLD SETTING & CHARACTER PROFILES (MUST FOLLOW EXACTLY):\n`;
    continuityInstructions += `═══════════════════════════════════════════════════════════\n`;
    continuityInstructions += `${config.context}\n`;
    continuityInstructions += `\n⚠️ CRITICAL: All characters described above MUST maintain their EXACT appearance, features, clothing, and visual traits throughout this entire session!\n`;
  }
  
  if (sessionHistory && sessionHistory.length > 0) {
    continuityInstructions += `\n═══════════════════════════════════════════════════════════\n`;
    continuityInstructions += `📖 STORY CONTINUITY (This is page ${sessionHistory.length + 1} of an ongoing story):\n`;
    continuityInstructions += `═══════════════════════════════════════════════════════════\n`;
    
    const recentPages = sessionHistory.slice(-5); // Show more context for batch
    continuityInstructions += `\n📚 PREVIOUS PAGES SUMMARY:\n`;
    recentPages.forEach((page, idx) => {
      const pageNum = sessionHistory.length - recentPages.length + idx + 1;
      const isAutoContinued = page.prompt.includes('[Auto-continued');
      continuityInstructions += `\nPage ${pageNum}: ${isAutoContinued ? '(Auto-continued scene)' : `"${page.prompt}"`}\n`;
    });
    
    if (config.autoContinueStory || isBatchContinuation) {
      continuityInstructions += `\n🔄 ${isBatchContinuation ? 'BATCH' : 'AUTO'}-CONTINUATION INSTRUCTIONS:\n`;
      continuityInstructions += `✓ CRITICAL: Study the LAST page (page ${sessionHistory.length}) carefully - what just happened?\n`;
      continuityInstructions += `✓ Create the NEXT scene that logically and naturally follows from that moment\n`;
      continuityInstructions += `✓ Advance the story forward - show what happens immediately next\n`;
      continuityInstructions += `✓ Think like a mangaka: What would the next page show?\n`;
      continuityInstructions += `✓ Maintain story pacing and dramatic flow appropriate for page ${sessionHistory.length + 1}\n`;
      continuityInstructions += `✓ You can introduce new story elements, actions, dialogue naturally\n`;
      continuityInstructions += `✓ Show character reactions, consequences, or next actions\n`;
      if (isBatchContinuation) {
        continuityInstructions += `✓ This is part of a batch sequence - ensure smooth progression\n`;
      }
      continuityInstructions += `\n`;
    }
    
    continuityInstructions += `\n🎯 VISUAL CONSISTENCY REQUIREMENTS:\n`;
    continuityInstructions += `✓ Characters MUST look IDENTICAL to previous pages (same face, hair, eyes, body, clothes)\n`;
    continuityInstructions += `✓ Maintain the SAME art style, line weight, and visual aesthetic\n`;
    continuityInstructions += `✓ Continue the same ${config.style} style and ${config.inking} inking technique\n`;
    continuityInstructions += `✓ Keep the same level of detail and drawing quality\n`;
    continuityInstructions += `✓ If characters wore specific outfits before, they MUST wear the same unless story requires change\n`;
    continuityInstructions += `✓ Background and setting should match the established world\n`;
    
    // CRITICAL: Layout consistency
    if (sessionHistory.length > 0) {
      const previousLayout = sessionHistory[sessionHistory.length - 1].config?.layout;
      if (previousLayout && previousLayout === config.layout) {
        continuityInstructions += `\n⚠️ LAYOUT CONSISTENCY - CRITICAL:\n`;
        continuityInstructions += `✓ The previous page used "${previousLayout}" layout\n`;
        continuityInstructions += `✓ This page MUST use the EXACT SAME layout: "${config.layout}"\n`;
        continuityInstructions += `✓ You MUST create the SAME number of panels as the previous page\n`;
        continuityInstructions += `✓ Panel arrangement and structure MUST match previous pages\n`;
        continuityInstructions += `✓ DO NOT change the panel count or layout structure - maintain visual consistency\n`;
      }
    }
  }
  
  let dialogueInstructions = '';
  if (config.dialogueDensity && config.dialogueDensity !== 'No Dialogue') {
    // Determine amount based on density
    let dialogueAmount = '';
    if (config.dialogueDensity === 'Light Dialogue') {
      dialogueAmount = '1-2 short speech bubbles with brief text (5-10 words each)';
    } else if (config.dialogueDensity === 'Medium Dialogue') {
      dialogueAmount = '3-5 speech bubbles with moderate text (10-20 words each)';
    } else if (config.dialogueDensity === 'Heavy Dialogue') {
      dialogueAmount = '6+ speech bubbles with extensive dialogue and narration boxes';
    }
    
    dialogueInstructions = `
💬 DIALOGUE & TEXT REQUIREMENTS:
• Density Level: ${config.dialogueDensity} - ${dialogueAmount}
• Language: ${config.language} - ALL TEXT MUST BE IN ${config.language.toUpperCase()}
${config.language === 'English' ? '• Use correct English spelling, grammar, and punctuation\n• Write natural, conversational dialogue appropriate for manga' : ''}
${config.language === 'Japanese' ? '• Use proper Japanese script (hiragana, katakana, kanji)\n• Follow Japanese manga text conventions and reading direction' : ''}
${config.language === 'Vietnamese' ? '• Use correct Vietnamese spelling with proper diacritics (à, á, ả, ã, ạ, ă, â, etc.)\n• Write natural Vietnamese dialogue' : ''}
${config.language === 'Korean' ? '• Use proper Hangul script\n• Follow Korean manga/manhwa text conventions' : ''}
${config.language === 'Chinese' ? '• Use traditional or simplified Chinese characters\n• Follow Chinese manhua text conventions' : ''}

📝 TEXT QUALITY RULES:
✓ SPELLING: Every word must be spelled correctly in ${config.language}
✓ LEGIBILITY: Text must be clear, readable, and properly sized
✓ PLACEMENT: Position speech bubbles naturally without covering important art
✓ BUBBLES: Use traditional manga-style speech bubbles (white with black outlines)
✓ INTEGRATION: Text should feel natural and integrated into the composition
${config.dialogueDensity === 'Heavy Dialogue' ? '✓ Include narration boxes for story context when appropriate' : ''}
`;
  } else {
    dialogueInstructions = `
💬 NO DIALOGUE OR TEXT
• This is a SILENT/VISUAL-ONLY page
• Do NOT include any speech bubbles, text, or narration
• Tell the story purely through visuals and expressions
`;
  }
  
  let referenceImageInstructions = '';
  let hasPreviousPages = sessionHistory && sessionHistory.length > 0;
  let hasUploadedReferences = config.referenceImages && config.referenceImages.length > 0;
  
  if (hasUploadedReferences || hasPreviousPages) {
    referenceImageInstructions = `
🖼️ VISUAL REFERENCE IMAGES PROVIDED:
`;
    
    if (hasPreviousPages) {
      const recentPagesCount = Math.min(3, sessionHistory!.length);
      referenceImageInstructions += `
📚 PREVIOUS MANGA PAGES (${recentPagesCount} recent pages):
⚠️ CRITICAL - CHARACTER CONSISTENCY FROM PREVIOUS PAGES:
• I have provided ${recentPagesCount} manga pages you JUST CREATED in this session
• ALL characters in these previous pages MUST look EXACTLY THE SAME in this new page
• Study their faces, hairstyles, eye shapes, body proportions, clothing, and every visual detail
• This is a CONTINUATION of the same story - characters CANNOT look different!
• Match the art style, line quality, and visual aesthetic from your previous work
• If a character wore a red jacket before, they MUST still wear the red jacket (unless story requires change)
• Facial features, hair color, eye color MUST be identical to previous pages
`;
    }
    
    if (hasUploadedReferences) {
      referenceImageInstructions += `
🎨 UPLOADED REFERENCE IMAGES (${config.referenceImages!.length} image${config.referenceImages!.length > 1 ? 's' : ''}):
• Use these as additional style/character references
• Maintain consistency with visual elements shown
• These are supplementary references for art style and character design
`;
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

  const enhancedPrompt = `
╔═══════════════════════════════════════════════════════════════════╗
║                    MANGA PAGE GENERATION REQUEST                   ║
${isBatchContinuation ? `║                     🔥 BATCH AUTO-CONTINUE MODE 🔥                  ║` : ''}
╚═══════════════════════════════════════════════════════════════════╝

${isBatchContinuation ? '' : config.autoContinueStory && sessionHistory && sessionHistory.length > 0 ? `
🔄 AUTO-CONTINUE MODE ACTIVATED:
• This is an AUTOMATIC STORY CONTINUATION from the previous page
• Analyze the previous page(s) provided and create the NEXT logical scene
• The story should flow naturally - what happens next?
• Maintain story momentum and pacing
• You have creative freedom to continue the narrative naturally
• Keep the same characters, setting, and story tone

` : ''}
📝 ${isBatchContinuation ? 'BATCH CONTINUATION INSTRUCTIONS' : config.autoContinueStory && sessionHistory && sessionHistory.length > 0 ? 'GUIDANCE FOR CONTINUATION' : 'CURRENT SCENE TO ILLUSTRATE'}:
${actualPrompt}

🎨 TECHNICAL SPECIFICATIONS:
• Art Style: ${config.style} - ${getStyleDescription(config.style)}
• Inking Technique: ${config.inking} - ${getInkingDescription(config.inking)}
• Screentone Density: ${config.screentone}
• Color Mode: ${config.useColor ? 'Full Color Manga/Anime Style' : 'Traditional Black and White Manga Ink'}
${config.style.includes('Webtoon') || config.style.includes('Manhwa') || config.style.includes('Digital') || config.style.includes('Cinematic') || config.style.includes('Realistic') 
  ? `\n🌟 STYLE-SPECIFIC REQUIREMENTS:
${config.style.includes('Webtoon') || config.style.includes('Manhwa') 
    ? '• Use vibrant, saturated colors with dramatic lighting and glossy rendering\n• Apply soft shadows and highlights for depth\n• Use cinematic camera angles and atmospheric effects\n• Characters should have polished, modern aesthetic' 
    : ''}
${config.style.includes('Digital Painting') 
    ? '• Create fully painted artwork with NO hard line art\n• Use painterly brushstrokes and textured rendering\n• Apply rich, blended colors with atmospheric lighting\n• Show visible brush texture and artistic painting techniques' 
    : ''}
${config.style.includes('Realistic') 
    ? '• Use realistic human proportions and anatomy\n• Apply detailed facial features and expressions\n• Use photorealistic lighting and shading\n• Maintain manga/anime aesthetic while being realistic' 
    : ''}
${config.style.includes('Clean Line') 
    ? '• Use crisp, clean vector-quality lines\n• Minimal texture, smooth curves\n• Modern minimalist aesthetic with professional finish' 
    : ''}
${config.style.includes('Cinematic') 
    ? '• Apply dramatic camera angles (dutch angles, low angles, bird\'s eye)\n• Use cinematic lighting (rim light, backlighting, volumetric light)\n• Add depth of field and atmospheric perspective\n• Create movie-like compositions' 
    : ''}`
  : ''}

🔲 PANEL LAYOUT - ${config.layout}:
${LAYOUT_PROMPTS[config.layout] || config.layout}

${referenceImageInstructions}

${continuityInstructions}

${dialogueInstructions}

📐 COMPOSITION RULES:
${config.layout === 'Single Panel' || config.layout === 'Dramatic Spread' || config.layout === 'Widescreen Cinematic'
  ? '⚠️ NO SMALL PANEL DIVISIONS - This is a full-page or minimal-panel illustration'
  : config.layout === 'Dynamic Freestyle' || config.layout === 'Asymmetric Mixed'
    ? '⚠️ MULTIPLE PANELS WITH VARIED SIZES - Use 5-8 panels of different dimensions for visual dynamism. Each panel needs clear black borders.'
    : config.layout.includes('Action Sequence')
      ? '⚠️ 5-7 DYNAMIC ACTION PANELS - Mix panel sizes (large + small) with clear black borders for kinetic flow'
      : config.layout.includes('Conversation')
        ? '⚠️ 4-6 HORIZONTAL PANELS - Stacked vertically with clear borders for dialogue flow'
        : config.layout === 'Z-Pattern Flow'
          ? '⚠️ 5-6 PANELS IN Z-PATTERN - Arranged to guide eye flow with clear black borders'
          : config.layout === 'Vertical Strip'
            ? '⚠️ 3-5 WIDE HORIZONTAL PANELS - Full-width strips stacked vertically'
            : config.layout === 'Climax Focus'
              ? '⚠️ ONE DOMINANT PANEL (40-50% of page) + 4-5 SMALLER SUPPORTING PANELS with clear borders'
              : `⚠️ MUST HAVE ${config.layout.includes('Double') ? 'TWO' : config.layout.includes('Triple') ? 'THREE' : 'FOUR'} CLEAR PANEL BORDERS - Draw distinct black borders separating each panel`}

${(() => {
  const hasMultiplePanels = !['Single Panel', 'Dramatic Spread', 'Widescreen Cinematic'].includes(config.layout);
  if (hasMultiplePanels) {
    return `\n🎬 CRITICAL: STORY FLOW THROUGH PANELS (MULTI-PANEL LAYOUT):
⚠️ This page has MULTIPLE PANELS - they MUST tell a CONTINUOUS STORY SEQUENCE:
• Panel 1: ${sessionHistory && sessionHistory.length > 0 ? 'Continues from the LAST panel of the previous page' : 'Starts the scene'}
• Panel 2: Shows what happens IMMEDIATELY AFTER Panel 1 - the next moment in time
• Panel 3: Shows what happens IMMEDIATELY AFTER Panel 2 - continuing the sequence
• Panel 4+: Each subsequent panel is the NEXT moment in the story timeline
• Last Panel: Shows the final moment that leads to the NEXT PAGE

📖 STORY CONTINUITY REQUIREMENTS:
✓ Each panel must be a LOGICAL PROGRESSION from the previous panel
✓ Create a smooth narrative flow: Panel 1 → Panel 2 → Panel 3 → ... → Last Panel
✓ Think of it like frames in a movie: each panel is the next frame in the sequence
✓ The story should advance naturally through ALL panels in this page
✓ Characters' actions, expressions, and positions should flow logically between panels
✓ If Panel 1 shows a character starting to run, Panel 2 should show them mid-run, Panel 3 shows them jumping, etc.
✓ Dialogue and actions should progress naturally across all panels
✓ The LAST panel should end at a moment that naturally leads to the next page

⚠️ DO NOT:
✗ Repeat the same moment in multiple panels
✗ Show disconnected scenes - panels must be sequential moments
✗ Jump around in time - maintain chronological flow
✗ Make panels feel like separate stories - they're all part of ONE continuous sequence

✓ DO:
✓ Create a clear cause-and-effect chain: Panel 1 causes Panel 2, Panel 2 causes Panel 3, etc.
✓ Show progression of action, emotion, or dialogue through the panels
✓ Use panel transitions to show the passage of time or movement
✓ Make each panel feel like the natural "next moment" after the previous one
`;
  }
  return '';
})()}

✓ All content must fit within one high-resolution page image
✓ Apply dynamic angles and perspectives for visual impact
✓ Use authentic manga visual language (speed lines, impact frames, dramatic close-ups, perspective shots)
${config.screentone !== 'None' ? `✓ Apply ${config.screentone.toLowerCase()} screentone for depth and atmosphere` : ''}
✓ Panel borders should be solid black lines (1-3px thick) for clear separation
${config.layout.includes('Freestyle') || config.layout.includes('Asymmetric') || config.layout.includes('Action') ? '✓ Be creative with panel shapes - use diagonal cuts, overlapping edges, or irregular forms' : ''}

${sessionHistory && sessionHistory.length > 0 ? `
⚠️ FINAL REMINDER: This page is part of an ongoing story. 
- Characters MUST look exactly the same as in previous pages. Check character descriptions and previous scenes carefully before drawing!
${(() => {
  const previousLayout = sessionHistory[sessionHistory.length - 1].config?.layout;
  if (previousLayout && previousLayout === config.layout) {
    return `- LAYOUT MUST BE IDENTICAL: Previous page used "${previousLayout}" with specific panel structure. You MUST replicate the EXACT same panel count and arrangement. This is CRITICAL for visual consistency!`;
  }
  return '';
})()}
` : ''}
  `;

  try {
    // Prepare content parts with text and reference images
    const contentParts: any[] = [{ text: enhancedPrompt }];
    
    // Add previous manga pages as visual references (last 3 pages)
    if (sessionHistory && sessionHistory.length > 0) {
      const recentPages = sessionHistory.slice(-3); // Get last 3 pages
      
      for (const page of recentPages) {
        if (page.url) {
          const base64Data = page.url.includes('base64,') 
            ? page.url.split('base64,')[1] 
            : page.url;
          
          let mimeType = 'image/jpeg';
          if (page.url.includes('data:image/')) {
            const mimeMatch = page.url.match(/data:(image\/[^;]+)/);
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
    
    // Add uploaded reference images if provided
    if (config.referenceImages && config.referenceImages.length > 0) {
      for (const imageData of config.referenceImages) {
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: contentParts
      },
      config: {
        systemInstruction: MANGA_SYSTEM_INSTRUCTION,
        imageConfig: {
          aspectRatio: config.aspectRatio as any
        }
      }
    });

    // Check for errors in response
    if (response.promptFeedback?.blockReason) {
      throw new Error(`Content blocked: ${response.promptFeedback.blockReason}`);
    }

    // Check if we have candidates
    if (!response.candidates || response.candidates.length === 0) {
      console.error("No candidates in response:", response);
      throw new Error("No candidates returned from Gemini API");
    }

    const candidate = response.candidates[0];
    
    // Check for finish reason
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.error("Finish reason:", candidate.finishReason);
      throw new Error(`Generation stopped: ${candidate.finishReason}`);
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
