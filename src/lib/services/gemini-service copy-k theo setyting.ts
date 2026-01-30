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

${layout ? `📐 LAYOUT CONTEXT (for reference, but feel free to vary):
The previous pages used "${layout}" layout with ${panelCountRequirement}.
You can suggest a scene that works with various layouts - layout variety adds visual interest to manga.
${layoutInfo ? `Previous layout details: ${layoutInfo}` : ''}

` : ''}CURRENT STATUS:
- You are creating the prompt for PAGE ${pageNumber} of ${totalPages}
- This is a continuation of the story from the previous page(s)
- Layout can vary between pages - focus on the story, not matching previous layout exactly

YOUR TASK:
Analyze what happened in the previous pages and write a SHORT, CLEAR prompt (2-3 sentences) describing what should happen NEXT in the story.

The prompt should:
1. Continue naturally from the previous scene
2. Advance the story forward
3. Be specific about the scene, characters, and action
4. Maintain story pacing appropriate for page ${pageNumber}/${totalPages}
5. Build towards climax if approaching the end
6. Describe a scene that can work with various panel layouts - layout variety is encouraged
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
  
  // Story Settings - provided as reference/guidance, not strict requirements
  let contextSection = '';
  if (config.context && config.context.trim()) {
    contextSection = `\n═══════════════════════════════════════════════════════════\n`;
    contextSection += `🌍 STORY SETTINGS & CHARACTER REFERENCE (for guidance):\n`;
    contextSection += `═══════════════════════════════════════════════════════════\n`;
    contextSection += `${config.context}\n`;
    contextSection += `\n💡 NOTE: The above information is provided as REFERENCE and GUIDANCE to help maintain story consistency.\n`;
    contextSection += `Use it as a guide, but feel free to adapt and evolve the story naturally. Focus on creating engaging scenes!\n`;
  }
  
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
      actualPrompt = `AUTOMATIC STORY CONTINUATION - ADVANCE THE NARRATIVE:

CRITICAL: This page must continue from the LAST PANEL of the previous page. 

ANALYZE THE PREVIOUS PAGE:
- Look at the LAST PANEL of the previous page - what was happening there?
- What was the final moment, action, or dialogue shown?
- Where were the characters and what were they doing?

CREATE THE NEXT SCENE:
- Start from where the LAST PANEL ended
- Show what happens IMMEDIATELY AFTER that moment
- Advance the story forward chronologically
- DO NOT repeat the same scene, action, or moment
- DO NOT show characters in the same position doing the same thing
- Move the story forward - show the next logical progression

Think: "If the previous page ended with X, then this page should show what happens because of X, or what X leads to."

Create a scene that naturally follows and advances the story from the previous page's conclusion.`;
    } else {
      actualPrompt = `STORY CONTINUATION WITH DIRECTION:

This page continues from the LAST PANEL of the previous page, moving toward: "${prompt}"

CRITICAL CONTINUITY:
- The LAST PANEL of the previous page shows where the story ended
- Your FIRST PANEL must continue IMMEDIATELY from that last panel
- Then progress toward the direction: "${prompt}"
- DO NOT repeat scenes or actions from the previous page
- ADVANCE the story forward - show what happens next

Create a scene that:
1. Continues from the previous page's last panel
2. Moves toward the direction: "${prompt}"
3. Advances the story chronologically
4. Shows new moments, not repeated ones`;
    }
  }
  
  let continuityInstructions = '';
  
  // Note: contextSection is already included at the top of enhancedPrompt
  // No need to duplicate it here
  
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
      continuityInstructions += `⚠️ CRITICAL STORY CONTINUITY - DO NOT REPEAT OR LOOP:\n`;
      continuityInstructions += `✓ Study the LAST page (page ${sessionHistory.length}) VERY CAREFULLY - especially the LAST PANEL\n`;
      continuityInstructions += `✓ The LAST PANEL of the previous page shows where the story ended\n`;
      continuityInstructions += `✓ Your FIRST PANEL must continue IMMEDIATELY from that last panel - what happens next?\n`;
      continuityInstructions += `✓ DO NOT repeat the same scene, action, or moment from the previous page\n`;
      continuityInstructions += `✓ DO NOT show characters in the same position or doing the same thing\n`;
      continuityInstructions += `✓ ADVANCE the story forward - show the NEXT moment in the timeline\n`;
      continuityInstructions += `✓ If the previous page ended with a character running, show them arriving, or the consequence of that action\n`;
      continuityInstructions += `✓ If the previous page ended with dialogue, show the reaction or response\n`;
      continuityInstructions += `✓ If the previous page ended with an action, show the result or next action\n`;
      continuityInstructions += `✓ Think chronologically: Previous page = moment A, This page = moment B (what happens after A?)\n`;
      continuityInstructions += `✓ Maintain story pacing and dramatic flow appropriate for page ${sessionHistory.length + 1}\n`;
      continuityInstructions += `✓ You can introduce new story elements, actions, dialogue naturally\n`;
      continuityInstructions += `✓ Show character reactions, consequences, or next actions\n`;
      if (isBatchContinuation) {
        continuityInstructions += `✓ This is part of a batch sequence - ensure smooth progression\n`;
      }
      continuityInstructions += `\n⚠️ REMEMBER: The story must MOVE FORWARD, not stay in the same place or repeat previous moments!\n`;
      continuityInstructions += `\n`;
    }
    
    continuityInstructions += `\n🎯 VISUAL CONSISTENCY GUIDELINES:\n`;
    continuityInstructions += `✓ Try to keep characters looking similar to previous pages (face, hair, general appearance)\n`;
    continuityInstructions += `✓ Maintain a similar art style, line weight, and visual aesthetic\n`;
    continuityInstructions += `✓ Continue the same ${config.style} style and ${config.inking} inking technique\n`;
    continuityInstructions += `✓ Keep a similar level of detail and drawing quality\n`;
    continuityInstructions += `✓ Characters can evolve naturally - outfits and details can change if the story calls for it\n`;
    continuityInstructions += `✓ Background and setting should generally match the established world, but can vary for visual interest\n`;
    
    // Layout flexibility - encourage variety for visual interest
    if (sessionHistory.length > 0) {
      const previousLayout = sessionHistory[sessionHistory.length - 1].config?.layout;
      if (previousLayout) {
        continuityInstructions += `\n🎨 LAYOUT FLEXIBILITY:\n`;
        continuityInstructions += `✓ Previous page used "${previousLayout}" layout\n`;
        continuityInstructions += `✓ You can use "${config.layout}" layout for this page - feel free to vary layouts for visual interest\n`;
        continuityInstructions += `✓ Different layouts can enhance storytelling - use what works best for this scene\n`;
        continuityInstructions += `✓ Focus on story flow and visual impact rather than strict layout consistency\n`;
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
    
    // Language-specific spelling and grammar requirements
    let languageSpecificRules = '';
    if (config.language === 'English') {
      languageSpecificRules = `⚠️ CRITICAL ENGLISH TEXT REQUIREMENTS:
• EVERY word must be spelled correctly - double-check spelling before rendering
• Use proper English grammar, punctuation, and capitalization
• Common words must be correct: "the", "and", "you", "are", "is", "was", "were", etc.
• Avoid common misspellings: "teh" → "the", "adn" → "and", "yu" → "you"
• Use correct verb forms: "is/are", "was/were", "has/have"
• Proper punctuation: periods (.), commas (,), question marks (?), exclamation marks (!)
• Capitalize first letter of sentences and proper nouns
• Write natural, conversational dialogue appropriate for manga`;
    } else if (config.language === 'Japanese') {
      languageSpecificRules = `⚠️ CRITICAL JAPANESE TEXT REQUIREMENTS:
• Use correct Japanese characters - NO typos or incorrect kanji
• Hiragana (ひらがな) must be written correctly
• Katakana (カタカナ) must be written correctly  
• Kanji (漢字) must be the correct characters, not similar-looking wrong ones
• Follow proper Japanese grammar and sentence structure
• Use appropriate honorifics (さん, くん, ちゃん, etc.) when needed
• Follow Japanese manga text conventions and reading direction (right-to-left for vertical text)
• NO mixing of hiragana/katakana incorrectly`;
    } else if (config.language === 'Vietnamese') {
      languageSpecificRules = `⚠️ CRITICAL VIETNAMESE TEXT REQUIREMENTS:
• EVERY word must have CORRECT diacritics (dấu) - this is ESSENTIAL
• Common diacritics: à, á, ả, ã, ạ, ă, â, è, é, ẻ, ẽ, ẹ, ê, ì, í, ỉ, ĩ, ị, ò, ó, ỏ, õ, ọ, ô, ơ, ù, ú, ủ, ũ, ụ, ư, ỳ, ý, ỷ, ỹ, ỵ
• Common words with diacritics: "là" (not "la"), "đã" (not "da"), "của" (not "cua"), "với" (not "voi"), "này" (not "nay")
• "đ" and "Đ" are different from "d" and "D" - use correct letter
• Double-check: "người" (not "nguoi"), "việc" (not "viec"), "được" (not "duoc")
• Use correct Vietnamese spelling - NO missing diacritics
• Write natural Vietnamese dialogue with proper grammar`;
    } else if (config.language === 'Korean') {
      languageSpecificRules = `⚠️ CRITICAL KOREAN TEXT REQUIREMENTS:
• Use correct Hangul (한글) characters - NO typos or incorrect letters
• Every syllable block must be correctly formed
• Use proper spacing between words
• Common words must be correct: "안녕", "있어", "없어", "하고", "그리고", etc.
• Avoid common mistakes: "있어" (not "이써"), "없어" (not "업서")
• Use correct Korean grammar and sentence endings (요, 다, 니다, etc.)
• Follow Korean manga/manhwa text conventions
• NO mixing of similar-looking Hangul characters incorrectly`;
    } else if (config.language === 'Chinese') {
      languageSpecificRules = `⚠️ CRITICAL CHINESE TEXT REQUIREMENTS:
• Use correct Chinese characters (汉字) - NO typos or incorrect characters
• Every character must be the correct one, not similar-looking wrong characters
• Use consistent script: Traditional (繁體) OR Simplified (简体) - don't mix
• Common characters must be correct: "的", "了", "是", "在", "有", "我", "你", "他"
• Avoid using wrong characters that look similar
• Use proper Chinese grammar and sentence structure
• Follow Chinese manhua text conventions
• NO character substitution or typos`;
    } else {
      languageSpecificRules = `⚠️ CRITICAL TEXT REQUIREMENTS FOR ${config.language.toUpperCase()}:
• EVERY word must be spelled correctly in ${config.language}
• Use proper grammar, punctuation, and spelling rules for ${config.language}
• Double-check all text before rendering - NO typos allowed
• Write natural dialogue appropriate for ${config.language} manga`;
    }
    
    dialogueInstructions = `
💬 DIALOGUE & TEXT REQUIREMENTS:
• Density Level: ${config.dialogueDensity} - ${dialogueAmount}
• Language: ${config.language} - ALL TEXT MUST BE IN ${config.language.toUpperCase()}

${languageSpecificRules}

📝 TEXT QUALITY RULES - MANDATORY:
⚠️ CRITICAL: Before rendering ANY text, you MUST:
1. ✓ SPELLING CHECK: Verify EVERY word is spelled correctly in ${config.language}
2. ✓ GRAMMAR CHECK: Ensure proper grammar and sentence structure
3. ✓ CHARACTER CHECK: For ${config.language === 'Japanese' || config.language === 'Chinese' ? 'character-based languages' : config.language === 'Korean' ? 'Hangul' : 'text'}, verify all characters are correct
4. ✓ DIACRITICS CHECK: ${config.language === 'Vietnamese' ? 'Verify ALL diacritics (dấu) are present and correct - missing diacritics = WRONG spelling' : 'Verify all accents/special characters are correct'}
5. ✓ PROOFREAD: Read through all text mentally before rendering to catch any errors

✓ LEGIBILITY: Text must be clear, readable, and properly sized
✓ PLACEMENT: Position speech bubbles naturally without covering important art
✓ BUBBLES: Use traditional manga-style speech bubbles (white with black outlines)
✓ INTEGRATION: Text should feel natural and integrated into the composition
✓ NO TYPOS: Absolutely NO spelling mistakes, typos, or character errors allowed
${config.dialogueDensity === 'Heavy Dialogue' ? '✓ Include narration boxes for story context when appropriate' : ''}

🚫 COMMON MISTAKES TO AVOID:
✗ Missing diacritics/accents in ${config.language === 'Vietnamese' ? 'Vietnamese' : config.language}
✗ Typos in common words
✗ Incorrect character usage in ${config.language === 'Japanese' || config.language === 'Chinese' || config.language === 'Korean' ? 'character-based languages' : 'text'}
✗ Grammar errors
✗ Missing punctuation or incorrect punctuation
✗ Mixing similar-looking characters incorrectly

Remember: Text quality is CRITICAL - readers will notice spelling errors immediately!
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
💡 REFERENCE FOR STORY CONTINUITY:
• I have provided ${recentPagesCount} manga pages from this session for reference
• Use these as a GUIDE to maintain general character appearance and story flow
• Try to keep characters looking similar (faces, hairstyles, general features)
• Match the art style, line quality, and visual aesthetic from your previous work
• Characters can evolve naturally - details can change if the story calls for it
• Focus on story flow and visual interest rather than perfect visual matching
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

${contextSection ? contextSection + '\n' : ''}${isBatchContinuation ? '' : config.autoContinueStory && sessionHistory && sessionHistory.length > 0 ? `
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

💡 LAYOUT FLEXIBILITY NOTE:
• This page uses "${config.layout}" layout
• Layout variety between pages is ENCOURAGED for visual interest
• Don't feel constrained to match previous pages' layouts exactly
• Focus on what works best for THIS specific scene and story moment
• Different layouts can enhance storytelling and keep readers engaged

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
    const isAutoContinue = config.autoContinueStory && sessionHistory && sessionHistory.length > 0;
    return `\n🎬 CRITICAL: STORY FLOW THROUGH PANELS (MULTI-PANEL LAYOUT):
⚠️ This page has MULTIPLE PANELS - they MUST tell a CONTINUOUS STORY SEQUENCE:
${isAutoContinue ? `• Panel 1: ⚠️ CRITICAL - Must continue from the LAST PANEL of page ${sessionHistory.length}
  - Study the LAST PANEL of the previous page carefully
  - What was the final moment, action, or dialogue shown?
  - Panel 1 must show what happens IMMEDIATELY AFTER that last panel
  - DO NOT repeat the same scene or moment from the previous page
  - ADVANCE the story - show the next logical progression
` : '• Panel 1: Starts the scene'}
• Panel 2: Shows what happens IMMEDIATELY AFTER Panel 1 - the next moment in time
• Panel 3: Shows what happens IMMEDIATELY AFTER Panel 2 - continuing the sequence
• Panel 4+: Each subsequent panel is the NEXT moment in the story timeline
• Last Panel: Shows the final moment that leads to the NEXT PAGE

📖 STORY CONTINUITY REQUIREMENTS:
${isAutoContinue ? `⚠️ AUTO-CONTINUE MODE - ADVANCE THE STORY:
✓ Panel 1 MUST continue from the LAST PANEL of the previous page
✓ DO NOT repeat scenes, actions, or moments from the previous page
✓ DO NOT show characters in the same position doing the same thing
✓ ADVANCE chronologically: Previous page's last panel → This page's first panel → Panel 2 → Panel 3...
✓ If the previous page ended with a character running, show them arriving, or the consequence
✓ If the previous page ended with dialogue, show the reaction or response
✓ If the previous page ended with an action, show the result or next action
✓ Think: "Previous page ended with X, so Panel 1 shows what happens because of X or what X leads to"
` : ''}✓ Each panel must be a LOGICAL PROGRESSION from the previous panel
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
${isAutoContinue ? `✗ Repeat scenes or actions from the previous page\n✗ Show the same moment twice - always advance forward` : ''}

✓ DO:
✓ Create a clear cause-and-effect chain: Panel 1 causes Panel 2, Panel 2 causes Panel 3, etc.
✓ Show progression of action, emotion, or dialogue through the panels
✓ Use panel transitions to show the passage of time or movement
✓ Make each panel feel like the natural "next moment" after the previous one
${isAutoContinue ? `✓ Always move the story FORWARD - never backward or in circles` : ''}

🎨 CRITICAL: CHARACTER COMPLETENESS IN PANELS:
⚠️ ABSOLUTELY FORBIDDEN - CHARACTER SPLITTING:
✗ NEVER split a character across two panels - each character must be COMPLETE within ONE panel
✗ NEVER cut a character in half by a panel border
✗ NEVER show part of a character in one panel and another part in an adjacent panel
✗ NEVER have a character's body crossing panel borders
✗ NEVER show a character's head in one panel and body in another panel

✓ REQUIRED - FULL CHARACTER RENDERING:
✓ Each character must be COMPLETELY drawn within a SINGLE panel
✓ If a character appears in a panel, they must be FULLY visible (head, body, limbs) within that panel's borders
✓ Panel borders must NEVER cut through any character's body, head, or limbs
✓ Characters can appear in multiple panels, but EACH appearance must be a COMPLETE, FULL character within that panel
✓ Use different camera angles or distances (close-up, medium shot, full body) to show the same character in different panels
✓ If showing a character moving between panels, show them COMPLETE in Panel 1, then COMPLETE in Panel 2 (different moment/position)

📐 PANEL BORDER RULES:
✓ Panel borders are CLEAR SEPARATORS - they must NOT intersect with any character
✓ If a character is near a panel border, ensure they are FULLY on one side or the other
✓ Use panel composition to frame characters completely within each panel's boundaries
✓ Each panel should be a self-contained visual unit with complete characters

💡 COMPOSITION TIPS:
• Use close-ups for one panel, full body shots for another - but ALWAYS show complete characters
• If a character is running across panels, show them COMPLETE in Panel 1 (starting position), then COMPLETE in Panel 2 (new position)
• Never use panel borders as "cut lines" through characters
• Think of each panel as a complete photograph - all characters must be fully visible
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

⚠️ CRITICAL COMPOSITION RULE - CHARACTER INTEGRITY:
✓ EVERY character must be COMPLETELY drawn within a SINGLE panel - NEVER split characters across panels
✓ Panel borders must NEVER cut through any character's body, head, or limbs
✓ If a character appears in a panel, they must be FULLY visible and complete within that panel's boundaries
✓ Characters can appear in multiple panels, but each appearance must be a COMPLETE, FULL character
✓ Use different camera angles (close-up, medium, full body) to show the same character in different panels while keeping them complete

${sessionHistory && sessionHistory.length > 0 ? `
⚠️ FINAL REMINDER: This page is part of an ongoing story. 
- Use previous pages as reference for character appearance, but feel free to adapt naturally
- Layout can vary between pages - use "${config.layout}" layout for this page, feel free to create visually interesting panel arrangements
- Focus on story flow and visual interest rather than rigid consistency matching
${config.autoContinueStory ? `
- AUTO-CONTINUE MODE: This page MUST continue from the LAST PANEL of page ${sessionHistory.length}
- Study the LAST PANEL of the previous page - that's where the story ended
- Your FIRST PANEL must show what happens IMMEDIATELY AFTER that last panel
- DO NOT repeat the same scene, action, or moment - always ADVANCE the story forward
- The story must MOVE FORWARD chronologically, not stay in the same place or loop back
` : ''}
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
