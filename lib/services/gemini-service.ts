import { GoogleGenAI } from "@google/genai";
import { MANGA_SYSTEM_INSTRUCTION, LAYOUT_PROMPTS } from "@/lib/constants";
import { MangaConfig, GeneratedManga } from "@/lib/types";

export const generateMangaImage = async (
  prompt: string,
  config: MangaConfig,
  sessionHistory?: GeneratedManga[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'AIzaSyDFbFT3W4yQ_Ad8I1CLz80otq7uJ7gf4_4' });
  
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
    
    const recentPages = sessionHistory.slice(-3);
    recentPages.forEach((page, idx) => {
      continuityInstructions += `\nPage ${sessionHistory.length - recentPages.length + idx + 1}: "${page.prompt}"\n`;
    });
    
    continuityInstructions += `\n🎯 CONSISTENCY REQUIREMENTS:\n`;
    continuityInstructions += `✓ Characters MUST look IDENTICAL to previous pages (same face, hair, eyes, body, clothes)\n`;
    continuityInstructions += `✓ Maintain the SAME art style, line weight, and visual aesthetic\n`;
    continuityInstructions += `✓ Continue the same ${config.style} style and ${config.inking} inking technique\n`;
    continuityInstructions += `✓ Keep the same level of detail and drawing quality\n`;
    continuityInstructions += `✓ If characters wore specific outfits before, they MUST wear the same unless story requires change\n`;
    continuityInstructions += `✓ Background and setting should match the established world\n`;
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
  if (config.referenceImages && config.referenceImages.length > 0) {
    referenceImageInstructions = `
🖼️ REFERENCE IMAGES PROVIDED (${config.referenceImages.length} image${config.referenceImages.length > 1 ? 's' : ''}):
⚠️ STUDY THESE REFERENCE IMAGES CAREFULLY:
• Use these images as visual references for character designs, art style, clothing, and aesthetics
• Maintain consistency with the visual elements shown in these references
• If characters are shown, use their exact appearance (hairstyle, face, clothing, proportions)
• If art style examples are shown, match that style in your generation
• These references are the PRIMARY source for visual consistency
`;
  }

  const enhancedPrompt = `
╔═══════════════════════════════════════════════════════════════════╗
║                    MANGA PAGE GENERATION REQUEST                   ║
╚═══════════════════════════════════════════════════════════════════╝

📝 CURRENT SCENE TO ILLUSTRATE:
${prompt}

🎨 TECHNICAL SPECIFICATIONS:
• Art Style: ${config.style}
• Inking Technique: ${config.inking}
• Screentone Density: ${config.screentone}
• Color Mode: ${config.useColor ? 'Full Color Manga/Anime Style' : 'Traditional Black and White Manga Ink'}

🔲 PANEL LAYOUT - ${config.layout}:
${LAYOUT_PROMPTS[config.layout] || config.layout}

${referenceImageInstructions}

${continuityInstructions}

${dialogueInstructions}

📐 COMPOSITION RULES:
${config.layout === 'Single Panel' || config.layout === 'Dramatic Spread'
  ? '⚠️ NO PANEL BORDERS - This is a full-page illustration without divisions'
  : `⚠️ MUST HAVE ${config.layout.includes('Double') ? 'TWO' : config.layout.includes('Triple') ? 'THREE' : 'FOUR'} CLEAR PANEL BORDERS - Draw distinct black borders separating each panel`}
✓ All content must fit within one high-resolution page image
✓ Apply dynamic angles and perspectives for visual impact
✓ Use authentic manga visual language (speed lines, impact frames, etc.)
${config.screentone !== 'None' ? `✓ Apply ${config.screentone.toLowerCase()} screentone for depth and atmosphere` : ''}

${sessionHistory && sessionHistory.length > 0 ? `
⚠️ FINAL REMINDER: This page is part of an ongoing story. Characters MUST look exactly the same as in previous pages. Check character descriptions and previous scenes carefully before drawing!
` : ''}
  `;

  try {
    // Prepare content parts with text and reference images
    const contentParts: any[] = [{ text: enhancedPrompt }];
    
    // Add reference images if provided
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

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Error generating manga image:", error);
    throw error;
  }
};
