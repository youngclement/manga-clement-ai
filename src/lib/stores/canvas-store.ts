'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  CanvasElement,
  CanvasPage,
  CanvasProject,
  Position,
  PanelElement,
  ImageElement,
  TextElement,
  DialogueElement,
} from '@/lib/types/canvas'
import { deepClone } from '@/lib/utils/common'

interface CanvasStore {
  project: CanvasProject
  selectedElementIds: string[]
  zoom: number
  panOffset: Position
  tool: 'select' | 'pan' | 'panel' | 'text' | 'dialogue'
  setProject: (project: CanvasProject) => void
  updateProjectName: (name: string) => void
  addPage: () => void
  removePage: (pageId: string) => void
  setCurrentPage: (index: number) => void
  getCurrentPage: () => CanvasPage | undefined
  updatePage: (pageId: string, updates: Partial<CanvasPage>) => void
  addElement: (element: CanvasElement) => void
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void
  removeElement: (elementId: string) => void
  duplicateElement: (elementId: string) => void
  moveElement: (elementId: string, position: Position) => void
  resizeElement: (elementId: string, size: { width: number; height: number }) => void
  bringToFront: (elementId: string) => void
  sendToBack: (elementId: string) => void
  selectElement: (elementId: string, multi?: boolean) => void
  deselectAll: () => void
  selectAll: () => void
  setZoom: (zoom: number) => void
  setPanOffset: (offset: Position) => void
  setTool: (tool: 'select' | 'pan' | 'panel' | 'text' | 'dialogue') => void
  generateId: () => string
}

