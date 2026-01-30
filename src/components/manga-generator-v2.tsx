'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Eye, Settings, Layers, MessageSquare, X, LogOut, Download } from 'lucide-react';
import { toast } from 'sonner';
import { safeArray, generateId, normalizeSession } from '@/lib/utils/react-utils';
import { extractErrorMessage } from '@/lib/utils/error-handler';
import { cleanUserPrompt } from '@/lib/utils/prompt-utils';
import { authStore } from '@/lib/services/auth-client';
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
  PanelBorderStyle,
  GeneratedManga,
  MangaProject,
  MangaConfig,
  DialogueDensity,
  Language,
  MangaSession,
} from '@/lib/types';
import { loadProject, updateProjectMeta, saveProject, saveSession, deleteProject, deleteSession as deleteSessionApi, deletePages, deleteImage, deleteImages, addPageToSession } from '@/lib/services/storage-service';
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
    style: MangaStyle.MANHWA_3D,
    inking: InkingStyle.GPEN,
    screentone: ScreentoneDensity.MEDIUM,
    layout: PanelLayout.SINGLE,
    aspectRatio: AspectRatio.PORTRAIT,
    useColor: false,
    dialogueDensity: DialogueDensity.MEDIUM,
    language: Language.ENGLISH,
    panelBorderStyle: PanelBorderStyle.FULL_BORDER,
    context: '',
    autoContinueStory: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0); // 0-100
  const [retryCount, setRetryCount] = useState(0); // Track retry attempts
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const batchCancelledRef = useRef(false);
  const batchGeneratingRef = useRef(false); // Guard to prevent multiple simultaneous batch generations
  const generatingRef = useRef(false); // Guard to prevent multiple simultaneous single generations
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [pagesToDelete, setPagesToDelete] = useState<string[] | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [mobileTab, setMobileTab] = useState<'sessions' | 'settings' | 'prompt'>('sessions');

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

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const openFullscreenFromSidebar = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
    setShowFullscreen(true);
  };

  // Load preferences from project (MongoDB) instead of localStorage
  useEffect(() => {
    if (project?.preferences) {
      if (project.preferences.leftWidth) {
        setLeftWidth(project.preferences.leftWidth);
      }
      if (project.preferences.middleWidth) {
        setMiddleWidth(project.preferences.middleWidth);
      }
    }
  }, [project?.preferences]);

  // Save leftWidth to MongoDB via project preferences (small API)
  useEffect(() => {
    if (project && project.id) {
      const newPreferences = {
        ...(project.preferences || {}),
        leftWidth,
      };
      setProject(prev => ({
        ...prev,
        preferences: newPreferences,
      }));
      updateProjectMeta(project.id, { preferences: newPreferences }).catch(err =>
        console.error('Failed to update preferences (leftWidth)', err),
      );
    }
  }, [leftWidth, project?.id]);

  // Save middleWidth to MongoDB via project preferences (small API)
  useEffect(() => {
    if (project && project.id) {
      const newPreferences = {
        ...(project.preferences || {}),
        middleWidth,
      };
      setProject(prev => ({
        ...prev,
        preferences: newPreferences,
      }));
      updateProjectMeta(project.id, { preferences: newPreferences }).catch(err =>
        console.error('Failed to update preferences (middleWidth)', err),
      );
    }
  }, [middleWidth, project?.id]);

  // Mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setShowSettings(false);
        // Close mobile drawers when switching to desktop
        setShowMobileSidebar(false);
        setShowMobileSettings(false);
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
              // Load config from session (including storyDirection), or use default with context
              if (normalizedSession.config) {
                setConfig({ ...normalizedSession.config, context: normalizedSession.context });
              } else {
                setConfig(prev => ({ ...prev, context: normalizedSession.context }));
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load project from MongoDB", err);
      }
    };
    init();
  }, []);

  const createSession = useCallback((name: string) => {
    const newSession: MangaSession = {
      id: generateId(),
      name,
      context: context || '',
      pages: [],
      chatHistory: [],
      config: { ...config },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setCurrentSession(newSession);
    setProject(prev => ({
      ...prev,
      sessions: [...safeArray(prev.sessions), newSession],
      currentSessionId: newSession.id
    }));

    if (project && project.id) {
      saveSession(project.id, newSession).catch(err =>
        console.error('Failed to save new session', err),
      );
    }
  }, [context, config, project?.id]);

  const switchSession = useCallback((sessionId: string) => {
    const session = safeArray(project.sessions).find(s => s.id === sessionId);
    if (session) {
      const normalizedSession = normalizeSession(session);
      setCurrentSession(normalizedSession);
      setContext(normalizedSession.context);
      if (normalizedSession.config) {
        setConfig({ ...normalizedSession.config, context: normalizedSession.context });
      } else {
        setConfig(prev => ({ ...prev, context: normalizedSession.context }));
      }
      setProject(prev => ({ ...prev, currentSessionId: sessionId }));
    }
  }, [project.sessions]);

  // Debounce timer for context updates to prevent lag
  const contextUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update config and save to session (including storyDirection)
  const updateConfig = useCallback((newConfig: MangaConfig) => {
    setConfig(newConfig);

    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        config: { ...newConfig },
        updatedAt: Date.now()
      };
      setCurrentSession(updatedSession);
      setProject(prev => ({
        ...prev,
        sessions: safeArray(prev.sessions).map(s =>
          s.id === currentSession.id ? updatedSession : s
        )
      }));
    }
  }, [currentSession]);

  const updateSessionContext = useCallback((newContext: string) => {
    try {
      const maxContextLength = 10000;
      const trimmedContext = newContext.length > maxContextLength
        ? newContext.substring(0, maxContextLength)
        : newContext;

      setContext(trimmedContext);
      const newConfig = { ...config, context: trimmedContext };
      setConfig(newConfig);

      if (contextUpdateTimerRef.current) {
        clearTimeout(contextUpdateTimerRef.current);
      }

      contextUpdateTimerRef.current = setTimeout(() => {
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            context: trimmedContext,
            config: { ...newConfig },
            updatedAt: Date.now()
          };
          setCurrentSession(updatedSession);
          setProject(prev => ({
            ...prev,
            sessions: safeArray(prev.sessions).map(s =>
              s.id === currentSession.id ? updatedSession : s
            )
          }));
        }
      }, 500);
    } catch (error) {
      console.error("Error updating context:", error);
      setError(extractErrorMessage(error) || "Failed to update context. Please try again.");
    }
  }, [config, currentSession]);

  const confirmDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const deleteSession = async () => {
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

    // Backend delete
    if (project && project.id) {
      try {
        await deleteSessionApi(project.id, sessionToDelete);
      } catch (err) {
        console.error('Failed to delete session on backend', err);
        setError(extractErrorMessage(err) || 'Failed to delete session on server.');
      }
    }

    setDeleteDialogOpen(false);
    setSessionToDelete(null);
    setPagesToDelete(null);
  };

  const confirmDeletePage = (pageId: string) => {
    setPageToDelete(pageId);
    setDeleteDialogOpen(true);
  };

  const deletePage = async () => {
    if (!pageToDelete) return;
    await removePage(pageToDelete);
    setDeleteDialogOpen(false);
    setPageToDelete(null);
    setPagesToDelete(null);
  };

  const confirmDeletePages = async (pageIds: string[]) => {
    if (pageIds.length === 0) return;
    setPagesToDelete(pageIds);
    setDeleteDialogOpen(true);
  };

  const deleteSelectedPages = async () => {
    if (!pagesToDelete || pagesToDelete.length === 0) return;
    const ids = pagesToDelete;
    await removePages(ids);
    if (project && project.id) {
      try {
        await deletePages(project.id, ids);
      } catch (err) {
        console.error('Failed to delete pages on backend', err);
      }
    }
    setDeleteDialogOpen(false);
    setPagesToDelete(null);
    setPageToDelete(null);
    setSessionToDelete(null);
  };

  // Removed global project auto-save; updates now go through smaller APIs (meta, session, pages)

  const handleGenerate = async () => {
    // Guard: Prevent multiple simultaneous generations
    if (generatingRef.current || loading || batchLoading) {
      console.warn('Generation already in progress, ignoring duplicate call');
      return;
    }

    const hasPages = currentSession && currentSession.pages.length > 0;
    const isAutoContinue = config.autoContinueStory && hasPages;

    // Allow empty prompt if auto-continue is enabled
    if (!prompt.trim() && !isAutoContinue) return;

    // Set guard immediately
    generatingRef.current = true;

    let workingSession = currentSession;
    if (!workingSession) {
      const newSessionId = generateId();
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
      if (project && project.id) {
        // Single save is enough for both single-generate and batch flows
        saveSession(project.id, newSession).catch(err =>
          console.error('Failed to save new session', err),
        );
      }
    }

    setLoading(true);
    setError(null);
    setGenerationProgress(0);
    setRetryCount(0);

    // Clean user prompt before using it
    const cleanedUserPrompt = prompt ? cleanUserPrompt(prompt) : '';
    const finalPrompt = cleanedUserPrompt || (isAutoContinue ? 'Continue the story naturally' : '');

    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content: finalPrompt,
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

    // Simulate progress
    const startProgress = () => {
      // Clear any existing interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      setGenerationProgress(0);
      let currentProgress = 0;
      
      // Simulate progress: start fast, slow down near the end
      progressIntervalRef.current = setInterval(() => {
        if (currentProgress < 90) {
          // Fast progress from 0-90%
          const increment = Math.random() * 8 + 2; // 2-10% increments
          currentProgress = Math.min(90, currentProgress + increment);
          setGenerationProgress(currentProgress);
        } else if (currentProgress < 95) {
          // Slower progress from 90-95%
          currentProgress = Math.min(95, currentProgress + 0.5);
          setGenerationProgress(currentProgress);
        } else if (currentProgress < 99) {
          // Very slow progress from 95-99%
          currentProgress = Math.min(99, currentProgress + 0.2);
          setGenerationProgress(currentProgress);
        }
        // Stay at 99% until actual completion
      }, 200); // Update every 200ms
    };

    startProgress();

    try {
      const sessionHistory = workingSession.pages || [];
      const configWithContext = { ...config, context: context || config.context };
      // Get selected reference page IDs from session
      const selectedReferencePageIds = workingSession.selectedReferencePageIds || [];
      // Use cleaned prompt for generation
      const imageUrl = await generateMangaImage(
        finalPrompt, 
        configWithContext, 
        sessionHistory,
        selectedReferencePageIds.length > 0 ? selectedReferencePageIds : undefined
      );
      
      // Complete progress to 100%
      setGenerationProgress(100);
      
      // Small delay to show 100% before hiding
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCurrentImage(imageUrl);

      const assistantMessage = {
        id: generateId(),
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
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to generate manga. Please try again.";
      const finalRetryCount = err?.retryCount || 0;
      const maxRetries = err?.maxRetries || 5;
      
      // Show toast notification with retry info
      if (finalRetryCount >= maxRetries) {
        toast.error("Generation Failed", {
          description: `Đã thử ${finalRetryCount} lần nhưng không thể tạo ảnh. ${errorMessage.includes('PROHIBITED_CONTENT') || errorMessage.includes('IMAGE_SAFETY') ? 'Prompt có thể vi phạm chính sách nội dung. Vui lòng thử lại với prompt khác.' : 'Vui lòng thử lại sau.'}`,
          duration: 6000,
        });
      } else {
        toast.error("Generation Failed", {
          description: errorMessage,
          duration: 4000,
        });
      }
      
      setError(errorMessage);
    } finally {
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setLoading(false);
      setGenerationProgress(0);
      setRetryCount(0);
      generatingRef.current = false; // Release guard
    }
  };

  const handleBatchGenerate = async (totalPages: number = 10) => {
    // Guard: Prevent multiple simultaneous batch generations
    // Check guard FIRST before any other operations
    if (batchGeneratingRef.current) {
      console.warn('⚠️ Batch generation already in progress (batchGeneratingRef), ignoring duplicate call');
      return;
    }

    if (batchLoading) {
      console.warn('⚠️ Batch generation already in progress (batchLoading), ignoring duplicate call');
      return;
    }

    if (loading) {
      console.warn('⚠️ Single generation in progress, ignoring batch call');
      return;
    }

    // Set guard IMMEDIATELY - before any async operations or checks
    batchGeneratingRef.current = true;

    const hasPages = currentSession && currentSession.pages.length > 0;
    const isAutoContinue = config.autoContinueStory && hasPages;

    // Allow empty prompt if auto-continue is enabled
    if (!prompt.trim() && !isAutoContinue) {
      batchGeneratingRef.current = false; // Release guard if returning early
      return;
    }

    // Set unique ID for tracking
    const batchId = generateId();
    console.log(`🚀 Starting batch generation [${batchId}]: ${totalPages} pages`);

    let workingSession = currentSession;
    if (!workingSession) {
      const newSessionId = generateId();
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
    let currentPrompt = originalPrompt;

    // CRITICAL: Initialize localSession with a deep copy to avoid reference issues
    // This ensures we have an independent copy that won't be affected by state updates
    let localSession: MangaSession = {
      ...workingSession,
      pages: [...(workingSession.pages || [])],
      chatHistory: [...(workingSession.chatHistory || [])]
    };

    console.log(`📊 [Batch ${batchId}] Initial session state: ${localSession.pages.length} pages`);

    for (let i = 0; i < totalPages; i++) {
      if (batchCancelledRef.current) {
        setBatchLoading(false);
        setBatchProgress(null);
        setError(`Batch cancelled. Generated ${generatedCount} of ${totalPages} pages.`);
        return;
      }

      try {
        // CRITICAL: Always use localSession.pages to ensure we have the latest pages
        const sessionHistory = localSession.pages || [];

        // Log current state for debugging
        console.log(`📄 [Batch ${batchId}] Generating page ${i + 1}/${totalPages}. Current session has ${sessionHistory.length} pages.`);

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
            batchGeneratingRef.current = false;
            setError(`Batch cancelled. Generated ${generatedCount} of ${totalPages} pages.`);
            return;
          }

          // AI generates the NEXT prompt based on previous pages
          // Use actual page number: sessionHistory.length + 1 (not i + 1)
          const actualPageNumber = sessionHistory.length + 1;
          setBatchProgress({ current: i, total: totalPages });

          console.log(`🤖 [Batch ${batchId}] Generating prompt for page ${actualPageNumber} (iteration ${i + 1})`);
          currentPrompt = await generateNextPrompt(
            sessionHistory,
            context || config.context || '',
            originalPrompt,
            actualPageNumber,
            totalPages,
            configWithContext
          );

          // Check cancel after API call
          if (batchCancelledRef.current) {
            setBatchLoading(false);
            setBatchProgress(null);
            batchGeneratingRef.current = false;
            setError(`Batch cancelled. Generated ${generatedCount} of ${totalPages} pages.`);
            return;
          }

          console.log(`✅ [Batch ${batchId}] AI Generated Prompt for Page ${actualPageNumber}:`, currentPrompt);
        } else {
          console.log(`✅ [Batch ${batchId}] Using original prompt for Page 1:`, currentPrompt);
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
            console.log(`🖼️ [Batch ${batchId}] Generating image for page ${i + 1} (session has ${sessionHistory.length} pages)...`);
            // Get selected reference page IDs from current session
            const selectedReferencePageIds = currentSession?.selectedReferencePageIds || [];
            imageUrl = await generateMangaImage(
              currentPrompt, 
              configWithContext, 
              sessionHistory,
              selectedReferencePageIds.length > 0 ? selectedReferencePageIds : undefined
            );

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
          id: generateId(),
          url: imageUrl,
          prompt: currentPrompt, // Use the actual prompt (original or AI-generated)
          timestamp: Date.now(),
          config: configWithContext,
          markedForExport: true
        };

        // Update local session - CRITICAL: Always use spread to create new array
        localSession = {
          ...localSession,
          pages: [...localSession.pages, newPage],
          updatedAt: Date.now()
        };

        console.log(`✅ [Batch ${batchId}] Page ${i + 1} generated successfully. Session now has ${localSession.pages.length} pages.`);

        // Update React state - use functional updates to avoid race conditions
        setCurrentSession(prevSession => {
          // Only update if this is still the current session
          if (prevSession?.id === sessionId) {
            return localSession;
          }
          return prevSession;
        });

        setProject(prev => {
          // Use functional update to ensure we're working with latest state
          const currentSessions = Array.isArray(prev.sessions) ? prev.sessions : [];
          const sessionIndex = currentSessions.findIndex(s => s.id === sessionId);

          // Only update if session still exists
          if (sessionIndex === -1) {
            return prev;
          }

          const updatedSessions = [...currentSessions];
          updatedSessions[sessionIndex] = localSession;

          return {
            ...prev,
            pages: [...prev.pages, newPage],
            sessions: updatedSessions
          };
        });

        // Persist new page to backend and WAIT for it to complete so refresh (F5) doesn't cancel the save.
        if (project && project.id) {
          try {
            await addPageToSession(project.id, sessionId, newPage);
          } catch (err) {
            console.error('Failed to persist batch-generated page to backend', err);
          }
        }

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
        batchGeneratingRef.current = false; // Release guard on error
        return;
      }
    }

    setBatchLoading(false);
    setBatchProgress(null);
    setPrompt('');

    if (!batchCancelledRef.current) {
      setError(null);
    }

    // Release guard
    batchGeneratingRef.current = false;
    console.log(`🏁 [Batch ${batchId}] Batch generation completed. Generated ${generatedCount} pages.`);
  };

  const cancelBatchGenerate = () => {
    batchCancelledRef.current = true;
    batchGeneratingRef.current = false; // Release guard
    // Immediately update UI state - don't wait for API
    setBatchLoading(false);
    setBatchProgress(null);
    setError('Batch generation cancelled.');
  };

  const addToProject = (markForExport = true) => {
    if (!currentImage) return;

    const newPage: GeneratedManga = {
      id: generateId(),
      url: currentImage,
      prompt,
      timestamp: Date.now(),
      config: { ...config, context: context || config.context },
      markedForExport: markForExport
    };

    // Build updated objects explicitly so we can persist the same payload we render.
    const baseProject = project;
    const sessions = Array.isArray(baseProject.sessions) ? baseProject.sessions : [];

    let updatedProject: MangaProject;
    let updatedSession: MangaSession | null = null;

    if (currentSession) {
      updatedSession = {
        ...currentSession,
        pages: [...currentSession.pages, newPage],
        updatedAt: Date.now()
      };

      updatedProject = {
        ...baseProject,
        pages: [...baseProject.pages, newPage],
        sessions: sessions.map(s => (s.id === currentSession.id ? updatedSession! : s)),
        currentSessionId: baseProject.currentSessionId ?? currentSession.id,
      };

      setCurrentSession(updatedSession);
      setProject(updatedProject);
    } else {
      // Fallback: no session loaded; still persist the project pages so the image isn't lost on refresh.
      updatedProject = {
        ...baseProject,
        pages: [...baseProject.pages, newPage],
        sessions,
      };

      setProject(updatedProject);
    }

    // Persist to backend. Note: repo currently only implements /api/projects, so we use saveProject.
    saveProject(updatedProject).catch(err =>
      console.error('Failed to persist project after ADD TO PDF', err),
    );

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

  const toggleReferencePage = (pageId: string) => {
    if (!currentSession) return;
    
    const currentReferenceIds = currentSession.selectedReferencePageIds || [];
    const isCurrentlyReference = currentReferenceIds.includes(pageId);
    
    const updatedReferenceIds = isCurrentlyReference
      ? currentReferenceIds.filter(id => id !== pageId)
      : [...currentReferenceIds, pageId];
    
    const updatedSession = {
      ...currentSession,
      selectedReferencePageIds: updatedReferenceIds,
      updatedAt: Date.now()
    };
    
    setCurrentSession(updatedSession);
    setProject(prev => ({
      ...prev,
      sessions: (Array.isArray(prev.sessions) ? prev.sessions : []).map(s =>
        s.id === currentSession.id ? updatedSession : s
      )
    }));
    
    if (project && project.id) {
      saveSession(project.id, updatedSession).catch(err =>
        console.error('Failed to save session after toggle reference page', err),
      );
    }
    
    toast.success(isCurrentlyReference ? "Removed from reference" : "Set as reference", {
      description: `This page will ${isCurrentlyReference ? 'no longer' : 'now'} be used for character consistency when continuing the story.`,
      duration: 3000,
    });
  };

  const removePage = async (id: string) => {
    if (!id) return;

    // Find page to get image ID for deletion
    const pageToDelete = currentSession?.pages.find(p => p.id === id) ||
      project.pages.find(p => p.id === id);

    // Delete image from MongoDB if it's stored there
    if (pageToDelete?.url && !pageToDelete.url.startsWith('data:image') && !pageToDelete.url.startsWith('http')) {
      try {
        const { deleteImage } = await import('@/lib/services/storage-service');
        await deleteImage(pageToDelete.url);
      } catch (error) {
        console.error('Failed to delete image from MongoDB:', error);
        // Continue with page removal even if image delete fails
      }
    }

    if (currentSession) {
      // Filter out the page to delete
      const remainingPages = currentSession.pages.filter(p => p.id !== id);

      // Create updated session - KEEP the session even if it has no pages
      const updatedSession = {
        ...currentSession,
        pages: remainingPages,
        updatedAt: Date.now()
      };

      // Update current session state
      setCurrentSession(updatedSession);

      // Update project state - ensure session is preserved
      setProject(prev => {
        const sessions = Array.isArray(prev.sessions) ? prev.sessions : [];
        const updatedSessions = sessions.map(s =>
          s.id === currentSession.id ? updatedSession : s
        );

        // Ensure the session still exists in the updated sessions array
        const sessionStillExists = updatedSessions.some(s => s.id === currentSession.id);
        if (!sessionStillExists) {
          // If session was somehow removed, add it back
          updatedSessions.push(updatedSession);
        }

        return {
          ...prev,
          pages: prev.pages.filter(p => p.id !== id),
          sessions: updatedSessions,
          // Preserve currentSessionId if it matches
          currentSessionId: prev.currentSessionId === currentSession.id ? currentSession.id : prev.currentSessionId
        };
      });
    } else {
      // No current session - just remove from project pages
      setProject(prev => ({
        ...prev,
        pages: prev.pages.filter(p => p.id !== id)
      }));
    }
  };

  const removePages = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;

    // Find pages to get image IDs for deletion
    const pagesToDelete = [
      ...(currentSession?.pages.filter(p => ids.includes(p.id)) || []),
      ...project.pages.filter(p => ids.includes(p.id) && !currentSession?.pages.some(sp => sp.id === p.id))
    ];

    // Collect image IDs to delete
    const imageIdsToDelete = pagesToDelete
      .map(p => p.url)
      .filter(url => url && !url.startsWith('data:image') && !url.startsWith('http'));

    // Delete images from MongoDB
    if (imageIdsToDelete.length > 0) {
      try {
        const { deleteImages } = await import('@/lib/services/storage-service');
        await deleteImages(imageIdsToDelete);
      } catch (error) {
        console.error('Failed to delete images from MongoDB:', error);
        // Continue with page removal even if image delete fails
      }
    }

    if (currentSession) {
      // Filter out the pages to delete
      const remainingPages = currentSession.pages.filter(p => !ids.includes(p.id));

      // Create updated session - KEEP the session even if it has no pages
      const updatedSession = {
        ...currentSession,
        pages: remainingPages,
        updatedAt: Date.now()
      };

      // Update current session state
      setCurrentSession(updatedSession);

      // Update project state - ensure session is preserved
      setProject(prev => {
        const sessions = Array.isArray(prev.sessions) ? prev.sessions : [];
        const updatedSessions = sessions.map(s =>
          s.id === currentSession.id ? updatedSession : s
        );

        // Ensure the session still exists in the updated sessions array
        const sessionStillExists = updatedSessions.some(s => s.id === currentSession.id);
        if (!sessionStillExists) {
          // If session was somehow removed, add it back
          updatedSessions.push(updatedSession);
        }

        return {
          ...prev,
          pages: prev.pages.filter(p => !ids.includes(p.id)),
          sessions: updatedSessions,
          // Preserve currentSessionId if it matches
          currentSessionId: prev.currentSessionId === currentSession.id ? currentSession.id : prev.currentSessionId
        };
      });
    } else {
      // No current session - just remove from project pages
      setProject(prev => ({
        ...prev,
        pages: prev.pages.filter(p => !ids.includes(p.id))
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

  const pagesToShow = useMemo(() =>
    currentSession ? currentSession.pages : project.pages,
    [currentSession, project.pages]
  );

  const exportCount = useMemo(() =>
    pagesToShow.filter(p => p.markedForExport).length,
    [pagesToShow]
  );

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Top Header - Đồng bộ với landing page */}
      <header className="h-14 sm:h-16 border-b border-zinc-800/50 bg-zinc-950/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 lg:px-8 flex-shrink-0 shadow-lg shadow-black/20 sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-6 min-w-0 flex-1">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 overflow-hidden rounded-lg border border-zinc-800/50 bg-white/5 flex items-center justify-center ring-1 ring-zinc-700/30">
              <img
                src="/logo.png"
                alt="Manga Studio logo"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <h1 className="text-sm sm:text-base lg:text-xl font-manga text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)] hidden sm:block">
              MANGA STUDIO
            </h1>
          </Link>
          {currentSession && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-zinc-900/60 rounded-lg border border-zinc-800/60 backdrop-blur-sm shadow-sm ring-1 ring-zinc-700/20 flex-shrink-0 min-w-0">
              <Layers size={12} className="sm:w-3.5 sm:h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-semibold text-zinc-200 truncate" style={{ fontFamily: 'var(--font-inter)' }}>
                {currentSession.name}
              </span>
              <span className="text-[9px] sm:text-[10px] text-zinc-500 font-medium flex-shrink-0">({currentSession.pages.length})</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
          {isMobile && (
            <>
              <button
                onClick={() => {
                  setShowMobileSidebar(!showMobileSidebar);
                  setShowMobileSettings(false);
                }}
                className="p-2.5 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-all active:scale-95 touch-manipulation"
                title="Sessions"
              >
                <Layers size={20} className="text-zinc-300" />
              </button>
              <button
                onClick={() => {
                  setShowMobileSettings(!showMobileSettings);
                  setShowMobileSidebar(false);
                }}
                className="p-2.5 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-all active:scale-95 touch-manipulation"
                title="Generate"
              >
                <Settings size={20} className="text-zinc-300" />
              </button>
            </>
          )}
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 sm:p-2.5 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-all relative group touch-manipulation"
            title="Chat History"
          >
            <MessageSquare size={18} className="sm:w-5 sm:h-5 text-zinc-300 group-hover:text-amber-400 transition-colors" />
            {currentSession && currentSession.chatHistory && currentSession.chatHistory.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full text-[9px] flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/30 ring-2 ring-zinc-900">
                {currentSession.chatHistory.length}
              </span>
            )}
          </button>
          {!isMobile && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-zinc-800/60 transition-all group"
              title="Settings"
            >
              <Settings size={20} className="text-zinc-400 group-hover:text-amber-400 transition-colors" />
            </button>
          )}
          <div className="h-6 sm:h-8 w-px bg-zinc-800/50" />
          <button
            onClick={() => router.push('/studio/preview')}
            className="px-2.5 sm:px-4 lg:px-5 py-1.5 sm:py-2 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-lg font-bold text-[10px] sm:text-xs lg:text-sm flex items-center gap-1 sm:gap-1.5 lg:gap-2 transition-all shadow-[0_3px_0_0_rgb(180,83,9)] hover:shadow-[0_3px_0_0_rgb(180,83,9)] active:shadow-[0_1px_0_0_rgb(180,83,9)] active:translate-y-0.5 hover:scale-105 touch-manipulation"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <Eye size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">PREVIEW</span>
            <span className="sm:hidden font-bold">({exportCount})</span>
            {exportCount > 0 && <span className="hidden sm:inline text-[10px] lg:text-xs ml-0.5">({exportCount})</span>}
          </button>
          <button
            onClick={() => router.push('/studio/preview?autoDownload=1')}
            className="hidden sm:flex px-3 lg:px-4 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg text-xs lg:text-sm font-semibold items-center gap-1.5 hover:bg-zinc-800 hover:border-zinc-500 transition-all"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <Download size={14} className="lg:w-4 lg:h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={() => {
              // Clear tokens from localStorage and state
              authStore.clear();
              authStore.setError(null); // Clear any error messages
              toast.success('Signed out successfully', {
                description: 'You have been logged out',
                duration: 2000,
              });
              // Redirect to login page
              router.push('/auth/login');
            }}
            className="p-2 sm:p-2.5 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-all group touch-manipulation"
            title="Sign Out"
          >
            <LogOut size={18} className="sm:w-5 sm:h-5 text-zinc-300 group-hover:text-red-400 transition-colors" />
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
              config={config}
              onSwitchSession={switchSession}
              onDeleteSession={confirmDeleteSession}
              onCreateSession={createSession}
              onToggleMarkForExport={toggleMarkForExport}
              onToggleReferencePage={toggleReferencePage}
              onMovePage={movePage}
              onDeletePage={confirmDeletePage}
              onDeletePages={confirmDeletePages}
              onOpenFullscreen={openFullscreenFromSidebar}
              onConfigChange={updateConfig}
              leftWidth={leftWidth}
            />

            {/* Left Resize Handle */}
            <div
              className="w-1 bg-zinc-800/30 hover:bg-amber-500/60 cursor-col-resize transition-all duration-200 relative group flex items-center justify-center"
              onMouseDown={() => setIsDraggingLeft(true)}
            >
              <div className="absolute inset-y-0 -inset-x-2" />
              <div className="absolute w-1 h-12 bg-zinc-700/50 rounded-full group-hover:bg-amber-400 transition-all duration-200 shadow-lg shadow-amber-500/20" />
            </div>
          </>
        )}

        {/* Middle Section - Story Settings + Prompt (4/10 = 40%) */}
        {!isMobile && (
          <>
            <aside
              className="border-r border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm flex flex-col transition-all shadow-lg shadow-black/10"
              style={{ width: `${middleWidth}px`, minWidth: '400px', maxWidth: '900px' }}
            >
              {/* Top Half - Story Settings & Options */}
              <div className="h-1/2 border-b border-zinc-800/50 bg-zinc-950/30 overflow-hidden">
                <StorySettingsPanel
                  context={context}
                  config={config}
                  onContextChange={updateSessionContext}
                  onConfigChange={updateConfig}
                />
              </div>

              {/* Bottom Half - Prompt Area */}
              <div className="h-1/2 bg-zinc-950/30 overflow-hidden">
              <PromptPanel
                prompt={prompt}
                currentSession={currentSession}
                loading={loading}
                error={error}
                batchLoading={batchLoading}
                batchProgress={batchProgress}
                generationProgress={generationProgress}
                retryCount={retryCount}
                config={config}
                onPromptChange={setPrompt}
                onGenerate={handleGenerate}
                onBatchGenerate={handleBatchGenerate}
                onCancelBatch={cancelBatchGenerate}
              />
              </div>
            </aside>

            {/* Middle Resize Handle */}
            <div
              className="w-1 bg-zinc-800/30 hover:bg-amber-500/60 cursor-col-resize transition-all duration-200 relative group flex items-center justify-center"
              onMouseDown={() => setIsDraggingMiddle(true)}
            >
              <div className="absolute inset-y-0 -inset-x-2" />
              <div className="absolute w-1 h-12 bg-zinc-700/50 rounded-full group-hover:bg-amber-400 transition-all duration-200 shadow-lg shadow-amber-500/20" />
            </div>
          </>
        )}

        {/* Right Section - Canvas (4/10 = 40%) or Full width on mobile */}
        <CanvasArea
          loading={loading}
          generationProgress={generationProgress}
          retryCount={retryCount}
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

        {/* Mobile Sidebar Drawer - Sessions */}
        {isMobile && showMobileSidebar && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
              onClick={() => setShowMobileSidebar(false)}
            />
            <div className="fixed left-0 top-16 bottom-0 w-[85vw] max-w-sm bg-zinc-900 border-r border-zinc-800 z-50 lg:hidden flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95 backdrop-blur-sm">
                <h2 className="text-lg font-bold text-zinc-200 uppercase tracking-wider">Sessions</h2>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 rounded-lg hover:bg-zinc-800 active:scale-95 transition-transform"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <SessionSidebar
                  project={project}
                  currentSession={currentSession}
                  pagesToShow={pagesToShow}
                  config={config}
                  onSwitchSession={(id) => {
                    switchSession(id);
                    setShowMobileSidebar(false);
                  }}
                  onDeleteSession={confirmDeleteSession}
                  onCreateSession={(name) => {
                    createSession(name);
                    setShowMobileSidebar(false);
                  }}
                  onToggleMarkForExport={toggleMarkForExport}
                  onToggleReferencePage={toggleReferencePage}
                  onMovePage={movePage}
                  onDeletePage={confirmDeletePage}
                  onDeletePages={confirmDeletePages}
                  onOpenFullscreen={openFullscreenFromSidebar}
                  onConfigChange={updateConfig}
                  leftWidth={320}
                />
              </div>
            </div>
          </>
        )}

        {/* Mobile Bottom Sheet - Prompt & Settings */}
        {isMobile && showMobileSettings && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
              onClick={() => setShowMobileSettings(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50 lg:hidden flex flex-col shadow-2xl rounded-t-3xl max-h-[85vh] animate-in slide-in-from-bottom duration-300">
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
              </div>
              
              {/* Tab Switcher */}
              <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-4">
                <button
                  onClick={() => setMobileTab('prompt')}
                  className={`flex-1 px-4 py-4 text-sm font-bold transition-all relative ${mobileTab === 'prompt'
                    ? 'text-amber-400'
                    : 'text-zinc-400'
                    }`}
                >
                  Generate
                  {mobileTab === 'prompt' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setMobileTab('settings')}
                  className={`flex-1 px-4 py-4 text-sm font-bold transition-all relative ${mobileTab === 'settings'
                    ? 'text-amber-400'
                    : 'text-zinc-400'
                    }`}
                >
                  Settings
                  {mobileTab === 'settings' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setShowMobileSettings(false)}
                  className="p-3 text-zinc-400 hover:text-zinc-200 active:scale-95 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {mobileTab === 'prompt' ? (
                  <div className="p-4 pb-8">
                    <PromptPanel
                      prompt={prompt}
                      currentSession={currentSession}
                      loading={loading}
                      error={error}
                      batchLoading={batchLoading}
                      batchProgress={batchProgress}
                      generationProgress={generationProgress}
                      retryCount={retryCount}
                      config={config}
                      onPromptChange={setPrompt}
                      onGenerate={() => {
                        handleGenerate();
                        setShowMobileSettings(false);
                      }}
                      onBatchGenerate={(count) => {
                        handleBatchGenerate(count);
                        setShowMobileSettings(false);
                      }}
                      onCancelBatch={cancelBatchGenerate}
                    />
                  </div>
                ) : (
                  <div className="p-4 pb-8">
                    <StorySettingsPanel
                      context={context}
                      config={config}
                      onContextChange={updateSessionContext}
                      onConfigChange={updateConfig}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
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
        @keyframes slide-in-from-bottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slide-in-from-left {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-in {
          animation-fill-mode: both;
        }
        .slide-in-from-bottom {
          animation: slide-in-from-bottom 0.3s ease-out;
        }
        .slide-in-from-left {
          animation: slide-in-from-left 0.3s ease-out;
        }
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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
        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
        }
      `}</style>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-950/95 border border-zinc-800/60 backdrop-blur-md shadow-2xl">
          <AlertDialogHeader>
              <AlertDialogTitle className="text-zinc-100 font-manga text-xl drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]">
              {sessionToDelete
                ? 'Delete Session?'
                : pagesToDelete
                  ? 'Delete Pages?'
                  : 'Delete Page?'}
              </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400" style={{ fontFamily: 'var(--font-inter)' }}>
              {sessionToDelete
                ? 'This will permanently delete this session and all its pages. This action cannot be undone.'
                : pagesToDelete
                  ? `Bạn có chắc chắn muốn xóa ${pagesToDelete.length} ảnh? Hành động này không thể hoàn tác.`
                  : 'This will permanently delete this page. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 border-zinc-700/60 rounded-xl transition-all"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
              if (sessionToDelete) {
                  deleteSession();
              } else if (pagesToDelete && pagesToDelete.length > 0) {
                  deleteSelectedPages();
              } else if (pageToDelete) {
                  deletePage();
              }
              }}
              className="bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-[0_4px_0_0_rgb(153,27,27)] rounded-xl transition-all hover:scale-105"
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

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/50 z-50 lg:hidden safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-around h-16 px-2">
            {/* Sessions Tab */}
            <button
              onClick={() => {
                setShowMobileSidebar(!showMobileSidebar);
                setShowMobileSettings(false);
                setMobileTab('sessions');
              }}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all relative ${showMobileSidebar ? 'bg-zinc-800/60 text-amber-400' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300'
                }`}
            >
              <Layers size={20} className={showMobileSidebar ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : ''} />
              <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Sessions</span>
            </button>

            {/* Prompt Tab */}
            <button
              onClick={() => {
                setShowMobileSettings(true);
                setShowMobileSidebar(false);
                setMobileTab('prompt');
              }}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all relative ${showMobileSettings && mobileTab === 'prompt' ? 'bg-zinc-800/60 text-amber-400' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300'
                }`}
            >
              <Sparkles size={20} className={showMobileSettings && mobileTab === 'prompt' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : ''} />
              <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Generate</span>
            </button>

            {/* Settings Tab */}
            <button
              onClick={() => {
                setShowMobileSettings(true);
                setShowMobileSidebar(false);
                setMobileTab('settings');
              }}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all relative ${showMobileSettings && mobileTab === 'settings' ? 'bg-zinc-800/60 text-amber-400' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300'
                }`}
            >
              <Settings size={20} className={showMobileSettings && mobileTab === 'settings' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : ''} />
              <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Settings</span>
            </button>

            {/* Preview Button */}
            <button
              onClick={() => router.push('/studio/preview')}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300 relative"
            >
              <Eye size={20} />
              <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Preview</span>
              {exportCount > 0 && (
                <span className="absolute top-0 right-2 w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full text-[8px] flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/30 ring-2 ring-zinc-900">
                  {exportCount}
                </span>
              )}
            </button>
            {/* Download Button (mobile) */}
            <button
              onClick={() => router.push('/studio/preview?autoDownload=1')}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300"
            >
              <Download size={20} />
              <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Download</span>
            </button>
          </div>
        </div>
      )}
    </div >
  );
};

export default MangaGeneratorV2;


