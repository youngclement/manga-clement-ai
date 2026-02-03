'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useCanvasStore } from '@/lib/stores/canvas-store'

// Components
import Toolbar from '@/components/canvas-editor/toolbar'
import LayersPanel from '@/components/canvas-editor/layers-panel'
import PropertiesPanel from '@/components/canvas-editor/properties-panel'
import CanvasWorkspace from '@/components/canvas-editor/canvas-workspace'
import GenerateDialog from '@/components/canvas-editor/generate-dialog'

export default function CanvasEditorPage() {
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [targetPanelId, setTargetPanelId] = useState<string | undefined>()
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleGenerateForPanel = (panelId: string) => {
    setTargetPanelId(panelId)
    setGenerateDialogOpen(true)
  }

  const handleGenerate = () => {
    setTargetPanelId(undefined)
    setGenerateDialogOpen(true)
  }

  const handleExport = async () => {
    const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement
    if (!canvasElement) {
      toast.error('Canvas not found')
      return
    }

    try {
      toast.loading('Exporting...')

      const canvas = await html2canvas(canvasElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      })

      // Export as PNG
      const link = document.createElement('a')
      link.download = `manga-page-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      toast.dismiss()
      toast.success('Exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.dismiss()
      toast.error('Failed to export')
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Top Toolbar */}
      <Toolbar onExport={handleExport} onGenerate={handleGenerate} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Layers */}
        <LayersPanel />

        {/* Center - Canvas Workspace */}
        <CanvasWorkspace onGenerateImage={handleGenerateForPanel} />

        {/* Right Panel - Properties */}
        <PropertiesPanel />
      </div>

      {/* Generate Dialog */}
      <GenerateDialog
        open={generateDialogOpen}
        onClose={() => {
          setGenerateDialogOpen(false)
          setTargetPanelId(undefined)
        }}
        targetPanelId={targetPanelId}
      />
    </div>
  )
}
