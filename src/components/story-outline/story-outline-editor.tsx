'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authStore } from '@/lib/services/auth-client';
import { StoryOutline, StoryPanel, createEmptyOutline, createNewPanel } from './types';
import StoryOutlineHeader from './story-outline-header';
import StorySettingsSidebar from './story-settings-sidebar';
import PanelList from './panel-list';
import PreviewDialog from './preview-dialog';

export default function StoryOutlineEditor() {
  const router = useRouter();
  const [outline, setOutline] = useState<StoryOutline>(createEmptyOutline());
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [savedOutlines, setSavedOutlines] = useState<StoryOutline[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('storyOutlines');
    if (saved) {
      try {
        setSavedOutlines(JSON.parse(saved));
      } catch (e) {
      }
    }
  }, []);

  const saveOutline = useCallback(() => {
    const updated = {
      ...outline,
      updatedAt: Date.now(),
    };
    setOutline(updated);

    const existingIndex = savedOutlines.findIndex(o => o.id === updated.id);
    let newOutlines: StoryOutline[];
    if (existingIndex >= 0) {
      newOutlines = [...savedOutlines];
      newOutlines[existingIndex] = updated;
    } else {
      newOutlines = [...savedOutlines, updated];
    }
    setSavedOutlines(newOutlines);
    localStorage.setItem('storyOutlines', JSON.stringify(newOutlines));
    toast.success('Outline saved!');
  }, [outline, savedOutlines]);

  const loadOutline = useCallback((id: string) => {
    const found = savedOutlines.find(o => o.id === id);
    if (found) {
      setOutline(found);
      toast.success('Outline loaded!');
    }
  }, [savedOutlines]);

  const deleteOutline = useCallback((id: string) => {
    const newOutlines = savedOutlines.filter(o => o.id !== id);
    setSavedOutlines(newOutlines);
    localStorage.setItem('storyOutlines', JSON.stringify(newOutlines));
    if (outline.id === id) {
      setOutline(createEmptyOutline());
    }
    toast.success('Outline deleted!');
  }, [outline.id, savedOutlines]);

  const handleOutlineChange = useCallback((updates: Partial<StoryOutline>) => {
    setOutline(prev => ({ ...prev, ...updates, updatedAt: Date.now() }));
  }, []);

  const addPanel = useCallback(() => {
    const newPanel = createNewPanel(outline.panels.length + 1);
    setOutline(prev => ({
      ...prev,
      panels: [...prev.panels, newPanel],
      updatedAt: Date.now(),
    }));
  }, [outline.panels.length]);

  const updatePanel = useCallback((panelId: string, updates: Partial<StoryPanel>) => {
    setOutline(prev => ({
      ...prev,
      panels: prev.panels.map(p =>
        p.id === panelId ? { ...p, ...updates } : p
      ),
      updatedAt: Date.now(),
    }));
  }, []);

  const removePanel = useCallback((panelId: string) => {
    setOutline(prev => ({
      ...prev,
      panels: prev.panels
        .filter(p => p.id !== panelId)
        .map((p, idx) => ({ ...p, order: idx + 1 })),
      updatedAt: Date.now(),
    }));
  }, []);

  const togglePanelExpanded = useCallback((panelId: string) => {
    setOutline(prev => ({
      ...prev,
      panels: prev.panels.map(p =>
        p.id === panelId ? { ...p, isExpanded: !p.isExpanded } : p
      ),
    }));
  }, []);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const panels = [...outline.panels];
    const draggedPanel = panels[dragItem.current];
    panels.splice(dragItem.current, 1);
    panels.splice(dragOverItem.current, 0, draggedPanel);

    const reorderedPanels = panels.map((p, idx) => ({
      ...p,
      order: idx + 1,
    }));

    setOutline(prev => ({
      ...prev,
      panels: reorderedPanels,
      updatedAt: Date.now(),
    }));

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const generateAISuggestion = useCallback(async (panelId: string) => {
    // Check authentication before generating
    authStore.loadFromStorage();
    if (!authStore.getAccessToken()) {
      toast.error('Login required', {
        description: 'Please login to use the AI feature',
        action: {
          label: 'Login',
          onClick: () => router.push('/auth/login'),
        },
      });
      return;
    }

    const panel = outline.panels.find(p => p.id === panelId);
    if (!panel) return;

    setAiGenerating(panelId);

    try {
      const context = `
Story Title: ${outline.title}
Genre: ${outline.genre}
Synopsis: ${outline.synopsis}
Setting: ${outline.setting}
Characters: ${outline.characters}

Current Panel (${panel.order}): ${panel.title}
Panel Description: ${panel.description}

Previous Panels:
${outline.panels
  .filter(p => p.order < panel.order)
  .map(p => `Panel ${p.order}: ${p.title} - ${p.description}`)
  .join('\n')}
`;

      const response = await fetch('/api/generate/story-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          panelDescription: panel.description,
          panelNumber: panel.order,
          totalPanels: outline.panels.length,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestion');
      }

      const data = await response.json();
      const suggestion = data.suggestion || data.data?.suggestion;

      if (suggestion) {
        updatePanel(panelId, { aiSuggestion: suggestion, prompt: suggestion });
        toast.success('AI suggestion generated!');
      }
    } catch (error) {
      toast.error('Failed to generate AI suggestion');
    } finally {
      setAiGenerating(null);
    }
  }, [outline, updatePanel, router]);

  const generateAllPanelPrompts = useCallback(async () => {
    // Check authentication before generating
    authStore.loadFromStorage();
    if (!authStore.getAccessToken()) {
      toast.error('Login required', {
        description: 'Please login to use the AI feature',
        action: {
          label: 'Login',
          onClick: () => router.push('/auth/login'),
        },
      });
      return;
    }

    setLoading(true);
    try {
      for (const panel of outline.panels) {
        await generateAISuggestion(panel.id);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      toast.success('All panel prompts generated!');
    } catch (error) {
      toast.error('Failed to generate all prompts');
    } finally {
      setLoading(false);
    }
  }, [outline.panels, generateAISuggestion, router]);

  const exportToStudio = useCallback(() => {
    sessionStorage.setItem('storyOutlineForStudio', JSON.stringify(outline));
    router.push('/studio');
    toast.success('Outline exported to Studio!');
  }, [outline, router]);

  const newOutline = useCallback(() => {
    setOutline(createEmptyOutline());
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <StoryOutlineHeader
        outline={outline}
        onNew={newOutline}
        onSave={saveOutline}
        onPreview={() => setShowPreview(true)}
        onExport={exportToStudio}
      />

      <div className="flex-1 flex overflow-hidden">
        <StorySettingsSidebar
          outline={outline}
          savedOutlines={savedOutlines}
          isMobile={isMobile}
          onOutlineChange={handleOutlineChange}
          onLoadOutline={loadOutline}
          onDeleteOutline={deleteOutline}
        />

        <PanelList
          panels={outline.panels}
          loading={loading}
          aiGenerating={aiGenerating}
          onAddPanel={addPanel}
          onUpdatePanel={updatePanel}
          onRemovePanel={removePanel}
          onTogglePanelExpanded={togglePanelExpanded}
          onGenerateAI={generateAISuggestion}
          onGenerateAllPrompts={generateAllPanelPrompts}
          onDragStart={handleDragStart}
          onDragEnter={handleDragEnter}
          onDragEnd={handleDragEnd}
        />
      </div>

      <PreviewDialog
        open={showPreview}
        outline={outline}
        onClose={() => setShowPreview(false)}
        onExport={exportToStudio}
      />
    </div>
  );
}
