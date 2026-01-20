export enum MangaStyle {
  SHONEN = 'Shonen',
  SHOUJO = 'Shoujo',
  SEINEN = 'Seinen',
  JOSEI = 'Josei',
}

export enum InkingStyle {
  GPEN = 'G-Pen',
  TACHIKAWA = 'Tachikawa Pen',
  BRUSH = 'Brush Ink',
  MARKER = 'Marker',
  DIGITAL = 'Digital',
}

export enum ScreentoneDensity {
  NONE = 'None',
  LIGHT = 'Light',
  MEDIUM = 'Medium',
  HEAVY = 'Heavy',
}

export enum AspectRatio {
  PORTRAIT = '3:4',
  SQUARE = '1:1',
  WIDESCREEN = '16:9',
}

export enum PanelLayout {
  SINGLE = 'Single Panel',
  DOUBLE = 'Double Panel',
  TRIPLE = 'Triple Panel',
  GRID = 'Grid Layout',
  DRAMATIC = 'Dramatic Spread',
}

export enum DialogueDensity {
  NONE = 'No Dialogue',
  LIGHT = 'Light Dialogue',
  MEDIUM = 'Medium Dialogue',
  HEAVY = 'Heavy Dialogue',
}

export enum Language {
  ENGLISH = 'English',
  JAPANESE = 'Japanese',
  VIETNAMESE = 'Vietnamese',
  KOREAN = 'Korean',
  CHINESE = 'Chinese',
  SPANISH = 'Spanish',
  FRENCH = 'French',
}

export interface MangaConfig {
  style: MangaStyle | string;
  inking: InkingStyle | string;
  screentone: ScreentoneDensity | string;
  layout: PanelLayout | string;
  aspectRatio: AspectRatio | string;
  useColor: boolean;
  dialogueDensity: DialogueDensity | string;
  language: Language | string;
  context?: string;
  referenceImages?: string[]; // Base64 or URLs
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: number;
  config?: MangaConfig;
}

export interface MangaSession {
  id: string;
  name: string;
  context: string;
  pages: GeneratedManga[];
  chatHistory: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface GeneratedManga {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  config: MangaConfig;
  markedForExport?: boolean;
}

export interface MangaProject {
  id: string;
  title: string;
  pages: GeneratedManga[];
  sessions: MangaSession[];
  currentSessionId?: string;
}
