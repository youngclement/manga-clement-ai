'use client'

import { useState } from 'react';
import { Layers, Trash2, Plus, FileText, Maximize2, CheckSquare, Square, Image as ImageIcon, X, Star } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MangaProject, MangaSession, GeneratedManga, MangaConfig, ReferenceImage } from '@/lib/types';

interface SessionSidebarProps {
    project: MangaProject;
    currentSession: MangaSession | null;
    pagesToShow: GeneratedManga[];
    config?: MangaConfig;
    onSwitchSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onCreateSession: (name: string) => void;
    onToggleMarkForExport: (pageId: string) => void;
    onMovePage: (pageId: string, direction: 'up' | 'down') => void;
    onDeletePage: (pageId: string) => void;
    onDeletePages: (pageIds: string[]) => void;
    onOpenFullscreen: (imageUrl: string) => void;
    onConfigChange?: (config: MangaConfig) => void;
    onToggleReferencePage?: (pageId: string) => void; // New callback for toggling reference pages
    leftWidth: number;
}

export default function SessionSidebar({
    project,
    currentSession,
    pagesToShow,
    config,
    onSwitchSession,
    onDeleteSession,
    onCreateSession,
    onToggleMarkForExport,
    onMovePage,
    onDeletePage,
    onDeletePages,
    onOpenFullscreen,
    onConfigChange,
    onToggleReferencePage,
    leftWidth,
}: SessionSidebarProps) {
    const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
    const [showReferencePanel, setShowReferencePanel] = useState(false);
    
    // Get selected reference page IDs from session
    const selectedReferencePageIds = currentSession?.selectedReferencePageIds || [];
    const isReferencePage = (pageId: string) => selectedReferencePageIds.includes(pageId);

    // Helper to normalize image format
    const normalizeImage = (img: string | ReferenceImage): ReferenceImage => {
        if (typeof img === 'string') {
            return { url: img, enabled: true };
        }
        return img;
    };

    // Helper to get image URL
    const getImageUrl = (img: string | ReferenceImage): string => {
        return typeof img === 'string' ? img : img.url;
    };

    // Helper to check if image is enabled
    const isImageEnabled = (img: string | ReferenceImage): boolean => {
        return typeof img === 'string' ? true : img.enabled;
    };

    const toggleImageEnabled = (index: number) => {
        if (!config || !onConfigChange) return;
        const currentImages = config.referenceImages || [];
        const normalizedImages = currentImages.map(img => normalizeImage(img));
        normalizedImages[index].enabled = !normalizedImages[index].enabled;
        onConfigChange({ ...config, referenceImages: normalizedImages });
    };

    const removeReferenceImage = async (index: number) => {
        if (!config || !onConfigChange) return;
        const currentImages = config.referenceImages || [];
        const imageToRemove = currentImages[index];
        
        // If image is stored in MongoDB, delete it
        if (imageToRemove) {
            const imageUrl = typeof imageToRemove === 'string' ? imageToRemove : imageToRemove.url;
            // Check if it's a MongoDB image ID (not base64 or http)
            if (imageUrl && !imageUrl.startsWith('data:image') && !imageUrl.startsWith('http')) {
                try {
                    const { deleteImage } = await import('@/lib/services/storage-service');
                    await deleteImage(imageUrl);
                } catch (error) {
                    console.error('Failed to delete image from MongoDB:', error);
                    // Continue with removal from config even if DB delete fails
                }
            }
        }
        
        const newImages = currentImages.filter((_, i) => i !== index);
        onConfigChange({ ...config, referenceImages: newImages });
    };

    const referenceImages = config?.referenceImages || [];
    const enabledCount = referenceImages.filter(img => isImageEnabled(img)).length;

    const togglePageSelection = (pageId: string) => {
        setSelectedPages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pageId)) {
                newSet.delete(pageId);
            } else {
                newSet.add(pageId);
            }
            return newSet;
        });
    };

    const selectAllPages = () => {
        if (selectedPages.size === pagesToShow.length) {
            setSelectedPages(new Set());
        } else {
            setSelectedPages(new Set(pagesToShow.map(p => p.id)));
        }
    };

    const handleDeleteSelected = () => {
        if (selectedPages.size > 0) {
            const pageIds = Array.from(selectedPages);
            // Only delete pages that actually exist in pagesToShow
            const validPageIds = pageIds.filter(id => pagesToShow.some(p => p.id === id));
            if (validPageIds.length > 0) {
                onDeletePages(validPageIds);
            }
            setSelectedPages(new Set());
        }
    };

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

                {/* Selection Controls */}
                {pagesToShow.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                        <button
                            onClick={selectAllPages}
                            className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-zinc-400 hover:text-amber-500 transition-colors"
                            title={selectedPages.size === pagesToShow.length ? "Deselect All" : "Select All"}
                        >
                            {selectedPages.size === pagesToShow.length ? (
                                <CheckSquare size={14} />
                            ) : (
                                <Square size={14} />
                            )}
                            <span>{selectedPages.size === pagesToShow.length ? 'Deselect All' : 'Select All'}</span>
                        </button>
                        {selectedPages.size > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded text-[10px] font-bold transition-all shadow-[0_2px_0_0_rgb(153,27,27)] hover:shadow-[0_2px_0_0_rgb(153,27,27)] active:shadow-[0_0.5px_0_0_rgb(153,27,27)] active:translate-y-0.5"
                            >
                                <Trash2 size={12} />
                                Delete ({selectedPages.size})
                            </button>
                        )}
                    </div>
                )}

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
                        {/* Reference Images Button */}
                        {referenceImages.length > 0 && (
                            <button
                                onClick={() => setShowReferencePanel(!showReferencePanel)}
                                className="w-full px-3 py-1.5 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_2px_0_0_rgb(29,78,216)] hover:shadow-[0_2px_0_0_rgb(29,78,216)] active:shadow-[0_0.5px_0_0_rgb(29,78,216)] active:translate-y-0.5"
                                style={{ fontFamily: 'var(--font-inter)' }}
                            >
                                <ImageIcon size={12} />
                                REFERENCE ({enabledCount}/{referenceImages.length})
                            </button>
                        )}
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

            {/* Reference Images Panel */}
            {showReferencePanel && referenceImages.length > 0 && (
                <div className="border-b border-zinc-800 bg-zinc-950 p-4 max-h-64 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase" style={{ fontFamily: 'var(--font-inter)' }}>
                            Reference Images
                        </h3>
                        <button
                            onClick={() => setShowReferencePanel(false)}
                            className="p-1 hover:bg-zinc-800 rounded transition-colors"
                            title="Close"
                        >
                            <X size={14} className="text-zinc-500" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {referenceImages.map((img, idx) => {
                            const imageUrl = getImageUrl(img);
                            const enabled = isImageEnabled(img);
                            return (
                                <div key={idx} className="relative group">
                                    <img
                                        src={imageUrl}
                                        alt={`Reference ${idx + 1}`}
                                        className={`w-full h-20 object-cover rounded border transition-all ${
                                            enabled 
                                                ? 'border-zinc-800 opacity-100' 
                                                : 'border-zinc-700 opacity-50 grayscale'
                                        }`}
                                    />
                                    {/* Enable/Disable Checkbox */}
                                    <button
                                        onClick={() => toggleImageEnabled(idx)}
                                        className={`absolute top-1 left-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                            enabled
                                                ? 'bg-amber-500 border-amber-500'
                                                : 'bg-zinc-800 border-zinc-600'
                                        }`}
                                        title={enabled ? 'Disable (will be saved but not used)' : 'Enable (will be used in generation)'}
                                    >
                                        {enabled && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeReferenceImage(idx)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove image"
                                    >
                                        <X size={12} className="text-white" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Pages Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {pagesToShow.length === 0 ? (
                    <div className="text-center py-20 opacity-20">
                        <Layers size={40} className="mx-auto mb-3 text-zinc-600" />
                        <p className="text-xs text-zinc-500">No pages yet</p>
                    </div>
                ) : (
                    pagesToShow.map((page, idx) => {
                        const isSelected = selectedPages.has(page.id);
                        return (
                        <div 
                            key={page.id} 
                            className={`group relative bg-zinc-950 border rounded-lg overflow-hidden transition-all cursor-pointer ${
                                isSelected 
                                    ? 'border-amber-500 ring-2 ring-amber-500/50' 
                                    : 'border-zinc-800 hover:border-amber-500/30'
                            }`}
                            onClick={(e) => {
                                // Only toggle selection if clicking on the card itself, not buttons
                                if ((e.target as HTMLElement).closest('button') === null) {
                                    togglePageSelection(page.id);
                                }
                            }}
                        >
                            <img src={page.url || "/placeholder.svg"} className="w-full h-40 object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePageSelection(page.id);
                                    }}
                                    className="p-1 bg-black/80 backdrop-blur-sm rounded hover:bg-black/90 transition-colors"
                                    title={isSelected ? "Deselect" : "Select"}
                                >
                                    {isSelected ? (
                                        <CheckSquare size={14} className="text-amber-500" />
                                    ) : (
                                        <Square size={14} className="text-zinc-400" />
                                    )}
                                </button>
                                <div className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-[10px] font-bold text-amber-500">
                                    P.{idx + 1}
                                </div>
                                {/* Reference Toggle Button */}
                                {onToggleReferencePage && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleReferencePage(page.id);
                                        }}
                                        className={`p-1 bg-black/80 backdrop-blur-sm rounded hover:bg-black/90 transition-all ${
                                            isReferencePage(page.id)
                                                ? 'text-amber-400 ring-1 ring-amber-400/50'
                                                : 'text-zinc-400 hover:text-amber-400'
                                        }`}
                                        title={isReferencePage(page.id) ? "Remove from reference (used for continuation)" : "Set as reference (used for continuation)"}
                                    >
                                        <Star size={14} className={isReferencePage(page.id) ? 'fill-current' : ''} />
                                    </button>
                                )}
                            </div>
                            {/* Reference Badge */}
                            {isReferencePage(page.id) && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-br from-amber-500/90 to-amber-600/90 backdrop-blur-sm rounded text-[10px] font-bold text-black flex items-center gap-1 shadow-lg">
                                    <Star size={10} className="fill-current" />
                                    REF
                                </div>
                            )}
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
                        );
                    })
                )}
            </div>
        </aside>
    );
}

