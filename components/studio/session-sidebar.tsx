'use client'

import { Layers, Trash2, Plus, FileText, Maximize2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MangaProject, MangaSession, GeneratedManga } from '@/lib/types';

interface SessionSidebarProps {
    project: MangaProject;
    currentSession: MangaSession | null;
    pagesToShow: GeneratedManga[];
    onSwitchSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onCreateSession: (name: string) => void;
    onToggleMarkForExport: (pageId: string) => void;
    onMovePage: (pageId: string, direction: 'up' | 'down') => void;
    onDeletePage: (pageId: string) => void;
    onOpenFullscreen: (imageUrl: string) => void;
    leftWidth: number;
}

export default function SessionSidebar({
    project,
    currentSession,
    pagesToShow,
    onSwitchSession,
    onDeleteSession,
    onCreateSession,
    onToggleMarkForExport,
    onMovePage,
    onDeletePage,
    onOpenFullscreen,
    leftWidth,
}: SessionSidebarProps) {
    return (
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
                            <Select value={currentSession.id} onValueChange={onSwitchSession}>
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
                                onClick={() => onDeleteSession(currentSession.id)}
                                className="px-3 py-2 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg transition-all shadow-[0_2px_0_0_rgb(153,27,27)] hover:shadow-[0_2px_0_0_rgb(153,27,27)] active:shadow-[0_0.5px_0_0_rgb(153,27,27)] active:translate-y-0.5"
                                title="Delete Session"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <button
                            onClick={() => onCreateSession('Session ' + new Date().toLocaleTimeString())}
                            className="w-full px-3 py-1.5 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_2px_0_0_rgb(5,150,105)] hover:shadow-[0_2px_0_0_rgb(5,150,105)] active:shadow-[0_0.5px_0_0_rgb(5,150,105)] active:translate-y-0.5"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            <Plus size={12} />
                            NEW SESSION
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => onCreateSession('Session ' + new Date().toLocaleDateString())}
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
                                        onClick={() => onOpenFullscreen(page.url)}
                                        className="p-1.5 bg-gradient-to-b from-blue-500 to-blue-700 rounded text-white transition-all shadow-[0_2px_0_0_rgb(29,78,216)] active:translate-y-0.5"
                                        title="View Fullscreen"
                                    >
                                        <Maximize2 size={12} />
                                    </button>
                                    <button
                                        onClick={() => onToggleMarkForExport(page.id)}
                                        className={`flex-1 p-1.5 rounded text-white transition-all ${page.markedForExport ? 'bg-gradient-to-b from-green-400 to-green-600 shadow-[0_2px_0_0_rgb(5,150,105)]' : 'bg-gradient-to-b from-zinc-600 to-zinc-800 shadow-[0_2px_0_0_rgb(39,39,42)]'} active:translate-y-0.5`}
                                        title={page.markedForExport ? "Remove from PDF" : "Mark for PDF"}
                                    >
                                        <FileText size={12} className="mx-auto" />
                                    </button>
                                    <button onClick={() => onMovePage(page.id, 'up')} className="p-1.5 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded text-white transition-all text-xs shadow-[0_2px_0_0_rgb(39,39,42)] active:translate-y-0.5">▲</button>
                                    <button onClick={() => onMovePage(page.id, 'down')} className="p-1.5 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded text-white transition-all text-xs shadow-[0_2px_0_0_rgb(39,39,42)] active:translate-y-0.5">▼</button>
                                    <button onClick={() => onDeletePage(page.id)} className="p-1.5 bg-gradient-to-b from-red-500 to-red-700 rounded text-white transition-all shadow-[0_2px_0_0_rgb(153,27,27)] active:translate-y-0.5">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}