const createDefaultProject = (): CanvasProject => ({
  id: crypto.randomUUID(),
  name: 'Untitled Project',
  pages: [
    {
      id: crypto.randomUUID(),
      name: 'Page 1',
      elements: [],
      backgroundColor: '#ffffff',
      width: 800,
      height: 1200,
    },
  ],
  currentPageIndex: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      project: createDefaultProject(),
      selectedElementIds: [],
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      tool: 'select',

      setProject: (project) => set({ project }),

      updateProjectName: (name) =>
        set((state) => ({
          project: { ...state.project, name, updatedAt: Date.now() },
        })),

      addPage: () =>
        set((state) => {
          const newPage: CanvasPage = {
            id: crypto.randomUUID(),
            name: `Page ${state.project.pages.length + 1}`,
            elements: [],
            backgroundColor: '#ffffff',
            width: 800,
            height: 1200,
          }
          return {
            project: {
              ...state.project,
              pages: [...state.project.pages, newPage],
              currentPageIndex: state.project.pages.length,
              updatedAt: Date.now(),
            },
          }
        }),

      removePage: (pageId) =>
        set((state) => {
          if (state.project.pages.length <= 1) return state
          const newPages = state.project.pages.filter((p) => p.id !== pageId)
          const newIndex = Math.min(state.project.currentPageIndex, newPages.length - 1)
          return {
            project: {
              ...state.project,
              pages: newPages,
              currentPageIndex: newIndex,
              updatedAt: Date.now(),
            },
            selectedElementIds: [],
          }
        }),

      setCurrentPage: (index) =>
        set((state) => ({
          project: { ...state.project, currentPageIndex: index },
          selectedElementIds: [],
        })),

      getCurrentPage: () => {
        const state = get()
        return state.project.pages[state.project.currentPageIndex]
      },

      updatePage: (pageId, updates) =>
        set((state) => ({
          project: {
            ...state.project,
            pages: state.project.pages.map((p) =>
              p.id === pageId ? { ...p, ...updates } : p
            ),
            updatedAt: Date.now(),
          },
        })),

      addElement: (element) =>
        set((state) => {
          const currentPage = state.project.pages[state.project.currentPageIndex]
          if (!currentPage) return state

          const maxZIndex = Math.max(
            0,
            ...currentPage.elements.map((e) => e.transform.zIndex)
          )
          const newElement = {
            ...element,
            transform: { ...element.transform, zIndex: maxZIndex + 1 },
          }

          return {
            project: {
              ...state.project,
              pages: state.project.pages.map((p) =>
                p.id === currentPage.id
                  ? { ...p, elements: [...p.elements, newElement] }
                  : p
              ),
              updatedAt: Date.now(),
            },
            selectedElementIds: [element.id],
          }
        }),

      updateElement: (elementId, updates) =>
        set((state) => {
          const currentPage = state.project.pages[state.project.currentPageIndex]
          if (!currentPage) return state

          return {
            project: {
              ...state.project,
              pages: state.project.pages.map((p) =>
                p.id === currentPage.id
                  ? {
                      ...p,
                      elements: p.elements.map((e) =>
                        e.id === elementId ? ({ ...e, ...updates } as CanvasElement) : e
                      ),
                    }
                  : p
              ),
              updatedAt: Date.now(),
            },
          }
        }),

      removeElement: (elementId) =>
        set((state) => {
          const currentPage = state.project.pages[state.project.currentPageIndex]
          if (!currentPage) return state

          return {
            project: {
              ...state.project,
              pages: state.project.pages.map((p) =>
                p.id === currentPage.id
                  ? { ...p, elements: p.elements.filter((e) => e.id !== elementId) }
                  : p
              ),
              updatedAt: Date.now(),
            },
            selectedElementIds: state.selectedElementIds.filter((id) => id !== elementId),
          }
        }),

      duplicateElement: (elementId) =>
        set((state) => {
          const currentPage = state.project.pages[state.project.currentPageIndex]
          if (!currentPage) return state

          const element = currentPage.elements.find((e) => e.id === elementId)
          if (!element) return state

          const maxZIndex = Math.max(
            0,
            ...currentPage.elements.map((e) => e.transform.zIndex)
          )
          const newElement = {
            ...deepClone(element),
            id: crypto.randomUUID(),
            name: `${element.name} Copy`,
            transform: {
              ...element.transform,
              position: {
                x: element.transform.position.x + 20,
                y: element.transform.position.y + 20,
              },
              zIndex: maxZIndex + 1,
            },
          }

          return {
            project: {
              ...state.project,
              pages: state.project.pages.map((p) =>
                p.id === currentPage.id
                  ? { ...p, elements: [...p.elements, newElement] }
                  : p
              ),
              updatedAt: Date.now(),
            },
            selectedElementIds: [newElement.id],
          }
        }),

      moveElement: (elementId, position) =>
        set((state) => {
          const currentPage = state.project.pages[state.project.currentPageIndex]
          if (!currentPage) return state

          return {
            project: {
              ...state.project,
              pages: state.project.pages.map((p) =>
                p.id === currentPage.id
                  ? {
                      ...p,
                      elements: p.elements.map((e) =>
                        e.id === elementId
                          ? { ...e, transform: { ...e.transform, position } }
                          : e
                      ),
                    }
                  : p
              ),
              updatedAt: Date.now(),
            },
          }
        }),

      resizeElement: (elementId, size) =>
        set((state) => {
          const currentPage = state.project.pages[state.project.currentPageIndex]
          if (!currentPage) return state

          return {
            project: {
              ...state.project,
              pages: state.project.pages.map((p) =>
                p.id === currentPage.id
                  ? {
                      ...p,
                      elements: p.elements.map((e) =>
                        e.id === elementId
                          ? { ...e, transform: { ...e.transform, size } }
                          : e
                      ),
                    }
                  : p
              ),
              updatedAt: Date.now(),
            },
          }
        }),

      bringToFront: (elementId) =>
        set((state) => {
          const currentPage = state.project.pages[state.project.currentPageIndex]
          if (!currentPage) return state

          const maxZIndex = Math.max(
            0,
            ...currentPage.elements.map((e) => e.transform.zIndex)
          )

          return {
            project: {
              ...state.project,
              pages: state.project.pages.map((p) =>
                p.id === currentPage.id
                  ? {
                      ...p,
                      elements: p.elements.map((e) =>
                        e.id === elementId
                          ? { ...e, transform: { ...e.transform, zIndex: maxZIndex + 1 } }
                          : e
                      ),
                    }
                  : p
              ),
              updatedAt: Date.now(),
            },
          }
        }),

      sendToBack: (elementId) =>
        set((state) => {
          const currentPage = state.project.pages[state.project.currentPageIndex]
          if (!currentPage) return state

          const minZIndex = Math.min(
            0,
            ...currentPage.elements.map((e) => e.transform.zIndex)
          )

          return {
            project: {
              ...state.project,
              pages: state.project.pages.map((p) =>
                p.id === currentPage.id
                  ? {
                      ...p,
                      elements: p.elements.map((e) =>
                        e.id === elementId
                          ? { ...e, transform: { ...e.transform, zIndex: minZIndex - 1 } }
                          : e
                      ),
                    }
                  : p
              ),
              updatedAt: Date.now(),
            },
          }
        }),

      selectElement: (elementId, multi = false) =>
        set((state) => ({
          selectedElementIds: multi
            ? state.selectedElementIds.includes(elementId)
              ? state.selectedElementIds.filter((id) => id !== elementId)
              : [...state.selectedElementIds, elementId]
            : [elementId],
        })),

      deselectAll: () => set({ selectedElementIds: [] }),

      selectAll: () =>
        set((state) => {
          const currentPage = state.project.pages[state.project.currentPageIndex]
          if (!currentPage) return state
          return {
            selectedElementIds: currentPage.elements.map((e) => e.id),
          }
        }),

      setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),

      setPanOffset: (panOffset) => set({ panOffset }),

      setTool: (tool) => set({ tool }),

      generateId: () => crypto.randomUUID(),
    }),
    {
      name: 'canvas-editor-storage',
      partialize: (state) => ({
        project: state.project,
        zoom: state.zoom,
      }),
    }
  )
)
export const createPanelElement = (
  id: string,
  position: Position,
  size = { width: 300, height: 400 }
): PanelElement => ({
  id,
  type: 'panel',
  name: 'Panel',
  transform: {
    position,
    size,
    rotation: 0,
    zIndex: 0,
  },
  locked: false,
  visible: true,
  backgroundColor: '#ffffff',
  borderColor: '#000000',
  borderWidth: 2,
  borderRadius: 0,
  children: [],
})

