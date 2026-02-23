'use client';

import { Plus, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoryPanel } from './types';
import PanelCard from './panel-card';

interface PanelListProps {
  panels: StoryPanel[];
  loading: boolean;
  aiGenerating: string | null;
  onAddPanel: () => void;
  onUpdatePanel: (panelId: string, updates: Partial<StoryPanel>) => void;
  onRemovePanel: (panelId: string) => void;
  onTogglePanelExpanded: (panelId: string) => void;
  onGenerateAI: (panelId: string) => void;
  onGenerateAllPrompts: () => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
}

export default function PanelList({
  panels,
  loading,
  aiGenerating,
  onAddPanel,
  onUpdatePanel,
  onRemovePanel,
  onTogglePanelExpanded,
  onGenerateAI,
  onGenerateAllPrompts,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: PanelListProps) {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-400 to-amber-600 text-black font-bold text-sm flex items-center justify-center shrink-0 shadow-lg">
            {panels.length}
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Panel Outline</h2>
            <p className="text-xs text-zinc-500">
              {panels.length === 0
                ? 'Add panels to start planning your story'
                : `${panels.length} panel${panels.length > 1 ? 's' : ''} planned`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateAllPrompts}
            disabled={loading || panels.length === 0}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span className="hidden sm:inline">Generate All Prompts</span>
          </Button>
          <Button
            onClick={onAddPanel}
            className="bg-amber-500 hover:bg-amber-600 text-black gap-2"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Panel</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {panels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">No panels yet</h3>
            <p className="text-sm text-zinc-500 max-w-md mb-4">
              Start by adding panels to plan your story. Each panel represents a scene or page in your manga.
            </p>
            <Button
              onClick={onAddPanel}
              className="bg-amber-500 hover:bg-amber-600 text-black gap-2"
            >
              <Plus size={16} />
              Add First Panel
            </Button>
          </div>
        ) : (
          panels.map((panel, index) => (
            <PanelCard
              key={panel.id}
              panel={panel}
              index={index}
              aiGenerating={aiGenerating}
              onUpdate={onUpdatePanel}
              onRemove={onRemovePanel}
              onToggleExpanded={onTogglePanelExpanded}
              onGenerateAI={onGenerateAI}
              onDragStart={onDragStart}
              onDragEnter={onDragEnter}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </main>
  );
}
