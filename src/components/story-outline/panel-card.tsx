'use client';

import {
  Trash2,
  GripVertical,
  Wand2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { MangaStyle, PanelLayout } from '@/lib/types';
import { StoryPanel } from './types';

interface PanelCardProps {
  panel: StoryPanel;
  index: number;
  aiGenerating: string | null;
  onUpdate: (panelId: string, updates: Partial<StoryPanel>) => void;
  onRemove: (panelId: string) => void;
  onToggleExpanded: (panelId: string) => void;
  onGenerateAI: (panelId: string) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
}

export default function PanelCard({
  panel,
  index,
  aiGenerating,
  onUpdate,
  onRemove,
  onToggleExpanded,
  onGenerateAI,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: PanelCardProps) {
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(panel.prompt);
    toast.success('Prompt copied!');
  };

  return (
    <Card
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-all cursor-move",
        panel.isExpanded && "ring-1 ring-amber-500/30"
      )}
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-zinc-600" />
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            Panel {panel.order}
          </Badge>
          <Input
            value={panel.title}
            onChange={(e) => onUpdate(panel.id, { title: e.target.value })}
            placeholder="Panel title..."
            className="flex-1 bg-transparent border-none text-white font-medium px-0 h-auto focus-visible:ring-0"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onGenerateAI(panel.id)}
              disabled={aiGenerating === panel.id}
              className="h-8 w-8 text-zinc-400 hover:text-amber-400"
            >
              {aiGenerating === panel.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Wand2 size={14} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(panel.id)}
              className="h-8 w-8 text-zinc-400 hover:text-red-400"
            >
              <Trash2 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleExpanded(panel.id)}
              className="h-8 w-8 text-zinc-400"
            >
              {panel.isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {panel.isExpanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400 uppercase">Description</Label>
              <Textarea
                value={panel.description}
                onChange={(e) => onUpdate(panel.id, { description: e.target.value })}
                placeholder="Describe what happens in this panel..."
                className="bg-zinc-800/50 border-zinc-700 text-white min-h-24 resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400 uppercase">AI Prompt</Label>
                {panel.aiSuggestion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPrompt}
                    className="h-6 text-xs text-zinc-500 hover:text-zinc-300 gap-1"
                  >
                    <Copy size={12} />
                    Copy
                  </Button>
                )}
              </div>
              <Textarea
                value={panel.prompt}
                onChange={(e) => onUpdate(panel.id, { prompt: e.target.value })}
                placeholder="Generated prompt will appear here, or write your own..."
                className={cn(
                  "bg-zinc-800/50 border-zinc-700 text-white min-h-24 resize-none",
                  panel.aiSuggestion && "border-amber-500/30"
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400 uppercase">Style</Label>
              <Select
                value={panel.style}
                onValueChange={(value) => onUpdate(panel.id, { style: value })}
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {Object.values(MangaStyle).map(style => (
                    <SelectItem key={style} value={style} className="text-zinc-200">
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-zinc-400 uppercase">Layout</Label>
              <Select
                value={panel.layout}
                onValueChange={(value) => onUpdate(panel.id, { layout: value })}
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {Object.values(PanelLayout).map(layout => (
                    <SelectItem key={layout} value={layout} className="text-zinc-200">
                      {layout}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-zinc-400 uppercase">Notes</Label>
              <Input
                value={panel.notes}
                onChange={(e) => onUpdate(panel.id, { notes: e.target.value })}
                placeholder="Additional notes..."
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
