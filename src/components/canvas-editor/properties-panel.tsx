'use client'

import { useState, useEffect } from 'react'
import { Settings, ChevronLeft, ChevronRight, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCanvasStore } from '@/lib/stores/canvas-store'
import { CanvasElement, DialogueElement, TextElement, ImageElement, PanelElement } from '@/lib/types/canvas'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const FONT_FAMILIES = [
  'Inter',
  'Bangers',
  'Comic Sans MS',
  'Arial',
  'Georgia',
  'Verdana',
  'Courier New',
]

const BUBBLE_STYLES = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'box', label: 'Box' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'thought', label: 'Thought' },
]

const TEXT_ALIGN_OPTIONS = [
  { value: 'left', label: '≡' },
  { value: 'center', label: '≡' },
  { value: 'right', label: '≡' },
]

export default function PropertiesPanel() {
  const { project, selectedElementIds, updateElement } = useCanvasStore()
  const [collapsed, setCollapsed] = useState(false)

  const currentPage = project.pages[project.currentPageIndex]
  const selectedElement = currentPage?.elements.find((e) =>
    selectedElementIds.includes(e.id)
  )

  if (collapsed) {
    return (
      <div className="h-full w-12 bg-zinc-900 border-l border-zinc-800 flex flex-col items-center py-4">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-400" />
        </button>
        <div className="mt-4">
          <Settings className="w-5 h-5 text-zinc-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
      <div className="flex border-b border-zinc-800">
        <button className="flex-1 py-3 px-4 text-sm font-medium text-purple-400 border-b-2 border-purple-500 flex items-center justify-center gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button
          onClick={() => setCollapsed(true)}
          className="p-3 hover:bg-zinc-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {!selectedElement ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              Select an element to edit its properties
            </div>
          ) : (
            <>
              {(selectedElement.type === 'text' || selectedElement.type === 'dialogue') && (
                <TextProperties element={selectedElement as TextElement | DialogueElement} />
              )}

              {selectedElement.type === 'dialogue' && (
                <DialogueProperties element={selectedElement as DialogueElement} />
              )}

              {selectedElement.type === 'image' && (
                <ImageProperties element={selectedElement as ImageElement} />
              )}

              {selectedElement.type === 'panel' && (
                <PanelProperties element={selectedElement as PanelElement} />
              )}

              <TransformProperties element={selectedElement} />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function TextProperties({ element }: { element: TextElement | DialogueElement }) {
  const { updateElement } = useCanvasStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-zinc-400">Font</Label>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400">
            <span className="font-bold text-sm">B</span>
          </button>
          <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400">
            <span className="italic text-sm">I</span>
          </button>
          <span className="text-xs text-zinc-500">Vertical</span>
          <div className="flex gap-1">
            {TEXT_ALIGN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateElement(element.id, { textAlign: opt.value as 'left' | 'center' | 'right' })}
                className={cn(
                  'p-1.5 rounded text-sm',
                  element.textAlign === opt.value
                    ? 'bg-purple-600 text-white'
                    : 'hover:bg-zinc-800 text-zinc-400'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={element.fontFamily}
          onChange={(e) => updateElement(element.id, { fontFamily: e.target.value })}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 bg-zinc-800 rounded-lg border border-zinc-700">
          <button
            onClick={() =>
              updateElement(element.id, { fontSize: Math.max(8, element.fontSize - 1) })
            }
            className="px-2 py-2 text-zinc-400 hover:text-white"
          >
            -
          </button>
          <span className="px-2 text-sm text-zinc-200">{element.fontSize.toFixed(3)}</span>
          <button
            onClick={() => updateElement(element.id, { fontSize: element.fontSize + 1 })}
            className="px-2 py-2 text-zinc-400 hover:text-white"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium',
            element.type === 'text'
              ? 'bg-zinc-800 text-zinc-400'
              : 'bg-zinc-800 text-zinc-400'
          )}
        >
          <span className="flex items-center justify-center gap-2">
            Aα<span>Text</span>
          </span>
        </button>
        <button className="flex-1 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400">
          <span className="flex items-center justify-center gap-2">
            □<span>Box</span>
          </span>
        </button>
        <button
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium',
            element.type === 'dialogue'
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-800 text-zinc-400'
          )}
        >
          <span className="flex items-center justify-center gap-2">
            💬<span>Bubble</span>
          </span>
        </button>
      </div>

      <Textarea
        value={element.content}
        onChange={(e) => updateElement(element.id, { content: e.target.value })}
        className="min-h-[100px] bg-zinc-800 border-zinc-700 text-zinc-200"
        placeholder="Enter text..."
      />

      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-zinc-600"
          style={{ backgroundColor: element.color }}
        />
        <span className="text-sm text-zinc-400">Color</span>
        <Input
          type="color"
          value={element.color}
          onChange={(e) => updateElement(element.id, { color: e.target.value })}
          className="w-12 h-8 p-0 border-none cursor-pointer"
        />
      </div>
    </div>
  )
}

