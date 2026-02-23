const MAX_SHORT_PROMPT_LENGTH = 500;
const MAX_LINE_LENGTH = 200;
const MIN_INSTRUCTION_KEYWORD_COUNT = 5;

const INSTRUCTION_PREFIXES = [
  /^📝\s*USER\s*PROMPT[:\s]*/i,
  /^⚠️⚠️⚠️\s*CRITICAL[:\s]*/i,
  /^📖\s*STORY\s*CONTINUATION[:\s]*/i,
  /^🎨\s*TECHNICAL\s*SPECIFICATIONS[:\s]*/i,
  /^🔞\s*CONTENT\s*POLICY[:\s]*/i,
  /^⚠️\s*ENGLISH\s*TEXT\s*ACCURACY[:\s]*/i,
  /^MANGA\s*PAGE\s*GENERATION\s*REQUEST[:\s]*/i,
];

const INSTRUCTION_KEYWORDS = [
  'CRITICAL', 'REQUIREMENTS', 'MUST', 'SHOULD', 'CHARACTER CONSISTENCY',
  'TEXT ACCURACY', 'PANEL LAYOUT', 'STORY CONTINUITY', 'VISUAL REFERENCE',
  'TECHNICAL SPECIFICATIONS', 'CONTENT POLICY', 'DIALOGUE', 'COMPOSITION'
];

const INSTRUCTION_LINE_MARKERS = ['CRITICAL', 'MUST', 'REQUIREMENTS', '⚠️', '✓', '✗', 'STEP', 'CHECKLIST'];

function countKeywords(text: string, keywords: string[]): number {
  const upperText = text.toUpperCase();
  return keywords.filter(keyword => upperText.includes(keyword)).length;
}

function isInstructionLine(line: string): boolean {
  const upperLine = line.toUpperCase();
  return INSTRUCTION_LINE_MARKERS.some(marker => upperLine.includes(marker)) || line.length > MAX_LINE_LENGTH;
}

function stripPrefixes(text: string): string {
  return INSTRUCTION_PREFIXES.reduce((result, regex) => result.replace(regex, ''), text);
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/[╔╗╚╝║═]/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

function extractUserLines(text: string): string {
  const lines = text.split('\n');
  const userLines = lines.filter(line => !isInstructionLine(line) && line.trim().length > 0);
  return userLines.length > 0 ? userLines.join('\n').trim() : text;
}

export function cleanUserPrompt(prompt: string): string {
  if (!prompt) return '';

  let cleaned = normalizeWhitespace(prompt.trim());
  cleaned = stripPrefixes(cleaned);

  if (cleaned.length > MAX_SHORT_PROMPT_LENGTH) {
    const instructionCount = countKeywords(cleaned, INSTRUCTION_KEYWORDS);
    if (instructionCount > MIN_INSTRUCTION_KEYWORD_COUNT) {
      cleaned = extractUserLines(cleaned);
    }
  }

  return cleaned.trim().replace(/\s+/g, ' ');
}

const AUTO_GENERATED_PATTERNS = [
  /^Continue the story naturally/i,
  /^📖\s*(STORY|BATCH)\s*CONTINUATION/i,
  /^Continue the story naturally from page/i,
];

const USER_PROMPT_KEYWORDS = [
  'CRITICAL', 'REQUIREMENTS', 'MUST', 'CHARACTER CONSISTENCY',
  'TEXT ACCURACY', 'PANEL LAYOUT', 'STORY CONTINUITY'
];

export function isUserProvidedPrompt(prompt: string | undefined | null): boolean {
  if (!prompt?.trim()) return false;

  const trimmed = prompt.trim();

  if (AUTO_GENERATED_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return false;
  }

  if (trimmed.length > MAX_SHORT_PROMPT_LENGTH && countKeywords(trimmed, USER_PROMPT_KEYWORDS) > 3) {
    return false;
  }

  return true;
}

const MAX_INTENT_LENGTH = 300;
const MAX_SENTENCE_LENGTH = 200;

export function extractUserIntent(prompt: string): string {
  const cleaned = cleanUserPrompt(prompt);

  if (cleaned.length <= MAX_INTENT_LENGTH) {
    return cleaned;
  }

  const sentences = cleaned.split(/[.!?]\s+/);
  const firstSentence = sentences[0];

  if (firstSentence && firstSentence.length < MAX_SENTENCE_LENGTH) {
    return firstSentence.trim();
  }

  return cleaned.substring(0, MAX_SENTENCE_LENGTH).trim();
}

