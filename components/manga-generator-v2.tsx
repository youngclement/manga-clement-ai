'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, History, Trash2, FileText, Eye, Settings, Layers, MessageSquare, Plus, X, ChevronDown, Maximize2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  ChatMessage,
} from '@/lib/types';
import { loadProject, saveProject } from '@/lib/services/storage-service';
import { generateMangaImage } from '@/lib/services/gemini-service';
import StorySettingsPanel from '@/components/story-settings-panel';


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
    context: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
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
    if (!prompt.trim()) return;

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
      content: prompt,
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
            <aside
              className="border-r border-zinc-800 bg-zinc-900 flex flex-col transition-all"
              style={{ width: `${leftWidth}px`, minWidth: '200px', maxWidth: '600px' }}
            >
              <div className="p-4 border-b border-zinc-800 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                    Pages
                  </h2>
                  <span className="text-[10px] text-zinc-500">{pagesToShow.length} total</span>
                </div>

                {/* Session Selector */}
                {currentSession ? (
                  <div className="space-y-2 mb-1">
                    <div className="flex gap-2">
                      <Select value={currentSession.id} onValueChange={switchSession}>
                        <SelectTrigger className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500 focus:border-amber-500 h-10 font-sans">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800">
                          {(Array.isArray(project.sessions) ? project.sessions : []).map(s => (
                            <SelectItem
                              key={s.id}
                              value={s.id}
                              className="text-zinc-300 hover:bg-amber-500/20 focus:bg-amber-500/20 focus:text-white cursor-pointer"
                            >
                              {s.name} ({s.pages.length})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => confirmDeleteSession(currentSession.id)}
                        className="px-3 py-2 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg transition-all shadow-[0_2px_0_0_rgb(153,27,27)] hover:shadow-[0_2px_0_0_rgb(153,27,27)] active:shadow-[0_0.5px_0_0_rgb(153,27,27)] active:translate-y-0.5"
                        title="Delete Session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => createSession('Session ' + new Date().toLocaleTimeString())}
                      className="w-full px-3 py-1.5 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_2px_0_0_rgb(5,150,105)] hover:shadow-[0_2px_0_0_rgb(5,150,105)] active:shadow-[0_0.5px_0_0_rgb(5,150,105)] active:translate-y-0.5"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      <Plus size={12} />
                      NEW SESSION
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => createSession('Session ' + new Date().toLocaleDateString())}
                    className="w-full px-3 py-2 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-lg text-sm font-bold transition-all shadow-[0_3px_0_0_rgb(180,83,9)] hover:shadow-[0_3px_0_0_rgb(180,83,9)] active:shadow-[0_1px_0_0_rgb(180,83,9)] active:translate-y-1"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    CREATE SESSION
                  </button>
                )}
              </div>

              {/* Pages Grid */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {pagesToShow.length === 0 ? (
                  <div className="text-center py-20 opacity-20">
                    <Layers size={40} className="mx-auto mb-3 text-zinc-600" />
                    <p className="text-xs text-zinc-500">No pages yet</p>
                  </div>
                ) : (
                  pagesToShow.map((page, idx) => (
                    <div key={page.id} className="group relative bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden hover:border-amber-500/30 transition-all">
                      <img src={page.url || "/placeholder.svg"} className="w-full h-40 object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-[10px] font-bold text-amber-500">
                        P.{idx + 1}
                      </div>
                      {page.markedForExport && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded text-[10px] font-bold text-white">
                          PDF
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 pb-3 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1 mb-0.5">
                          <button
                            onClick={() => openFullscreenFromSidebar(page.url)}
                            className="p-1.5 bg-gradient-to-b from-blue-500 to-blue-700 rounded text-white transition-all shadow-[0_2px_0_0_rgb(29,78,216)] active:translate-y-0.5"
                            title="View Fullscreen"
                          >
                            <Maximize2 size={12} />
                          </button>
                          <button
                            onClick={() => toggleMarkForExport(page.id)}
                            className={`flex-1 p-1.5 rounded text-white transition-all ${page.markedForExport ? 'bg-gradient-to-b from-green-400 to-green-600 shadow-[0_2px_0_0_rgb(5,150,105)]' : 'bg-gradient-to-b from-zinc-600 to-zinc-800 shadow-[0_2px_0_0_rgb(39,39,42)]'} active:translate-y-0.5`}
                            title={page.markedForExport ? "Remove from PDF" : "Mark for PDF"}
                          >
                            <FileText size={12} className="mx-auto" />
                          </button>
                          <button onClick={() => movePage(page.id, 'up')} className="p-1.5 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded text-white transition-all text-xs shadow-[0_2px_0_0_rgb(39,39,42)] active:translate-y-0.5">▲</button>
                          <button onClick={() => movePage(page.id, 'down')} className="p-1.5 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded text-white transition-all text-xs shadow-[0_2px_0_0_rgb(39,39,42)] active:translate-y-0.5">▼</button>
                          <button onClick={() => confirmDeletePage(page.id)} className="p-1.5 bg-gradient-to-b from-red-500 to-red-700 rounded text-white transition-all shadow-[0_2px_0_0_rgb(153,27,27)] active:translate-y-0.5">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>

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
              <div className="h-1/2 bg-zinc-900 p-4 flex flex-col">
                <div className="flex-1 flex flex-col gap-3">
                  {/* Step 3 Header */}
                  <div className="flex items-center gap-3 pb-2">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-black font-bold text-sm flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)' }}>
                        <span>Write Your Prompt</span>
                        {currentSession && currentSession.pages.length > 0 && (
                          <span className="text-[9px] text-green-500 font-normal normal-case">(Page {currentSession.pages.length + 1})</span>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Prompt Textarea */}
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={currentSession && currentSession.pages.length > 0
                      ? "Continue the story with the SAME characters from Context..."
                      : "Describe the scene: A hero standing on a rooftop, looking at the sunset..."}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm leading-relaxed text-zinc-300 placeholder:text-zinc-600 placeholder:text-xs focus:outline-none focus:border-amber-500 transition-colors resize-none custom-scrollbar"
                    style={{ fontFamily: 'var(--font-inter)' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleGenerate();
                      }
                    }}
                  />

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 disabled:from-zinc-800 disabled:to-zinc-900 disabled:text-zinc-600 text-black font-manga text-lg rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_0_rgb(180,83,9)] hover:shadow-[0_4px_0_0_rgb(180,83,9)] active:shadow-[0_1px_0_0_rgb(180,83,9)] disabled:shadow-none active:translate-y-1 disabled:translate-y-0"
                  >
                    <Sparkles size={20} />
                    {loading ? 'GENERATING...' : 'GENERATE'}
                  </button>

                  {/* Error Message */}
                  {error && (
                    <div className="p-2 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-[10px] text-center" style={{ fontFamily: 'var(--font-inter)' }}>
                      {error}
                    </div>
                  )}
                </div>
              </div>
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
        <main className="flex-1 bg-zinc-900 flex items-center justify-center p-8 overflow-hidden relative">
          {loading && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-64 h-80 bg-zinc-800 rounded-lg shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
              </div>
              <div className="text-amber-500 font-manga text-xl tracking-wider animate-pulse">GENERATING...</div>
            </div>
          )}

          {!currentImage && !loading && (
            <div className="text-center space-y-6 opacity-30 max-w-2xl">
              <p className="font-manga text-5xl text-zinc-600">CANVAS</p>
              <p className="text-lg text-zinc-500 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                Describe your story moment to generate manga
              </p>
            </div>
          )}

          {currentImage && !loading && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500">
              <div className="relative max-h-[95%] max-w-[95%] group">
                <img
                  src={currentImage}
                  className="rounded-xl shadow-2xl max-h-full max-w-full object-contain border border-zinc-800 cursor-pointer hover:border-amber-500 transition-all"
                  onClick={() => setShowFullscreen(true)}
                  title="Click to view fullscreen"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center p-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFullscreen(true)}
                      className="px-5 py-2.5 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-[0_3px_0_0_rgb(29,78,216)] hover:shadow-[0_3px_0_0_rgb(29,78,216)] active:shadow-[0_1px_0_0_rgb(29,78,216)] active:translate-y-1"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      <Maximize2 size={14} />
                      FULLSCREEN
                    </button>
                    <button
                      onClick={() => addToProject(true)}
                      className="px-5 py-2.5 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-[0_3px_0_0_rgb(5,150,105)] hover:shadow-[0_3px_0_0_rgb(5,150,105)] active:shadow-[0_1px_0_0_rgb(5,150,105)] active:translate-y-1"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      ✓ ADD TO PDF
                    </button>
                    <button
                      onClick={() => setCurrentImage(null)}
                      className="p-2.5 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg transition-all shadow-[0_3px_0_0_rgb(153,27,27)] hover:shadow-[0_3px_0_0_rgb(153,27,27)] active:shadow-[0_1px_0_0_rgb(153,27,27)] active:translate-y-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Chat History Overlay */}
        {showChat && currentSession && currentSession.chatHistory && currentSession.chatHistory.length > 0 && (
          <div className="absolute right-2 lg:right-4 top-20 w-[calc(100vw-1rem)] sm:w-96 max-h-[600px] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden z-10">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <h3 className="text-xs font-bold text-zinc-400 uppercase" style={{ fontFamily: 'var(--font-inter)' }}>
                Chat History
              </h3>
              <button onClick={() => setShowChat(false)} className="p-1 hover:bg-zinc-800 rounded transition-colors">
                <X size={16} className="text-zinc-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[540px] custom-scrollbar space-y-3">
              {currentSession.chatHistory.map((msg) => (
                <div key={msg.id} className={`p-2.5 rounded-lg ${msg.role === 'user' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-800/50'}`}>
                  <div className="text-[9px] font-bold text-zinc-400 mb-1" style={{ fontFamily: 'var(--font-inter)' }}>
                    {msg.role === 'user' ? 'YOU' : 'AI'}
                  </div>
                  <div className="text-[10px] text-zinc-300 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                    {msg.content}
                  </div>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Generated" className="mt-2 rounded w-full max-h-32 object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          to { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
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
      {
        showFullscreen && (currentImage || fullscreenImage) && (
          <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => {
              setShowFullscreen(false);
              setFullscreenImage(null);
            }}
          >
            <button
              onClick={() => {
                setShowFullscreen(false);
                setFullscreenImage(null);
              }}
              className="absolute top-4 right-4 p-3 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-white transition-all z-10 group"
              title="Close (ESC)"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {currentImage && !fullscreenImage && (
              <div className="absolute top-4 left-4 flex gap-3 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToProject(true);
                    setShowFullscreen(false);
                  }}
                  className="px-6 py-3 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  ✓ ADD TO PDF
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToProject(true);
                    setShowFullscreen(false);
                    router.push('/studio/preview');
                  }}
                  className="px-6 py-3 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  <Eye size={16} />
                  PREVIEW PDF
                </button>
              </div>
            )}

            <img
              src={fullscreenImage || currentImage || ''}
              alt="Fullscreen manga"
              className="max-h-[95vh] max-w-[95vw] object-contain rounded-lg shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )
      }
    </div >
  );
};

export default MangaGeneratorV2;


