'use client';

import { Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { StoryOutline } from './types';

interface PreviewDialogProps {
  open: boolean;
  outline: StoryOutline;
  onClose: () => void;
  onExport: () => void;
}

export default function PreviewDialog({
  open,
  outline,
  onClose,
  onExport,
}: PreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-500" />
            Story Outline Preview
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Review your complete story outline before exporting to studio
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">{outline.title || 'Untitled Story'}</h3>
            <Badge>{outline.genre}</Badge>
          </div>

          {outline.synopsis && (
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400 uppercase">Synopsis</Label>
              <p className="text-sm text-zinc-300">{outline.synopsis}</p>
            </div>
          )}

          {outline.setting && (
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400 uppercase">Setting</Label>
              <p className="text-sm text-zinc-300">{outline.setting}</p>
            </div>
          )}

          {outline.characters && (
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400 uppercase">Characters</Label>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{outline.characters}</p>
            </div>
          )}

          <Separator className="bg-zinc-800" />

          <div className="space-y-3">
            <Label className="text-xs text-zinc-400 uppercase">Panels ({outline.panels.length})</Label>
            {outline.panels.map(panel => (
              <div key={panel.id} className="p-3 rounded-lg bg-zinc-800/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                    Panel {panel.order}
                  </Badge>
                  <span className="text-sm font-medium text-white">{panel.title}</span>
                </div>
                {panel.description && (
                  <p className="text-xs text-zinc-400">{panel.description}</p>
                )}
                {panel.prompt && (
                  <div className="mt-2 p-2 rounded bg-zinc-900 text-xs text-zinc-300 font-mono">
                    {panel.prompt}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-700 text-zinc-300"
          >
            Close
          </Button>
          <Button
            onClick={onExport}
            disabled={outline.panels.length === 0}
            className="bg-amber-500 hover:bg-amber-600 text-black gap-2"
          >
            <ArrowRight size={16} />
            Export to Studio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
