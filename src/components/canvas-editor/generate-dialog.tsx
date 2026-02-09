'use client'

import { useState, useCallback, useRef } from 'react'
import { X, Sparkles, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useCanvasStore, createImageElement } from '@/lib/stores/canvas-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STYLES = [
  { value: 'manhwa', label: 'Manhwa' },
  { value: 'manga', label: 'Manga' },
  { value: 'anime', label: 'Anime' },
  { value: 'webtoon', label: 'Webtoon' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'cinematic', label: 'Cinematic' },
]

interface GenerateDialogProps {
  open: boolean
  onClose: () => void
  targetPanelId?: string
}

export default function GenerateDialog({ open, onClose, targetPanelId }: GenerateDialogProps) {
  const { project, addElement, updateElement, generateId } = useCanvasStore()
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('manhwa')
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const currentPage = project.pages[project.currentPageIndex]
  const targetPanel = targetPanelId
    ? currentPage?.elements.find((e) => e.id === targetPanelId)
    : null

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${style} style, ${prompt}`,
          config: {
            style,
            aspectRatio: '3:4',
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to generate')

      const data = await response.json()
      const imageUrl = data.imageUrl || data.url

      if (imageUrl) {
        setGeneratedImage(imageUrl)
      }
    } catch (error) {
      toast.error('Failed to generate image')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCanvas = () => {
    if (!generatedImage) return

    if (targetPanel && targetPanel.type === 'panel') {
      const newImage = createImageElement(
        generateId(),
        generatedImage,
        targetPanel.transform.position,
        targetPanel.transform.size
      )
      newImage.parentId = targetPanel.id
      addElement(newImage)
      updateElement(targetPanel.id, {
        children: [...(targetPanel.children || []), newImage.id],
      } as any)
    } else {
      const newImage = createImageElement(
        generateId(),
        generatedImage,
        { x: 100, y: 100 },
        { width: 300, height: 400 }
      )
      addElement(newImage)
    }

    toast.success('Image added to canvas')
    setGeneratedImage(null)
    setPrompt('')
    onClose()
  }

  const handleRegenerate = () => {
    setGeneratedImage(null)
    handleGenerate()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Generate Image
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {targetPanel
              ? 'Generate an image for the selected panel'
              : 'Create a new image with AI'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your scene... e.g., 'A young warrior with blue hair standing on a cliff, wind blowing'"
              className="min-h-[120px] bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {STYLES.map((s) => (
                  <SelectItem
                    key={s.value}
                    value={s.value}
                    className="text-zinc-200 focus:bg-zinc-700 focus:text-white"
                  >
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {generatedImage && (
            <div className="space-y-2">
              <Label className="text-zinc-300">Preview</Label>
              <div className="relative rounded-lg overflow-hidden border border-zinc-700">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-64 object-contain bg-zinc-800"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>

            {generatedImage ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Regenerate
                </Button>
                <Button
                  onClick={handleAddToCanvas}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
                >
                  Add to Canvas
                </Button>
              </>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2 min-w-[120px]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
