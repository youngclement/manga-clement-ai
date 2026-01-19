'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, History, Trash2, FileText, Eye } from 'lucide-react';

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


const MangaGenerator = () => {
  const router = useRouter();

  // Config State
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

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // Project State
  const [project, setProject] = useState<MangaProject>({
    id: 'default',
    title: 'New Chapter',
    pages: [],
    sessions: [],
    currentSessionId: undefined
  });

  // Session State
  const [currentSession, setCurrentSession] = useState<MangaSession | null>(null);

  // Load project on mount
  useEffect(() => {
    const init = async () => {
      try {
        const saved = await loadProject('default');
        if (saved) {
          // Ensure sessions is always an array
          const normalizedProject = {
            ...saved,
            sessions: Array.isArray(saved.sessions) ? saved.sessions : [],
            pages: Array.isArray(saved.pages) ? saved.pages : []
          };
          setProject(normalizedProject);
          // Initialize current session if exists
          if (normalizedProject.currentSessionId) {
            const session = normalizedProject.sessions.find(s => s.id === normalizedProject.currentSessionId);
            if (session) {
              // Ensure chatHistory exists
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

  // Create or switch session
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

  // Save project whenever it changes
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

    // Ensure we have a session
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

    // Add user message to chat history
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
      // Get session history for continuity
      const sessionHistory = workingSession.pages || [];
      const configWithContext = { ...config, context: context || config.context };
      const imageUrl = await generateMangaImage(prompt, configWithContext, sessionHistory);
      setCurrentImage(imageUrl);

      // Add assistant response to chat history
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
      setError("Failed to generate ink. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addToProject = (markForExport = false) => {
    if (!currentImage) return;

    // Safer unique id for page entries
    const safeId = Date.now().toString() + Math.random().toString(36).substring(2);

    const newPage: GeneratedManga = {
      id: safeId,
      url: currentImage,
      prompt,
      timestamp: Date.now(),
      config: { ...config, context: context || config.context },
      markedForExport: markForExport
    };

    // Add to both project pages and current session
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


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full max-w-[1600px] mx-auto px-4 py-4 overflow-hidden">
      {/* 1. Project Management Sidebar */}
      <aside className="lg:col-span-3 space-y-4 order-3 lg:order-1 h-[calc(100vh-100px)] flex flex-col">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col grow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-manga text-amber-500 flex items-center gap-2">
              <History /> STORY VOLUME
            </h2>
            <button
              onClick={() => router.push('/studio/preview')}
              className="text-[10px] px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full hover:bg-amber-500/20 transition-all font-bold"
            >
              PREVIEW PDF
            </button>
          </div>

          <div className="grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {(() => {
              const pagesToShow = currentSession ? currentSession.pages : project.pages;
              return pagesToShow.length === 0 ? (
                <div className="text-center py-20 opacity-20 italic text-xs flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-dashed border-zinc-500 flex items-center justify-center">?</div>
                  {currentSession ? 'No pages in this session.' : 'No pages in this chapter.'}
                </div>
              ) : (
                pagesToShow.map((page, idx) => (
                  <div key={page.id} className="group relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-lg hover:border-amber-500/30 transition-all">
                    <img src={page.url || "/placeholder.svg"} className="w-full h-32 object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-[10px] font-bold text-amber-500 border border-amber-500/20">P.{idx + 1}</div>
                    {page.markedForExport && (
                      <div className="absolute top-2 left-16 px-2 py-1 bg-green-500/80 backdrop-blur-sm rounded text-[10px] font-bold text-white border border-green-400/30">PDF</div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-5px] group-hover:translate-y-0 duration-200">
                      <button
                        onClick={() => toggleMarkForExport(page.id)}
                        title={page.markedForExport ? "Remove from PDF" : "Mark for PDF"}
                        className={`p-1.5 rounded text-white transition-colors ${page.markedForExport ? 'bg-green-600 hover:bg-green-500' : 'bg-zinc-800 hover:bg-green-600'}`}
                      >
                        <FileText size={14} />
                      </button>
                      <button onClick={() => movePage(page.id, 'up')} title="Move Up" className="p-1.5 bg-zinc-800 rounded hover:bg-amber-500 text-white transition-colors text-xs">▲</button>
                      <button onClick={() => movePage(page.id, 'down')} title="Move Down" className="p-1.5 bg-zinc-800 rounded hover:bg-amber-500 text-white transition-colors text-xs">▼</button>
                      <button onClick={() => removePage(page.id)} title="Delete Page" className="p-1.5 bg-red-900/80 rounded hover:bg-red-600 text-white transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              );
            })()}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block" style={{ fontFamily: 'var(--font-inter)' }}>Chapter Title</label>
            <input
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50 transition-colors"
              style={{ fontFamily: 'var(--font-inter)' }}
              value={project.title}
              onChange={(e) => setProject(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Chapter Title..."
            />
          </div>
        </div>
      </aside>

      {/* 2. Advanced Controls Sidebar */}
      <aside className="lg:col-span-3 space-y-6 order-1 lg:order-2 overflow-y-auto h-[calc(100vh-100px)] pr-2 custom-scrollbar">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-manga text-amber-500 flex items-center gap-2">
              <Sparkles /> MANGA STUDIO
            </h2>
            {currentSession && currentSession.chatHistory && currentSession.chatHistory.length > 0 && (
              <div className="text-[10px] text-zinc-500" style={{ fontFamily: 'var(--font-inter)' }}>
                {currentSession.chatHistory.length} messages
              </div>
            )}
          </div>

          {/* Chat History */}
          {currentSession && currentSession.chatHistory && currentSession.chatHistory.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 max-h-64 overflow-y-auto custom-scrollbar space-y-3">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                Chat History
              </div>
              {currentSession.chatHistory.map((msg) => (
                <div key={msg.id} className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-800/50 border border-zinc-700'}`}>
                  <div className="text-[9px] font-bold text-zinc-400 mb-1" style={{ fontFamily: 'var(--font-inter)' }}>
                    {msg.role === 'user' ? 'YOU' : 'AI'}
                  </div>
                  <div className="text-[10px] text-zinc-300" style={{ fontFamily: 'var(--font-inter)' }}>
                    {msg.content}
                  </div>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Generated" className="mt-2 rounded w-full max-h-20 object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {/* Session Management */}
            <div className="space-y-2 p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>Session</label>
              {currentSession ? (
                <div className="space-y-2">
                  <div className="text-xs text-amber-400 font-semibold" style={{ fontFamily: 'var(--font-inter)' }}>
                    {currentSession.name} ({currentSession.pages.length} pages)
                  </div>
                  <select
                    value={currentSession.id}
                    onChange={(e) => switchSession(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10px] cursor-pointer"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {(Array.isArray(project.sessions) ? project.sessions : []).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.pages.length} pages)</option>
                    ))}
                  </select>
                  <button
                    onClick={() => createSession('Session ' + new Date().toLocaleTimeString())}
                    className="w-full px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold hover:bg-amber-500/30 transition-all"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    + NEW SESSION
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => createSession('Session ' + new Date().toLocaleDateString())}
                  className="w-full px-3 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold hover:bg-amber-500/30 transition-all"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  CREATE SESSION
                </button>
              )}
            </div>

            {/* Context Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>Context / World Setting</label>
              <textarea
                value={context}
                onChange={(e) => updateSessionContext(e.target.value)}
                placeholder="Describe the world, characters, style, and continuity for this session. All images in this session will maintain consistency..."
                className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 transition-all resize-none outline-none"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>

            {/* Story Moment */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>Story Moment</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: A hero standing on a skyscraper overlooking a neon city..."
                className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 transition-all resize-none outline-none"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>Pen Style</label>
                <select
                  value={config.inking}
                  onChange={(e) => setConfig({ ...config, inking: e.target.value as InkingStyle })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] cursor-pointer"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {Object.values(InkingStyle).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>Screentones</label>
                <select
                  value={config.screentone}
                  onChange={(e) => setConfig({ ...config, screentone: e.target.value as ScreentoneDensity })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] cursor-pointer"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {Object.values(ScreentoneDensity).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>Page Layout</label>
              <select
                value={config.layout}
                onChange={(e) => setConfig({ ...config, layout: e.target.value as PanelLayout })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] cursor-pointer"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {Object.values(PanelLayout).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Dialogue & Language */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>Dialogue</label>
                <select
                  value={config.dialogueDensity}
                  onChange={(e) => setConfig({ ...config, dialogueDensity: e.target.value as DialogueDensity })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] cursor-pointer"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {Object.values(DialogueDensity).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>Language</label>
                <select
                  value={config.language}
                  onChange={(e) => setConfig({ ...config, language: e.target.value as Language })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] cursor-pointer"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>Aspect Ratio</label>
                <select
                  value={config.aspectRatio}
                  onChange={(e) => setConfig({ ...config, aspectRatio: e.target.value as AspectRatio })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] cursor-pointer"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>Color</label>
                <button
                  onClick={() => setConfig({ ...config, useColor: !config.useColor })}
                  className={`w-full h-[34px] rounded-lg transition-all flex items-center justify-center text-[10px] font-bold border ${config.useColor ? 'bg-amber-500 border-amber-400 text-black' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {config.useColor ? 'COLOR MODE' : 'B&W INK'}
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-manga text-2xl rounded-xl transition-all shadow-lg active:scale-95"
            >
              {loading ? "INKING..." : "GENERATE PAGE"}
            </button>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-[10px] font-medium text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 3. Canvas Preview Area */}
      <main className="lg:col-span-6 space-y-6 order-2 lg:order-3 h-[calc(100vh-100px)]">
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl h-full flex flex-col items-center justify-center relative overflow-hidden p-6 shadow-2xl">
          {loading && (
            <div className="flex flex-col items-center gap-8">
              <div className="w-64 h-[400px] bg-zinc-800 rounded-lg shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
                <div className="flex flex-col gap-4 p-8">
                  <div className="w-full h-1/2 bg-zinc-700/50 rounded animate-pulse"></div>
                  <div className="w-2/3 h-1/4 bg-zinc-700/50 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-amber-500 font-manga text-3xl tracking-[0.3em] animate-pulse">DRAWING PANELS</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gemini 2.5 Flash Engine at work</p>
              </div>
            </div>
          )}

          {!currentImage && !loading && (
            <div className="text-center space-y-6 opacity-40 max-w-sm">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles />
              </div>
              <p className="font-manga text-4xl">DRAFTING AREA</p>
              <p className="text-xs text-zinc-400 uppercase tracking-widest leading-loose">Describe a story moment on the left to begin your masterpiece. High-res manga ink will appear here.</p>
            </div>
          )}

          {currentImage && !loading && (
            <div className="w-full h-full flex flex-col items-center justify-between py-4 animate-in fade-in zoom-in duration-500">
              <div className="relative group max-h-[80%]">
                <img src={currentImage || "/placeholder.svg"} className="rounded shadow-[0_0_80px_rgba(0,0,0,0.9)] max-h-full object-contain border-10 border-white" />
                <div className="absolute top-4 right-4 flex gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <button
                    onClick={() => {
                      addToProject(true);
                      router.push('/studio/preview');
                    }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl shadow-2xl hover:bg-blue-400 font-bold text-sm uppercase tracking-tighter flex items-center gap-2"
                    title="Add to PDF & Preview"
                  >
                    <Eye size={16} />
                    <span>PREVIEW PDF</span>
                  </button>
                  <button
                    onClick={() => addToProject(false)}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl shadow-2xl hover:bg-emerald-400 font-bold text-sm uppercase tracking-tighter flex items-center gap-2"
                  >
                    <span>✓ COMMIT</span>
                  </button>
                  <button onClick={() => setCurrentImage(null)} className="p-3 bg-red-600 text-white rounded-xl shadow-2xl hover:bg-red-500">
                    <Trash2 />
                  </button>
                </div>
              </div>
              <div className="bg-zinc-950/50 backdrop-blur-md px-6 py-3 rounded-full border border-zinc-800 mt-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">New Draft Rendered • Choose action above</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default MangaGenerator;
