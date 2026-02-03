'use client'

import {
  MousePointer2,
  Hand,
  Square,
  Type,
  MessageCircle,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Download,
  Plus,
  Minus,
  Sparkles,
  Pencil,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCanvasStore } from '@/lib/stores/canvas-store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)', shortcut: 'V' },
  { id: 'pan', icon: Hand, label: 'Pan (H)', shortcut: 'H' },
  { id: 'panel', icon: Square, label: 'Panel (P)', shortcut: 'P' },
  { id: 'text', icon: Type, label: 'Text (T)', shortcut: 'T' },
  { id: 'dialogue', icon: MessageCircle, label: 'Dialogue (D)', shortcut: 'D' },
] as const

interface ToolbarProps {
  onExport?: () => void
  onGenerate?: () => void
}

export default function Toolbar({ onExport, onGenerate }: ToolbarProps) {
  const { tool, setTool, zoom, setZoom } = useCanvasStore()

  const handleZoomIn = () => setZoom(Math.min(3, zoom + 0.1))
  const handleZoomOut = () => setZoom(Math.max(0.1, zoom - 0.1))
  const handleZoomReset = () => setZoom(1)

  return (
    <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
      {/* Left: Tools */}
      <div className="flex items-center gap-1 bg-zinc-800/50 rounded-xl p-1">
        <TooltipProvider delayDuration={300}>
          {TOOLS.map((t) => (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTool(t.id as typeof tool)}
                  className={cn(
                    'p-2.5 rounded-lg transition-all',
                    tool === t.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                  )}
                >
                  <t.icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
              >
                <Pencil className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Draw (Coming soon)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Center: Zoom Controls */}
      <div className="flex items-center gap-2 bg-zinc-800/50 rounded-xl p-1">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Zoom Out</p>
            </TooltipContent>
          </Tooltip>

          <button
            onClick={handleZoomReset}
            className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white font-medium min-w-[60px] text-center"
          >
            {Math.round(zoom * 100)}%
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Zoom In</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              >
                <Undo2 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Undo (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              >
                <Redo2 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Redo (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="h-6 mx-2" />

        <Button
          onClick={onGenerate}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate
        </Button>

        <Button
          onClick={onExport}
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
    </div>
  )
}