export const createImageElement = (
  id: string,
  src: string,
  position: Position,
  size = { width: 300, height: 400 }
): ImageElement => ({
  id,
  type: 'image',
  name: 'Image',
  transform: {
    position,
    size,
    rotation: 0,
    zIndex: 0,
  },
  locked: false,
  visible: true,
  src,
  objectFit: 'cover',
  opacity: 1,
})

export const createTextElement = (
  id: string,
  content: string,
  position: Position
): TextElement => ({
  id,
  type: 'text',
  name: 'Text',
  transform: {
    position,
    size: { width: 200, height: 50 },
    rotation: 0,
    zIndex: 0,
  },
  locked: false,
  visible: true,
  content,
  fontSize: 16,
  fontFamily: 'Inter',
  fontWeight: '400',
  color: '#000000',
  textAlign: 'left',
  lineHeight: 1.5,
})

export const createDialogueElement = (
  id: string,
  content: string,
  position: Position
): DialogueElement => ({
  id,
  type: 'dialogue',
  name: 'Dialogue',
  transform: {
    position,
    size: { width: 180, height: 100 },
    rotation: 0,
    zIndex: 0,
  },
  locked: false,
  visible: true,
  content,
  fontSize: 14,
  fontFamily: 'Bangers',
  fontWeight: '400',
  color: '#000000',
  textAlign: 'center',
  backgroundColor: '#ffffff',
  borderColor: '#000000',
  strokeSize: 2,
  bubbleStyle: 'rounded',
  hasTail: true,
  tailAngle: 0.24,
  tailLength: 54,
})
