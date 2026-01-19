'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MangaProject, GeneratedManga, MangaSession } from '@/lib/types';
import { loadProject, saveProject } from '@/lib/services/storage-service';
import { Plus, X, Layers } from 'lucide-react';

export default function PreviewPage() {
  const router = useRouter();
  const [project, setProject] = useState<MangaProject | null>(null);
  const [currentSession, setCurrentSession] = useState<MangaSession | null>(null);
  const [exportPages, setExportPages] = useState<GeneratedManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  // Ensure body can scroll on preview page
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await loadProject('default');
        if (saved) {
          const normalizedProject = {
            ...saved,
            sessions: Array.isArray(saved.sessions) ? saved.sessions : [],
            pages: Array.isArray(saved.pages) ? saved.pages : []
          };
          setProject(normalizedProject);

          // Get current session
          const session = normalizedProject.currentSessionId
            ? normalizedProject.sessions.find(s => s.id === normalizedProject.currentSessionId)
            : null;

          setCurrentSession(session || null);

          // Only show pages marked for export from current session
          if (session) {
            const markedPages = session.pages.filter(p => p.markedForExport);
            console.log('Session pages:', session.pages.length);
            console.log('Marked for export:', markedPages.length);
            console.log('Export pages:', markedPages);
            setExportPages(markedPages);
          }
        }
      } catch (err) {
        console.error("Failed to load project", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Reload on focus to get latest data
  useEffect(() => {
    const handleFocus = async () => {
      const saved = await loadProject('default');
      if (saved && saved.currentSessionId) {
        const session = saved.sessions?.find(s => s.id === saved.currentSessionId);
        if (session) {
          setCurrentSession(session);
          setExportPages(session.pages.filter(p => p.markedForExport));
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const togglePageExport = async (pageId: string) => {
    if (!project || !currentSession) return;

    const updatedSession = {
      ...currentSession,
      pages: currentSession.pages.map(p =>
        p.id === pageId ? { ...p, markedForExport: !p.markedForExport } : p
      )
    };

    const updatedProject = {
      ...project,
      sessions: project.sessions.map(s =>
        s.id === currentSession.id ? updatedSession : s
      )
    };

    await saveProject(updatedProject);
    setProject(updatedProject);
    setCurrentSession(updatedSession);
    setExportPages(updatedSession.pages.filter(p => p.markedForExport));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-zinc-800">Loading preview...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white print:min-h-0">
      <div className="min-h-full p-4 md:p-8 print:p-0">
        <div className="max-w-4xl mx-auto space-y-12 export-container print:max-w-full print:space-y-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center print:hidden border-b border-zinc-200 pb-6 mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-manga text-black">
                {project?.title || 'Manga Preview'}
              </h1>
              <p className="text-zinc-500 text-sm mt-1 font-manga">
                {currentSession ? `Session: ${currentSession.name}` : 'No active session'}
              </p>
              <p className="text-zinc-600 text-xs mt-1 font-manga">
                {currentSession ? `${currentSession.pages.length} total images | ` : ''}
                {exportPages.length} marked for PDF ✓
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowSessionPicker(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-manga font-bold shadow-lg hover:bg-blue-400 transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                ADD FROM OTHER SESSIONS
              </button>
              <button
                onClick={() => {
                  console.log('Print triggered with', exportPages.length, 'pages');
                  console.log('Export pages URLs:', exportPages.map(p => p.url));
                  window.print();
                }}
                className="px-8 py-3 bg-amber-500 text-black rounded-xl font-manga font-bold shadow-lg hover:bg-amber-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={exportPages.length === 0}
                title={exportPages.length === 0 ? 'No pages marked for export' : `Print ${exportPages.length} pages`}
              >
                <span>DOWNLOAD PDF ({exportPages.length})</span>
              </button>
              <button
                onClick={() => router.push('/studio')}
                className="px-6 py-3 border border-zinc-300 rounded-xl text-zinc-600 font-manga font-bold hover:bg-zinc-50 transition-all"
              >
                BACK TO STUDIO
              </button>
            </div>
          </div>

          {/* Session Picker Modal */}
          {showSessionPicker && project && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
                  <h2 className="text-2xl font-manga text-black">Add Images from Other Sessions</h2>
                  <button onClick={() => setShowSessionPicker(false)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                    <X size={24} className="text-zinc-600" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {project.sessions
                      .filter(s => s.id !== currentSession?.id)
                      .map(session => (
                        <div key={session.id} className="border border-zinc-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Layers size={20} className="text-amber-500" />
                            <h3 className="text-lg font-manga text-black">{session.name}</h3>
                            <span className="text-sm text-zinc-500">({session.pages.length} images)</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {session.pages.map(page => (
                              <div key={page.id} className="relative group">
                                <img
                                  src={page.url || "/placeholder.svg"}
                                  alt=""
                                  className="w-full aspect-[3/4] object-cover rounded-lg border-2 border-zinc-200"
                                />
                                <button
                                  onClick={() => {
                                    // Add this image to current session marked for export
                                    if (currentSession) {
                                      const newPage = { ...page, id: `${page.id}-copy-${Date.now()}`, markedForExport: true };
                                      const updatedSession = {
                                        ...currentSession,
                                        pages: [...currentSession.pages, newPage]
                                      };
                                      const updatedProject = {
                                        ...project,
                                        sessions: project.sessions.map(s =>
                                          s.id === currentSession.id ? updatedSession : s
                                        )
                                      };
                                      saveProject(updatedProject);
                                      setProject(updatedProject);
                                      setCurrentSession(updatedSession);
                                      setExportPages(updatedSession.pages.filter(p => p.markedForExport));
                                    }
                                  }}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                                >
                                  <div className="px-4 py-2 bg-amber-500 text-black rounded-lg font-manga font-bold">
                                    ADD TO PDF
                                  </div>
                                </button>
                              </div>
                            ))}
                          </div>
                          {session.pages.length === 0 && (
                            <p className="text-center text-zinc-400 font-manga py-4">No images in this session</p>
                          )}
                        </div>
                      ))}
                    {project.sessions.filter(s => s.id !== currentSession?.id).length === 0 && (
                      <p className="text-center text-zinc-400 font-manga py-8">No other sessions available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Images in Current Session - Print Hidden */}
          {currentSession && currentSession.pages.length > 0 && (
            <div className="print:hidden mb-12">
              <h2 className="text-2xl font-manga text-black mb-4">All Images in Current Session</h2>
              <p className="text-sm text-zinc-500 mb-6 font-manga">
                Click on images to toggle PDF export mark (✓ = will be included in PDF)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentSession.pages.map((page) => (
                  <div
                    key={page.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${page.markedForExport
                      ? 'border-green-500 shadow-lg shadow-green-500/20'
                      : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    onClick={() => togglePageExport(page.id)}
                  >
                    <img
                      src={page.url || "/placeholder.svg"}
                      alt=""
                      className="w-full aspect-[3/4] object-cover"
                    />
                    {page.markedForExport && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                        ✓
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-white/90 rounded-lg font-manga font-bold text-sm">
                        {page.markedForExport ? 'REMOVE FROM PDF' : 'ADD TO PDF'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF Preview - Only marked images */}
          <div className="print:hidden">
            <h2 className="text-2xl font-manga text-black mb-4">PDF Preview</h2>
            <div className="space-y-16">
              {exportPages.map((page, idx) => (
                <div key={page.id} className="flex flex-col items-center">
                  <div className="w-full bg-white shadow-2xl border border-zinc-100">
                    <img src={page.url || "/placeholder.svg"} alt={`Page ${idx + 1}`} className="w-full h-auto block" />
                  </div>
                  <div className="mt-4 text-center text-zinc-400 font-manga text-xl">
                    — PAGE {idx + 1} —
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Print-only layout - Clean output for PDF */}
          {exportPages.length > 0 && (
            <div className="hidden print:block">
              {exportPages.map((page, idx) => (
                <div key={`print-${page.id}`} className="page-break">
                  <img
                    src={page.url || "/placeholder.svg"}
                    alt={`Page ${idx + 1}`}
                    onError={(e) => {
                      console.error('Failed to load image:', page.url);
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {exportPages.length === 0 && (
            <div className="text-center py-40 print:hidden">
              <div className="text-zinc-300 font-manga text-3xl font-bold mb-4">
                NO PAGES MARKED FOR EXPORT
              </div>
              <p className="text-sm text-zinc-400 font-manga mb-2">
                {currentSession && currentSession.pages.length > 0
                  ? `You have ${currentSession.pages.length} images in this session. Click on them above to mark for PDF.`
                  : 'Mark pages with the checkmark icon in the studio or click images above.'}
              </p>
              <button
                onClick={() => router.push('/studio')}
                className="mt-6 px-6 py-3 bg-amber-500 text-black rounded-xl font-manga font-bold hover:bg-amber-400 transition-all"
              >
                GO TO STUDIO
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: visible !important;
            background: white !important;
          }
          
          * {
            overflow: visible !important;
          }
          
          .page-break {
            page-break-after: always;
            page-break-inside: avoid;
            break-after: page;
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            margin: 0;
            position: relative;
          }
          
          .page-break:last-child {
            page-break-after: auto;
          }
          
          .page-break img {
            max-width: 100%;
            max-height: 100vh;
            width: auto;
            height: auto;
            display: block;
            object-fit: contain;
          }
        }
      `}</style>
    </div>
  );
}

