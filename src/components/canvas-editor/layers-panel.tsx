'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Plus,
  Layers,
  Image as ImageIcon,
  Type,
  MessageCircle,
  Square,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCanvasStore } from '@/lib/stores/canvas-store'
import { CanvasElement } from '@/lib/types/canvas'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

export default function LayersPanel() {
  const {
    project,
    selectedElementIds,
    selectElement,
    removeElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    updateElement,
  } = useCanvasStore()

  const [collapsed, setCollapsed] = useState(false)
  const currentPage = project.pages[project.currentPageIndex]

  const sortedElements = [...(currentPage?.elements || [])].sort(
    (a, b) => b.transform.zIndex - a.transform.zIndex
  )

  const getElementIcon = (type: CanvasElement['type']) => {
    switch (type) {
      case 'panel':
        return <Square className="w-4 h-4" />
      case 'image':
        return <ImageIcon className="w-4 h-4" />
      case 'text':
        return <Type className="w-4 h-4" />
      case 'dialogue':
        return <MessageCircle className="w-4 h-4" />
      default:
        return <Layers className="w-4 h-4" />
    }
  }

  const getElementPreview = (element: CanvasElement) => {
    switch (element.type) {
      case 'text':
      case 'dialogue':
        return element.content.slice(0, 20) + (element.content.length > 20 ? '...' : '')
      case 'image':
        return element.src ? 'Image' : 'Empty'
      case 'panel':
        return `${element.children.length} items`
      default:
        return ''
    }
  }

  if (collapsed) {
    return (
      <div className="h-full w-12 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        </button>
        <div className="mt-4">
          <Layers className="w-5 h-5 text-zinc-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">Layers</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Pages */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 uppercase">Pages</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => useCanvasStore.getState().addPage()}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {project.pages.map((page, idx) => (
            <button
              key={page.id}
              onClick={() => useCanvasStore.getState().setCurrentPage(idx)}
              className={cn(
                'w-8 h-8 rounded-md text-xs font-medium transition-all',
                idx === project.currentPageIndex
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Elements */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedElements.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No elements yet
            </div>
          ) : (
            sortedElements.map((element) => (
              <div
                key={element.id}
                onClick={() => selectElement(element.id)}
                className={cn(
                  'group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                  selectedElementIds.includes(element.id)
                    ? 'bg-purple-600/20 border border-purple-500/50'
                    : 'hover:bg-zinc-800 border border-transparent'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center',
                    element.type === 'panel' && 'bg-blue-500/20 text-blue-400',
                    element.type === 'image' && 'bg-green-500/20 text-green-400',
                    element.type === 'text' && 'bg-yellow-500/20 text-yellow-400',
                    element.type === 'dialogue' && 'bg-purple-500/20 text-purple-400'
                  )}
                >
                  {element.type === 'image' && element.src ? (
                    <img
                      src={element.src}
                      className="w-full h-full object-cover rounded-md"
                      alt=""
                    />
                  ) : (
                    getElementIcon(element.type)
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{element.name}</div>
                  <div className="text-xs text-zinc-500 truncate">
                    {getElementPreview(element)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateElement(element.id, { visible: !element.visible })
                    }}
                    className="p-1 hover:bg-zinc-700 rounded"
                  >
                    {element.visible ? (
                      <Eye className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateElement(element.id, { locked: !element.locked })
                    }}
                    className="p-1 hover:bg-zinc-700 rounded"
                  >
                    {element.locked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Bottom Actions */}
      {selectedElementIds.length > 0 && (
        <div className="p-2 border-t border-zinc-800 flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => duplicateElement(selectedElementIds[0])}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => bringToFront(selectedElementIds[0])}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => sendToBack(selectedElementIds[0])}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => removeElement(selectedElementIds[0])}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
