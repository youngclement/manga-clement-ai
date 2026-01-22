'use client'

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Eye, Settings, Layers, MessageSquare } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MangaStyle,
  InkingStyle,
  ScreentoneDensity,
  AspectRatio,
  PanelLayout,
  GeneratedManga,
  MangaProject,
  MangaConfig,
  DialogueDensity,
  Language,
  MangaSession,
} from '@/lib/types';
import { loadProject, saveProject } from '@/lib/services/storage-service';
import { generateMangaImage, generateNextPrompt } from '@/lib/services/gemini-service';
import StorySettingsPanel from '@/components/story-settings-panel';
import SessionSidebar from '@/components/studio/session-sidebar';
import PromptPanel from '@/components/studio/prompt-panel';
import CanvasArea from '@/components/studio/canvas-area';
import ChatHistoryPanel from '@/components/studio/chat-history-panel';
import FullscreenModal from '@/components/studio/fullscreen-modal';


const MangaGeneratorV2 = () => {
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [config, setConfig] = useState<MangaConfig>({
    style: MangaStyle.SHONEN,
    inking: InkingStyle.GPEN,
    screentone: ScreentoneDensity.MEDIUM,
    layout: PanelLayout.SINGLE,
    aspectRatio: AspectRatio.PORTRAIT,
    useColor: false,
    dialogueDensity: DialogueDensity.MEDIUM,
    language: Language.ENGLISH,
    context: '',
    autoContinueStory: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const batchCancelledRef = useRef(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [leftWidth, setLeftWidth] = useState(320); // Sessions/History panel (20%)
  const [middleWidth, setMiddleWidth] = useState(640); // Prompt + Settings panel (40%)
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingMiddle, setIsDraggingMiddle] = useState(false);

  const [project, setProject] = useState<MangaProject>({
    id: 'default',
    title: 'New Chapter',
    pages: [],
    sessions: [],
    currentSessionId: undefined
  });

  const [currentSession, setCurrentSession] = useState<MangaSession | null>(null);

  // Set body overflow-hidden for studio page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // ESC key to close fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullscreen) {
        setShowFullscreen(false);
        setFullscreenImage(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showFullscreen]);

  const openFullscreenFromSidebar = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
    setShowFullscreen(true);
  };

  useEffect(() => {
    const savedLeftWidth = localStorage.getItem('manga-studio-left-width');
    const savedMiddleWidth = localStorage.getItem('manga-studio-middle-width');
    if (savedLeftWidth) setLeftWidth(parseInt(savedLeftWidth));
    if (savedMiddleWidth) setMiddleWidth(parseInt(savedMiddleWidth));
  }, []);

  useEffect(() => {
    localStorage.setItem('manga-studio-left-width', leftWidth.toString());
  }, [leftWidth]);

  useEffect(() => {
    localStorage.setItem('manga-studio-middle-width', middleWidth.toString());
  }, [middleWidth]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setShowSettings(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setLeftWidth(newWidth);
      }
      if (isDraggingMiddle) {
        const newWidth = Math.max(400, Math.min(900, e.clientX - leftWidth));
        setMiddleWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingMiddle(false);
    };

    if (isDraggingLeft || isDraggingMiddle) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingMiddle, leftWidth]);

  useEffect(() => {
    const init = async () => {
      try {
        const saved = await loadProject('default');
        if (saved) {
          const normalizedProject = {
            ...saved,
            sessions: Array.isArray(saved.sessions) ? saved.sessions : [],
            pages: Array.isArray(saved.pages) ? saved.pages : []
          };
          setProject(normalizedProject);
          if (normalizedProject.currentSessionId) {
            const session = normalizedProject.sessions.find(s => s.id === normalizedProject.currentSessionId);
            if (session) {
              const normalizedSession = {
                ...session,
                chatHistory: Array.isArray(session.chatHistory) ? session.chatHistory : []
              };
              setCurrentSession(normalizedSession);
              setContext(normalizedSession.context);
              setConfig(prev => ({ ...prev, context: normalizedSession.context }));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load project from IndexedDB", err);
      }
    };
    init();
  }, []);

  const createSession = (name: string) => {
    const newSession: MangaSession = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      name,
      context: context || '',
      pages: [],
      chatHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setCurrentSession(newSession);
    setProject(prev => ({
      ...prev,
      sessions: Array.isArray(prev.sessions) ? [...prev.sessions, newSession] : [newSession],
      currentSessionId: newSession.id
    }));
  };

  const switchSession = (sessionId: string) => {
    const session = (Array.isArray(project.sessions) ? project.sessions : []).find(s => s.id === sessionId);
    if (session) {
      const normalizedSession = {
        ...session,
        chatHistory: Array.isArray(session.chatHistory) ? session.chatHistory : []
      };
      setCurrentSession(normalizedSession);
      setContext(normalizedSession.context);
      setConfig(prev => ({ ...prev, context: normalizedSession.context }));
      setProject(prev => ({ ...prev, currentSessionId: sessionId }));
    }
  };

  const updateSessionContext = (newContext: string) => {
    setContext(newContext);
    setConfig(prev => ({ ...prev, context: newContext }));
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        context: newContext,
        updatedAt: Date.now()
      };
      setCurrentSession(updatedSession);
      setProject(prev => ({
        ...prev,
        sessions: (Array.isArray(prev.sessions) ? prev.sessions : []).map(s => s.id === currentSession.id ? updatedSession : s)
      }));
    }
  };

  const confirmDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const deleteSession = () => {
    if (!sessionToDelete) return;

    const sessions = Array.isArray(project.sessions) ? project.sessions : [];
    const filteredSessions = sessions.filter(s => s.id !== sessionToDelete);

    if (currentSession?.id === sessionToDelete) {
      if (filteredSessions.length > 0) {
        switchSession(filteredSessions[0].id);
      } else {
        setCurrentSession(null);
        setContext('');
      }
    }

    setProject(prev => ({
      ...prev,
      sessions: filteredSessions,
      currentSessionId: currentSession?.id === sessionToDelete ? (filteredSessions[0]?.id || undefined) : prev.currentSessionId
    }));

    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const confirmDeletePage = (pageId: string) => {
    setPageToDelete(pageId);
    setDeleteDialogOpen(true);
  };

  const deletePage = () => {
    if (!pageToDelete) return;
    removePage(pageToDelete);
    setDeleteDialogOpen(false);
    setPageToDelete(null);
  };

  useEffect(() => {
    const save = async () => {
      try {
        await saveProject(project);
      } catch (err) {
        console.error("Failed to save project", err);
        setError("Storage error: Could not save your progress.");
      }
    };
    if (project.pages.length > 0 || project.title !== 'New Chapter' || project.sessions.length > 0) {
      save();
    }
  }, [project]);

  const handleGenerate = async () => {
    const hasPages = currentSession && currentSession.pages.length > 0;
    const isAutoContinue = config.autoContinueStory && hasPages;

    // Allow empty prompt if auto-continue is enabled
    if (!prompt.trim() && !isAutoContinue) return;

    let workingSession = currentSession;
    if (!workingSession) {
      const newSessionId = Date.now().toString() + Math.random().toString(36).substring(2);
      const newSession: MangaSession = {
        id: newSessionId,
        name: 'Session ' + new Date().toLocaleDateString(),
        context: context || '',
        pages: [],
        chatHistory: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      workingSession = newSession;
      setCurrentSession(newSession);
      setProject(prev => ({
        ...prev,
        sessions: Array.isArray(prev.sessions) ? [...prev.sessions, newSession] : [newSession],
        currentSessionId: newSessionId
      }));
    }

    setLoading(true);
    setError(null);

    const userMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      role: 'user' as const,
      content: prompt || (isAutoContinue ? 'Continue the story naturally' : ''),
      timestamp: Date.now(),
      config: { ...config, context: context || config.context }
    };

    const sessionWithUserMessage = {
      ...workingSession,
      chatHistory: [...(workingSession.chatHistory || []), userMessage],
      updatedAt: Date.now()
    };
    setCurrentSession(sessionWithUserMessage);
    setProject(prev => ({
      ...prev,
      sessions: (Array.isArray(prev.sessions) ? prev.sessions : []).map(s =>
        s.id === workingSession.id ? sessionWithUserMessage : s
      )
    }));

    try {
      const sessionHistory = workingSession.pages || [];
      const configWithContext = { ...config, context: context || config.context };
      const imageUrl = await generateMangaImage(prompt, configWithContext, sessionHistory);
      setCurrentImage(imageUrl);

      const assistantMessage = {
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        role: 'assistant' as const,
        content: 'Generated manga page',
        imageUrl: imageUrl,
        timestamp: Date.now(),
        config: configWithContext
      };

      const finalSession = {
        ...sessionWithUserMessage,
        chatHistory: [...sessionWithUserMessage.chatHistory, assistantMessage],
        updatedAt: Date.now()
      };
      setCurrentSession(finalSession);
      setProject(prev => ({
        ...prev,
        sessions: (Array.isArray(prev.sessions) ? prev.sessions : []).map(s =>
          s.id === workingSession.id ? finalSession : s
        )
      }));
    } catch (err) {
      setError("Failed to generate manga. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchGenerate = async (totalPages: number = 10) => {
    const hasPages = currentSession && currentSession.pages.length > 0;
    const isAutoContinue = config.autoContinueStory && hasPages;

    // Allow empty prompt if auto-continue is enabled
    if (!prompt.trim() && !isAutoContinue) return;

    let workingSession = currentSession;
    if (!workingSession) {
      const newSessionId = Date.now().toString() + Math.random().toString(36).substring(2);
      const newSession: MangaSession = {
        id: newSessionId,
        name: 'Batch ' + new Date().toLocaleTimeString(),
        context: context || '',
        pages: [],
        chatHistory: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      workingSession = newSession;
      setCurrentSession(newSession);
      setProject(prev => ({
        ...prev,
        sessions: Array.isArray(prev.sessions) ? [...prev.sessions, newSession] : [newSession],
        currentSessionId: newSessionId
      }));
    }

    setBatchLoading(true);
    batchCancelledRef.current = false;
    setBatchProgress({ current: 0, total: totalPages });
    setError(null);
    const originalPrompt = prompt || 'Start an exciting manga story';
    const sessionId = workingSession.id;
    let generatedCount = 0;
    let localSession = workingSession; // Track session locally for continuity
    let currentPrompt = originalPrompt;

    for (let i = 0; i < totalPages; i++) {
      if (batchCancelledRef.current) {
        setBatchLoading(false);
        setBatchProgress(null);
        setError(`Batch cancelled. Generated ${generatedCount} of ${totalPages} pages.`);
        return;
      }

      try {
        const sessionHistory = localSession.pages || [];

        const configWithContext = {
          ...config,
          context: context || config.context,
          autoContinueStory: false // Don't use auto-continue, we have explicit prompts now
        };

        // STEP 1: Generate prompt for this page (except first page)
        if (i > 0) {
          // Check cancel before API call
          if (batchCancelledRef.current) {
            setBatchLoading(false);
            setBatchProgress(null);
            setError(`Batch cancelled. Generated ${generatedCount} of ${totalPages} pages.`);
            return;
          }

          // AI generates the NEXT prompt based on previous pages
          setBatchProgress({ current: i, total: totalPages });
          currentPrompt = await generateNextPrompt(
            sessionHistory,
            context || config.context || '',
            originalPrompt,
            i + 1,
            totalPages,
            configWithContext
          );

          // Check cancel after API call
          if (batchCancelledRef.current) {
            setBatchLoading(false);
            setBatchProgress(null);
            setError(`Batch cancelled. Generated ${generatedCount} of ${totalPages} pages.`);
            return;
          }

          console.log(`AI Generated Prompt for Page ${i + 1}:`, currentPrompt);
        }

        // STEP 2: Generate image using the prompt (with retry)
        let imageUrl: string | null = null;
        let retries = 3;
        let lastError: Error | null = null;

        while (retries > 0 && !imageUrl && !batchCancelledRef.current) {
          // Check cancel before each retry
          if (batchCancelledRef.current) {
            setBatchLoading(false);
            setBatchProgress(null);
            setError(`Batch cancelled. Generated ${generatedCount} of ${totalPages} pages.`);
            return;
          }

          try {
            imageUrl = await generateMangaImage(currentPrompt, configWithContext, sessionHistory);

            // Check cancel after API call
            if (batchCancelledRef.current) {
              setBatchLoading(false);
              setBatchProgress(null);
              setError(`Batch cancelled. Generated ${generatedCount} of ${totalPages} pages.`);
              return;
            }
          } catch (err) {
            // Check cancel even on error
            if (batchCancelledRef.current) {
              setBatchLoading(false);
              setBatchProgress(null);
              setError(`Batch cancelled. Generated ${generatedCount} of ${totalPages} pages.`);
              return;
            }

            lastError = err as Error;
            retries--;
            if (retries > 0 && !batchCancelledRef.current) {
              console.log(`Retrying page ${i + 1}... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
            }
          }
        }

        // Check cancel before processing result
        if (batchCancelledRef.current) {
          setBatchLoading(false);
          setBatchProgress(null);
          setError(`Batch cancelled. Generated ${generatedCount} of ${totalPages} pages.`);
          return;
        }

        if (!imageUrl) {
          throw lastError || new Error(`Failed to generate image for page ${i + 1} after 3 attempts`);
        }

        // Create page object
        const newPage: GeneratedManga = {
          id: Date.now().toString() + Math.random().toString(36).substring(2),
          url: imageUrl,
          prompt: currentPrompt, // Use the actual prompt (original or AI-generated)
          timestamp: Date.now(),
          config: configWithContext,
          markedForExport: true
        };

        // Update local session
        localSession = {
          ...localSession,
          pages: [...localSession.pages, newPage],
          updatedAt: Date.now()
        };

        // Update React state
        setCurrentSession(localSession);
        setProject(prev => ({
          ...prev,
          pages: [...prev.pages, newPage],
          sessions: (Array.isArray(prev.sessions) ? prev.sessions : []).map(s =>
            s.id === sessionId ? localSession : s
          )
        }));

        generatedCount++;
        // Update progress
        setBatchProgress({ current: i + 1, total: totalPages });

        // Small delay between generations to avoid overwhelming the API
        if (i < totalPages - 1 && !batchCancelledRef.current) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error(`Error generating page ${i + 1}:`, err);
        setError(`Failed at page ${i + 1}. Successfully generated ${generatedCount} pages.`);
        setBatchLoading(false);
        setBatchProgress(null);
        return;
      }
    }

    setBatchLoading(false);
    setBatchProgress(null);
    setPrompt('');

    if (!batchCancelledRef.current) {
      setError(null);
    }
  };

  const cancelBatchGenerate = () => {
    batchCancelledRef.current = true;
    // Immediately update UI state - don't wait for API
    setBatchLoading(false);
    setBatchProgress(null);
    setError('Batch generation cancelled.');
  };

  const addToProject = (markForExport = true) => {
    if (!currentImage) return;

    const safeId = Date.now().toString() + Math.random().toString(36).substring(2);

    const newPage: GeneratedManga = {
      id: safeId,
      url: currentImage,
      prompt,
      timestamp: Date.now(),
      config: { ...config, context: context || config.context },
      markedForExport: markForExport
    };

    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        pages: [...currentSession.pages, newPage],
        updatedAt: Date.now()
      };
      setCurrentSession(updatedSession);
      setProject(prev => ({
        ...prev,
        pages: [...prev.pages, newPage],
        sessions: (Array.isArray(prev.sessions) ? prev.sessions : []).map(s => s.id === currentSession.id ? updatedSession : s)
      }));
    } else {
      setProject(prev => ({
        ...prev,
        pages: [...prev.pages, newPage]
      }));
    }

    setCurrentImage(null);
    setPrompt('');
    setError(null);
  };

  const toggleMarkForExport = (id: string) => {
    if (currentSession) {
      const updatedPages = currentSession.pages.map(p =>
        p.id === id ? { ...p, markedForExport: !p.markedForExport } : p
      );
      const updatedSession = {
        ...currentSession,
        pages: updatedPages,
        updatedAt: Date.now()
      };
      setCurrentSession(updatedSession);
      setProject(prev => ({
        ...prev,
        pages: prev.pages.map(p => p.id === id ? { ...p, markedForExport: !p.markedForExport } : p),
        sessions: (Array.isArray(prev.sessions) ? prev.sessions : []).map(s => s.id === currentSession.id ? updatedSession : s)
      }));
    } else {
      setProject(prev => ({
        ...prev,
        pages: prev.pages.map(p => p.id === id ? { ...p, markedForExport: !p.markedForExport } : p)
      }));
    }
  };

  const removePage = (id: string) => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        pages: currentSession.pages.filter(p => p.id !== id),
        updatedAt: Date.now()
      };
      setCurrentSession(updatedSession);
      setProject(prev => ({
        ...prev,
        pages: prev.pages.filter(p => p.id !== id),
        sessions: (Array.isArray(prev.sessions) ? prev.sessions : []).map(s => s.id === currentSession.id ? updatedSession : s)
      }));
    } else {
      setProject(prev => ({
        ...prev,
        pages: prev.pages.filter(p => p.id !== id)
      }));
    }
  };

  const movePage = (id: string, direction: 'up' | 'down') => {
    if (currentSession) {
      const pages = currentSession.pages;
      const index = pages.findIndex(p => p.id === id);
      if (index === -1) return;
      const newPages = [...pages];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newPages.length) return;
      [newPages[index], newPages[newIndex]] = [newPages[newIndex], newPages[index]];

      const updatedSession = {
        ...currentSession,
        pages: newPages,
        updatedAt: Date.now()
      };
      setCurrentSession(updatedSession);
      setProject(prev => ({
        ...prev,
        sessions: (Array.isArray(prev.sessions) ? prev.sessions : []).map(s => s.id === currentSession.id ? updatedSession : s)
      }));
    } else {
      const pages = project.pages;
      const index = pages.findIndex(p => p.id === id);
      if (index === -1) return;
      const newPages = [...pages];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newPages.length) return;
      [newPages[index], newPages[newIndex]] = [newPages[newIndex], newPages[index]];
      setProject(prev => ({ ...prev, pages: newPages }));
    }
  };

  const pagesToShow = currentSession ? currentSession.pages : project.pages;
  const exportCount = currentSession
    ? currentSession.pages.filter(p => p.markedForExport).length
    : project.pages.filter(p => p.markedForExport).length;

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Top Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-3 lg:px-6 flex-shrink-0">
        <div className="flex items-center gap-2 lg:gap-4">
          <h1 className="text-base lg:text-xl font-manga text-amber-500 flex items-center gap-2">
            <Sparkles size={20} className="lg:hidden" />
            <Sparkles size={24} className="hidden lg:block" />
            <span className="hidden sm:inline">MANGA STUDIO</span>
            <span className="sm:hidden">MS</span>
          </h1>
          {currentSession && (
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
              <Layers size={14} className="text-amber-500" />
              <span className="text-xs font-semibold text-zinc-300" style={{ fontFamily: 'var(--font-inter)' }}>
                {currentSession.name}
              </span>
              <span className="text-[10px] text-zinc-500">({currentSession.pages.length})</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pb-1">
          {isMobile && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors lg:hidden"
              title="Menu"
            >
              <Settings size={20} className="text-zinc-400" />
            </button>
          )}
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors relative"
            title="Chat History"
          >
            <MessageSquare size={20} className="text-zinc-400" />
            {currentSession && currentSession.chatHistory && currentSession.chatHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[10px] flex items-center justify-center text-black font-bold">
                {currentSession.chatHistory.length}
              </span>
            )}
          </button>
          {!isMobile && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Settings"
            >
              <Settings size={20} className="text-zinc-400" />
            </button>
          )}
          <div className="h-8 w-px bg-zinc-800" />
          <button
            onClick={() => router.push('/studio/preview')}
            className="px-4 py-2 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-[0_3px_0_0_rgb(180,83,9)] hover:shadow-[0_3px_0_0_rgb(180,83,9)] active:shadow-[0_1px_0_0_rgb(180,83,9)] active:translate-y-1"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <Eye size={16} />
            PREVIEW ({exportCount})
          </button>
        </div>
      </header>

      {/* Main Content - New 10 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Sessions/History (2/10 = 20%) */}
        {!isMobile && (
          <>
            <SessionSidebar
              project={project}
              currentSession={currentSession}
              pagesToShow={pagesToShow}
              onSwitchSession={switchSession}
              onDeleteSession={confirmDeleteSession}
              onCreateSession={createSession}
              onToggleMarkForExport={toggleMarkForExport}
              onMovePage={movePage}
              onDeletePage={confirmDeletePage}
              onOpenFullscreen={openFullscreenFromSidebar}
              leftWidth={leftWidth}
            />

            {/* Left Resize Handle */}
            <div
              className="w-1 bg-zinc-800 hover:bg-amber-500 cursor-col-resize transition-colors relative group flex items-center justify-center"
              onMouseDown={() => setIsDraggingLeft(true)}
            >
              <div className="absolute inset-y-0 -inset-x-2" />
              <div className="absolute w-1 h-12 bg-zinc-700 rounded-full group-hover:bg-amber-500 transition-colors" />
            </div>
          </>
        )}

        {/* Middle Section - Story Settings + Prompt (4/10 = 40%) */}
        {!isMobile && (
          <>
            <aside
              className="border-r border-zinc-800 bg-zinc-900 flex flex-col transition-all"
              style={{ width: `${middleWidth}px`, minWidth: '400px', maxWidth: '900px' }}
            >
              {/* Top Half - Story Settings & Options */}
              <div className="h-1/2 border-b border-zinc-800 bg-zinc-900 overflow-hidden">
                <StorySettingsPanel
                  context={context}
                  config={config}
                  onContextChange={updateSessionContext}
                  onConfigChange={setConfig}
                />
              </div>

              {/* Bottom Half - Prompt Area */}
              <PromptPanel
                prompt={prompt}
                currentSession={currentSession}
                loading={loading}
                error={error}
                batchLoading={batchLoading}
                batchProgress={batchProgress}
                config={config}
                onPromptChange={setPrompt}
                onGenerate={handleGenerate}
                onBatchGenerate={handleBatchGenerate}
                onCancelBatch={cancelBatchGenerate}
              />
            </aside>

            {/* Middle Resize Handle */}
            <div
              className="w-1 bg-zinc-800 hover:bg-amber-500 cursor-col-resize transition-colors relative group flex items-center justify-center"
              onMouseDown={() => setIsDraggingMiddle(true)}
            >
              <div className="absolute inset-y-0 -inset-x-2" />
              <div className="absolute w-1 h-12 bg-zinc-700 rounded-full group-hover:bg-amber-500 transition-colors" />
            </div>
          </>
        )}

        {/* Right Section - Canvas (4/10 = 40%) or Full width on mobile */}
        <CanvasArea
          loading={loading}
          currentImage={currentImage}
          onShowFullscreen={() => setShowFullscreen(true)}
          onAddToProject={addToProject}
          onDiscardImage={() => setCurrentImage(null)}
        />

        {/* Chat History Overlay */}
        {showChat && currentSession && (
          <ChatHistoryPanel
            currentSession={currentSession}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          to { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100 font-manga text-xl">
              {sessionToDelete ? 'Delete Session?' : 'Delete Page?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400" style={{ fontFamily: 'var(--font-inter)' }}>
              {sessionToDelete
                ? 'This will permanently delete this session and all its pages. This action cannot be undone.'
                : 'This will permanently delete this page. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (sessionToDelete) {
                  deleteSession();
                } else if (pageToDelete) {
                  deletePage();
                }
              }}
              className="bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-[0_3px_0_0_rgb(153,27,27)]"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fullscreen Image Modal */}
      {showFullscreen && (currentImage || fullscreenImage) && (
        <FullscreenModal
          imageUrl={fullscreenImage || currentImage || ''}
          isFromCanvas={!!currentImage && !fullscreenImage}
          onClose={() => {
            setShowFullscreen(false);
            setFullscreenImage(null);
          }}
          onAddToProject={currentImage && !fullscreenImage ? addToProject : undefined}
        />
      )}
    </div >
  );
};

export default MangaGeneratorV2;


