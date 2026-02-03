'use client'

import { useState, useRef, useCallback, useEffect, MouseEvent as ReactMouseEvent } from 'react'
import { cn } from '@/lib/utils'
import { useCanvasStore, createPanelElement, createImageElement, createTextElement, createDialogueElement } from '@/lib/stores/canvas-store'
import { CanvasElement, DialogueElement, Position } from '@/lib/types/canvas'

interface CanvasWorkspaceProps {
  onGenerateImage?: (panelId: string) => void
}

export default function CanvasWorkspace({ onGenerateImage }: CanvasWorkspaceProps) {
  const {
    project,
    selectedElementIds,
    zoom,
    panOffset,
    tool,
    selectElement,
    deselectAll,
    moveElement,
    resizeElement,
    addElement,
    setZoom,
    setPanOffset,
    setTool,
    generateId,
  } = useCanvasStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState<Position>({ x: 0, y: 0 })
  const [elementStartSize, setElementStartSize] = useState({ width: 0, height: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 })

  const currentPage = project.pages[project.currentPageIndex]

  // Zoom with wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom(zoom + delta)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [zoom, setZoom])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0) {
          selectedElementIds.forEach((id) => {
            useCanvasStore.getState().removeElement(id)
          })
        }
      }
      if (e.key === 'Escape') {
        deselectAll()
        setTool('select')
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        if (selectedElementIds.length > 0) {
          useCanvasStore.getState().duplicateElement(selectedElementIds[0])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementIds, deselectAll, setTool])

  const getMousePosition = useCallback(
    (e: ReactMouseEvent): Position => {
      const container = containerRef.current
      if (!container) return { x: 0, y: 0 }

      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left - panOffset.x) / zoom
      const y = (e.clientY - rect.top - panOffset.y) / zoom

      return { x, y }
    },
    [zoom, panOffset]
  )

  const handleCanvasClick = (e: ReactMouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvas) {
      if (tool === 'panel') {
        const pos = getMousePosition(e)
        const newPanel = createPanelElement(generateId(), pos)
        addElement(newPanel)
        setTool('select')
      } else if (tool === 'text') {
        const pos = getMousePosition(e)
        const newText = createTextElement(generateId(), 'New Text', pos)
        addElement(newText)
        setTool('select')
      } else if (tool === 'dialogue') {
        const pos = getMousePosition(e)
        const newDialogue = createDialogueElement(generateId(), 'Dialogue...', pos)
        addElement(newDialogue)
        setTool('select')
      } else {
        deselectAll()
      }
    }
  }

  const handleMouseDown = (e: ReactMouseEvent, elementId: string) => {
    e.stopPropagation()
    
    const element = currentPage?.elements.find((el) => el.id === elementId)
    if (!element || element.locked) return

    selectElement(elementId, e.shiftKey)
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setElementStart(element.transform.position)
  }

  const handleResizeMouseDown = (
    e: ReactMouseEvent,
    elementId: string,
    handle: string
  ) => {
    e.stopPropagation()
    
    const element = currentPage?.elements.find((el) => el.id === elementId)
    if (!element || element.locked) return

    selectElement(elementId)
    setIsResizing(true)
    setResizeHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
    setElementStart(element.transform.position)
    setElementStartSize(element.transform.size)
  }

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStart.x
        const dy = e.clientY - panStart.y
        setPanOffset({
          x: panOffset.x + dx,
          y: panOffset.y + dy,
        })
        setPanStart({ x: e.clientX, y: e.clientY })
        return
      }

      if (isDragging && selectedElementIds.length > 0) {
        const dx = (e.clientX - dragStart.x) / zoom
        const dy = (e.clientY - dragStart.y) / zoom

        selectedElementIds.forEach((id) => {
          const element = currentPage?.elements.find((el) => el.id === id)
          if (element && !element.locked) {
            moveElement(id, {
              x: elementStart.x + dx,
              y: elementStart.y + dy,
            })
          }
        })
      }

      if (isResizing && selectedElementIds.length > 0 && resizeHandle) {
        const dx = (e.clientX - dragStart.x) / zoom
        const dy = (e.clientY - dragStart.y) / zoom

        const elementId = selectedElementIds[0]
        let newWidth = elementStartSize.width
        let newHeight = elementStartSize.height
        let newX = elementStart.x
        let newY = elementStart.y

        if (resizeHandle.includes('e')) {
          newWidth = Math.max(50, elementStartSize.width + dx)
        }
        if (resizeHandle.includes('w')) {
          newWidth = Math.max(50, elementStartSize.width - dx)
          newX = elementStart.x + dx
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.max(50, elementStartSize.height + dy)
        }
        if (resizeHandle.includes('n')) {
          newHeight = Math.max(50, elementStartSize.height - dy)
          newY = elementStart.y + dy
        }

        resizeElement(elementId, { width: newWidth, height: newHeight })
        if (resizeHandle.includes('w') || resizeHandle.includes('n')) {
          moveElement(elementId, { x: newX, y: newY })
        }
      }
    },
    [
      isDragging,
      isResizing,
      isPanning,
      selectedElementIds,
      dragStart,
      elementStart,
      elementStartSize,
      zoom,
      panOffset,
      panStart,
      resizeHandle,
      currentPage,
      moveElement,
      resizeElement,
      setPanOffset,
    ]
  )

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    setIsPanning(false)
  }

  const handlePanStart = (e: ReactMouseEvent) => {
    if (tool === 'pan' || e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }

  const renderElement = (element: CanvasElement) => {
    if (!element.visible) return null

    const isSelected = selectedElementIds.includes(element.id)
    const { position, size, rotation, zIndex } = element.transform

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      width: size.width,
      height: size.height,
      transform: `rotate(${rotation}deg)`,
      zIndex,
      cursor: element.locked ? 'not-allowed' : 'move',
    }

    const renderContent = () => {
      switch (element.type) {
        case 'panel':
          return (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                backgroundColor: element.backgroundColor,
                border: `${element.borderWidth}px solid ${element.borderColor}`,
                borderRadius: element.borderRadius,
              }}
            >
              {element.children.length === 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onGenerateImage?.(element.id)
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Generate Image
                </button>
              )}
            </div>
          )

        case 'image':
          return element.src ? (
            <img
              src={element.src}
              alt=""
              className="w-full h-full"
              style={{
                objectFit: element.objectFit,
                opacity: element.opacity,
              }}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-600 rounded">
              No Image
            </div>
          )

        case 'text':
          return (
            <div
              className="w-full h-full overflow-hidden p-2"
              style={{
                fontSize: element.fontSize,
                fontFamily: element.fontFamily,
                fontWeight: element.fontWeight,
                color: element.color,
                textAlign: element.textAlign,
                lineHeight: element.lineHeight,
              }}
            >
              {element.content}
            </div>
          )

        case 'dialogue':
          return (
            <DialogueBubble element={element} />
          )

        default:
          return null
      }
    }

    return (
      <div
        key={element.id}
        style={baseStyle}
        className={cn(
          'group',
          isSelected && 'ring-2 ring-purple-500 ring-offset-1 ring-offset-transparent'
        )}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
      >
        {renderContent()}

        {/* Resize Handles */}
        {isSelected && !element.locked && (
          <>
            {/* Corners */}
            {['nw', 'ne', 'se', 'sw'].map((handle) => (
              <div
                key={handle}
                className={cn(
                  'absolute w-3 h-3 bg-white border-2 border-purple-500 rounded-sm',
                  handle === 'nw' && '-top-1.5 -left-1.5 cursor-nw-resize',
                  handle === 'ne' && '-top-1.5 -right-1.5 cursor-ne-resize',
                  handle === 'se' && '-bottom-1.5 -right-1.5 cursor-se-resize',
                  handle === 'sw' && '-bottom-1.5 -left-1.5 cursor-sw-resize'
                )}
                onMouseDown={(e) => handleResizeMouseDown(e, element.id, handle)}
              />
            ))}
            {/* Edges */}
            {['n', 'e', 's', 'w'].map((handle) => (
              <div
                key={handle}
                className={cn(
                  'absolute bg-white border-2 border-purple-500 rounded-sm',
                  handle === 'n' && 'w-3 h-3 top-[-6px] left-1/2 -translate-x-1/2 cursor-n-resize',
                  handle === 's' && 'w-3 h-3 bottom-[-6px] left-1/2 -translate-x-1/2 cursor-s-resize',
                  handle === 'e' && 'w-3 h-3 right-[-6px] top-1/2 -translate-y-1/2 cursor-e-resize',
                  handle === 'w' && 'w-3 h-3 left-[-6px] top-1/2 -translate-y-1/2 cursor-w-resize'
                )}
                onMouseDown={(e) => handleResizeMouseDown(e, element.id, handle)}
              />
            ))}
          </>
        )}
      </div>
    )
  }

  const sortedElements = [...(currentPage?.elements || [])].sort(
    (a, b) => a.transform.zIndex - b.transform.zIndex
  )

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-zinc-950 overflow-hidden relative"
      style={{ cursor: tool === 'pan' ? 'grab' : 'default' }}
      onClick={handleCanvasClick}
      onMouseDown={handlePanStart}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        }}
      />

      {/* Canvas Page */}
      <div
        data-canvas="true"
        className="absolute shadow-2xl"
        style={{
          left: panOffset.x,
          top: panOffset.y,
          width: (currentPage?.width || 800) * zoom,
          height: (currentPage?.height || 1200) * zoom,
          backgroundColor: currentPage?.backgroundColor || '#ffffff',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Render Elements */}
        <div style={{ transform: `scale(${1 / zoom})`, transformOrigin: 'top left' }}>
          {sortedElements.map(renderElement)}
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-zinc-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm text-zinc-400 border border-zinc-800">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}

function DialogueBubble({ element }: { element: DialogueElement }) {
  const { hasTail, tailAngle, tailLength, backgroundColor, borderColor, strokeSize, content, fontSize, fontFamily, color, textAlign } = element

  // Calculate tail position
  const tailX = tailAngle * 100
  const tailEndX = tailX
  const tailEndY = 100 + tailLength

  return (
    <div className="relative w-full h-full">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 150"
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id={`bubble-clip-${element.id}`}>
            <path
              d={`
                M 10 0
                Q 0 0 0 10
                L 0 80
                Q 0 90 10 90
                ${hasTail ? `
                  L ${tailX - 10} 90
                  L ${tailEndX} ${Math.min(tailEndY, 140)}
                  L ${tailX + 10} 90
                ` : ''}
                L 90 90
                Q 100 90 100 80
                L 100 10
                Q 100 0 90 0
                Z
              `}
            />
          </clipPath>
        </defs>
        <path
          d={`
            M 10 0
            Q 0 0 0 10
            L 0 80
            Q 0 90 10 90
            ${hasTail ? `
              L ${tailX - 10} 90
              L ${tailEndX} ${Math.min(tailEndY, 140)}
              L ${tailX + 10} 90
            ` : ''}
            L 90 90
            Q 100 90 100 80
            L 100 10
            Q 100 0 90 0
            Z
          `}
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={strokeSize}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden"
        style={{
          fontSize,
          fontFamily,
          color,
          textAlign,
          paddingBottom: hasTail ? '30%' : '10%',
        }}
      >
        <span className="uppercase font-bold leading-tight text-center">
          {content}
        </span>
      </div>
    </div>
  )
}
