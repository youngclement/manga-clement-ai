'use client'

import { Maximize2, Trash2 } from 'lucide-react';

import { GenerationProgress } from '@/components/ui/generation-progress';

interface CanvasAreaProps {
    loading: boolean;
    generationProgress?: number;
    retryCount?: number;
    currentImage: string | null;
    onShowFullscreen: () => void;
    onAddToProject: (markForExport: boolean) => void;
    onDiscardImage: () => void;
}

export default function CanvasArea({
    loading,
    generationProgress = 0,
    retryCount = 0,
    currentImage,
    onShowFullscreen,
    onAddToProject,
    onDiscardImage,
}: CanvasAreaProps) {
    return (
        <main className="flex-1 bg-zinc-950 flex items-center justify-center p-3 sm:p-4 lg:p-6 xl:p-8 pb-20 sm:pb-24 lg:pb-8 overflow-hidden relative">
            {loading && (
                <div className="flex flex-col items-center gap-5 sm:gap-6 w-full max-w-md px-4">
                    <div className="w-48 h-64 sm:w-64 sm:h-80 bg-zinc-900/60 rounded-2xl shadow-2xl shadow-black/50 relative overflow-hidden border border-zinc-800/50 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent"></div>
                    </div>
                    <div className="text-amber-400 font-manga text-base sm:text-xl tracking-wider animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                        GENERATING...
                    </div>
                    <GenerationProgress 
                        progress={generationProgress}
                        retryCount={retryCount}
                        className="w-full"
                    />
                </div>
            )}

            {!currentImage && !loading && (
                <div className="text-center space-y-5 sm:space-y-6 opacity-40 max-w-2xl px-4">
                    <p className="font-manga text-4xl sm:text-5xl lg:text-6xl text-zinc-700 drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        CANVAS
                    </p>
                    <p className="text-sm sm:text-base lg:text-lg text-zinc-500 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                        Describe your story moment to generate manga
                    </p>
                </div>
            )}

            {currentImage && !loading && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500">
                    <div className="relative max-h-[95%] max-w-[95%] group">
                        <img
                            src={currentImage}
                            className="rounded-2xl shadow-2xl shadow-black/50 max-h-full max-w-full object-contain border border-zinc-800/60 cursor-pointer hover:border-amber-500/60 transition-all hover:shadow-amber-500/20"
                            onClick={onShowFullscreen}
                            title="Click to view fullscreen"
                        />
                        {/* Floating Action Buttons - Always visible on mobile, hover on desktop */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 flex-wrap justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                            <button
                                onClick={onShowFullscreen}
                                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 active:translate-y-0.5 ring-2 ring-transparent hover:ring-blue-500/30 touch-manipulation min-h-[44px]"
                                style={{ fontFamily: 'var(--font-inter)' }}
                            >
                                <Maximize2 size={14} className="sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">FULLSCREEN</span>
                                <span className="sm:hidden">VIEW</span>
                            </button>
                            <button
                                onClick={() => onAddToProject(true)}
                                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 active:translate-y-0.5 ring-2 ring-transparent hover:ring-emerald-500/30 touch-manipulation min-h-[44px]"
                                style={{ fontFamily: 'var(--font-inter)' }}
                            >
                                <span className="hidden sm:inline">✓ ADD TO PDF</span>
                                <span className="sm:hidden">✓ ADD</span>
                            </button>
                            <button
                                onClick={onDiscardImage}
                                className="p-2.5 sm:p-3 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105 active:scale-95 active:translate-y-0.5 ring-2 ring-transparent hover:ring-red-500/30 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                                <Trash2 size={14} className="sm:w-3.5 sm:h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