function DialogueProperties({ element }: { element: DialogueElement }) {
  const { updateElement } = useCanvasStore()

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-zinc-400">Background</Label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">Background Color</span>
          <div
            className="w-6 h-6 rounded-full border-2 border-zinc-600 cursor-pointer"
            style={{ backgroundColor: element.backgroundColor }}
          />
          <Input
            type="color"
            value={element.backgroundColor}
            onChange={(e) => updateElement(element.id, { backgroundColor: e.target.value })}
            className="w-12 h-6 p-0 border-none cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Stroke Size</span>
            <span className="text-sm text-zinc-400">{element.strokeSize}</span>
          </div>
          <Slider
            value={[element.strokeSize]}
            onValueChange={([value]) => updateElement(element.id, { strokeSize: value })}
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-zinc-400">Effects</Label>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Stroke</span>
          <Switch
            checked={element.strokeSize > 0}
            onCheckedChange={(checked) =>
              updateElement(element.id, { strokeSize: checked ? 2 : 0 })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Add Tail To Speech Bubble</span>
          <Switch
            checked={element.hasTail}
            onCheckedChange={(checked) => updateElement(element.id, { hasTail: checked })}
          />
        </div>

        {element.hasTail && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Tail Angle</span>
                <span className="text-sm text-zinc-400">{element.tailAngle.toFixed(2)}</span>
              </div>
              <Slider
                value={[element.tailAngle]}
                onValueChange={([value]) => updateElement(element.id, { tailAngle: value })}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Tail Length</span>
                <span className="text-sm text-zinc-400">{element.tailLength}</span>
              </div>
              <Slider
                value={[element.tailLength]}
                onValueChange={([value]) => updateElement(element.id, { tailLength: value })}
                min={10}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ImageProperties({ element }: { element: ImageElement }) {
  const { updateElement } = useCanvasStore()

  return (
    <div className="space-y-4">
      <Label className="text-zinc-400">Image</Label>

      {element.src ? (
        <div className="relative rounded-lg overflow-hidden border border-zinc-700">
          <img
            src={element.src}
            alt=""
            className="w-full h-32 object-cover"
          />
          <button
            onClick={() => updateElement(element.id, { src: '' })}
            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-md text-white text-xs"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center">
          <p className="text-sm text-zinc-500">No image selected</p>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-zinc-400 text-sm">Object Fit</Label>
        <div className="flex gap-2">
          {(['cover', 'contain', 'fill'] as const).map((fit) => (
            <button
              key={fit}
              onClick={() => updateElement(element.id, { objectFit: fit })}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm capitalize',
                element.objectFit === fit
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              )}
            >
              {fit}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Opacity</span>
          <span className="text-sm text-zinc-400">{Math.round(element.opacity * 100)}%</span>
        </div>
        <Slider
          value={[element.opacity]}
          onValueChange={([value]) => updateElement(element.id, { opacity: value })}
          min={0}
          max={1}
          step={0.01}
          className="w-full"
        />
      </div>
    </div>
  )
}

function PanelProperties({ element }: { element: PanelElement }) {
  const { updateElement } = useCanvasStore()

  return (
    <div className="space-y-4">
      <Label className="text-zinc-400">Panel</Label>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">Background</span>
          <div
            className="w-6 h-6 rounded border-2 border-zinc-600 cursor-pointer"
            style={{ backgroundColor: element.backgroundColor }}
          />
          <Input
            type="color"
            value={element.backgroundColor}
            onChange={(e) => updateElement(element.id, { backgroundColor: e.target.value })}
            className="w-12 h-6 p-0 border-none cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">Border</span>
          <div
            className="w-6 h-6 rounded border-2 border-zinc-600 cursor-pointer"
            style={{ backgroundColor: element.borderColor }}
          />
          <Input
            type="color"
            value={element.borderColor}
            onChange={(e) => updateElement(element.id, { borderColor: e.target.value })}
            className="w-12 h-6 p-0 border-none cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Border Width</span>
          <span className="text-sm text-zinc-400">{element.borderWidth}px</span>
        </div>
        <Slider
          value={[element.borderWidth]}
          onValueChange={([value]) => updateElement(element.id, { borderWidth: value })}
          min={0}
          max={10}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Border Radius</span>
          <span className="text-sm text-zinc-400">{element.borderRadius}px</span>
        </div>
        <Slider
          value={[element.borderRadius]}
          onValueChange={([value]) => updateElement(element.id, { borderRadius: value })}
          min={0}
          max={50}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  )
}

function TransformProperties({ element }: { element: CanvasElement }) {
  const { updateElement, moveElement, resizeElement } = useCanvasStore()

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-800">
      <Label className="text-zinc-400">Transform</Label>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">X</Label>
          <Input
            type="number"
            value={Math.round(element.transform.position.x)}
            onChange={(e) =>
              moveElement(element.id, {
                x: Number(e.target.value),
                y: element.transform.position.y,
              })
            }
            className="bg-zinc-800 border-zinc-700 text-zinc-200"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">Y</Label>
          <Input
            type="number"
            value={Math.round(element.transform.position.y)}
            onChange={(e) =>
              moveElement(element.id, {
                x: element.transform.position.x,
                y: Number(e.target.value),
              })
            }
            className="bg-zinc-800 border-zinc-700 text-zinc-200"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">Width</Label>
          <Input
            type="number"
            value={Math.round(element.transform.size.width)}
            onChange={(e) =>
              resizeElement(element.id, {
                width: Number(e.target.value),
                height: element.transform.size.height,
              })
            }
            className="bg-zinc-800 border-zinc-700 text-zinc-200"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">Height</Label>
          <Input
            type="number"
            value={Math.round(element.transform.size.height)}
            onChange={(e) =>
              resizeElement(element.id, {
                width: element.transform.size.width,
                height: Number(e.target.value),
              })
            }
            className="bg-zinc-800 border-zinc-700 text-zinc-200"
          />
        </div>
      </div>
    </div>
  )
}
