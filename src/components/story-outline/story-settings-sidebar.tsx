'use client';

import { Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { StoryOutline, GENRES } from './types';

interface StorySettingsSidebarProps {
  outline: StoryOutline;
  savedOutlines: StoryOutline[];
  isMobile: boolean;
  onOutlineChange: (updates: Partial<StoryOutline>) => void;
  onLoadOutline: (id: string) => void;
  onDeleteOutline: (id: string) => void;
}

export default function StorySettingsSidebar({
  outline,
  savedOutlines,
  isMobile,
  onOutlineChange,
  onLoadOutline,
  onDeleteOutline,
}: StorySettingsSidebarProps) {
  return (
    <aside className={cn(
      "w-80 bg-zinc-900/50 border-r border-zinc-800 flex flex-col",
      isMobile && "hidden"
    )}>
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Story Settings</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-zinc-400 uppercase">Title</Label>
          <Input
            value={outline.title}
            onChange={(e) => onOutlineChange({ title: e.target.value })}
            placeholder="Enter story title..."
            className="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-zinc-400 uppercase">Genre</Label>
          <Select
            value={outline.genre}
            onValueChange={(value) => onOutlineChange({ genre: value })}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {GENRES.map(genre => (
                <SelectItem key={genre} value={genre} className="text-zinc-200">
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-zinc-400 uppercase">Synopsis</Label>
          <Textarea
            value={outline.synopsis}
            onChange={(e) => onOutlineChange({ synopsis: e.target.value })}
            placeholder="Brief overview of your story..."
            className="bg-zinc-800 border-zinc-700 text-white min-h-20 resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-zinc-400 uppercase">Setting</Label>
          <Textarea
            value={outline.setting}
            onChange={(e) => onOutlineChange({ setting: e.target.value })}
            placeholder="Describe the world, time period, locations..."
            className="bg-zinc-800 border-zinc-700 text-white min-h-20 resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-zinc-400 uppercase">Characters</Label>
          <Textarea
            value={outline.characters}
            onChange={(e) => onOutlineChange({ characters: e.target.value })}
            placeholder="List main characters with descriptions..."
            className="bg-zinc-800 border-zinc-700 text-white min-h-24 resize-none"
          />
        </div>

        <Separator className="bg-zinc-800" />

        <div className="space-y-2">
          <Label className="text-xs text-zinc-400 uppercase">Saved Outlines</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {savedOutlines.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-2">No saved outlines</p>
            ) : (
              savedOutlines.map(saved => (
                <div
                  key={saved.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors",
                    saved.id === outline.id && "ring-1 ring-amber-500"
                  )}
                >
                  <button
                    onClick={() => onLoadOutline(saved.id)}
                    className="flex-1 text-left text-sm text-zinc-300 truncate"
                  >
                    {saved.title || 'Untitled'}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteOutline(saved.id)}
                    className="h-6 w-6 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
