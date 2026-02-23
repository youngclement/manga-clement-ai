import { MangaStyle, PanelLayout } from '@/lib/types';

export interface StoryPanel {
  id: string;
  order: number;
  title: string;
  description: string;
  prompt: string;
  style: string;
  layout: string;
  notes: string;
  isExpanded: boolean;
  aiSuggestion?: string;
}

export interface StoryOutline {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  setting: string;
  characters: string;
  panels: StoryPanel[];
  createdAt: number;
  updatedAt: number;
}

export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Supernatural', 'Thriller'
];

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const createEmptyOutline = (): StoryOutline => ({
  id: generateId(),
  title: '',
  synopsis: '',
  genre: 'Action',
  setting: '',
  characters: '',
  panels: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const createNewPanel = (order: number): StoryPanel => ({
  id: generateId(),
  order,
  title: `Panel ${order}`,
  description: '',
  prompt: '',
  style: MangaStyle.MANHWA_3D,
  layout: PanelLayout.SINGLE,
  notes: '',
  isExpanded: true,
});
