export enum MangaStyle {
  SHONEN = 'Shonen',
  SHOUJO = 'Shoujo',
  SEINEN = 'Seinen',
  JOSEI = 'Josei',
  WEBTOON = 'Modern Webtoon',
  MANHWA = 'Korean Manhwa',
  DIGITAL_PAINTING = 'Digital Painting',
  REALISTIC = 'Realistic Manga',
  CLEAN_LINE = 'Clean Line Art',
  CINEMATIC = 'Cinematic Style',
  SEMI_REALISTIC = 'Semi-Realistic',
}

export enum InkingStyle {
  GPEN = 'G-Pen',
  TACHIKAWA = 'Tachikawa Pen',
  BRUSH = 'Brush Ink',
  MARKER = 'Marker',
  DIGITAL = 'Digital',
  DIGITAL_PAINTING = 'Digital Painting',
  SOFT_BRUSH = 'Soft Brush',
  CLEAN_DIGITAL = 'Clean Digital',
  AIRBRUSH = 'Airbrush',
  PAINTERLY = 'Painterly',
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
  DYNAMIC_FREESTYLE = 'Dynamic Freestyle',
  ACTION_SEQUENCE = 'Action Sequence (5-7 Panels)',
  CONVERSATION = 'Conversation Layout',
  Z_PATTERN = 'Z-Pattern Flow',
  VERTICAL_STRIP = 'Vertical Strip',
  ASYMMETRIC = 'Asymmetric Mixed',
  CLIMAX_FOCUS = 'Climax Focus',
  WIDESCREEN = 'Widescreen Cinematic',
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

export interface ReferenceImage {
  url: string; // Base64 or URL
  enabled: boolean; // Whether to use this image in generation
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
  referenceImages?: (string | ReferenceImage)[]; // Support both old format (string) and new format (ReferenceImage)
  autoContinueStory?: boolean; // Auto-generate story continuation
  storyDirection?: string; // Story flow/direction for auto-continue
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
  config?: MangaConfig; // Store config including storyDirection
  selectedReferencePageIds?: string[]; // Page IDs selected as reference for continuation
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
  ownerId?: string;
  title: string;
  pages: GeneratedManga[];
  sessions: MangaSession[];
  currentSessionId?: string;
  preferences?: {
    leftWidth?: number;
    middleWidth?: number;
  };
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
  ownerDisplayName?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ProjectComment {
  id: string;
  ownerId: string;
  projectId: string;
  parentId?: string | null;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}
