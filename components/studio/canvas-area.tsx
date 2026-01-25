'use client'

import { Maximize2, Trash2 } from 'lucide-react';

interface CanvasAreaProps {
    loading: boolean;
    currentImage: string | null;
    onShowFullscreen: () => void;
    onAddToProject: (markForExport: boolean) => void;
    onDiscardImage: () => void;
}

export default function CanvasArea({
    loading,
    currentImage,
    onShowFullscreen,
    onAddToProject,
    onDiscardImage,
}: CanvasAreaProps) {
    return (
        <main className="flex-1 bg-zinc-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 overflow-hidden relative">
            {loading && (
                <div className="flex flex-col items-center gap-4 sm:gap-6">
                    <div className="w-48 h-64 sm:w-64 sm:h-80 bg-zinc-800 rounded-lg shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="text-amber-500 font-manga text-base sm:text-xl tracking-wider animate-pulse">GENERATING...</div>
                </div>
            )}

            {!currentImage && !loading && (
                <div className="text-center space-y-4 sm:space-y-6 opacity-30 max-w-2xl px-4">
                    <p className="font-manga text-3xl sm:text-4xl lg:text-5xl text-zinc-600">CANVAS</p>
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
                            className="rounded-xl shadow-2xl max-h-full max-w-full object-contain border border-zinc-800 cursor-pointer hover:border-amber-500 transition-all"
                            onClick={onShowFullscreen}
                            title="Click to view fullscreen"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center p-4 sm:p-6">
                            <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
                                <button
                                    onClick={onShowFullscreen}
                                    className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white rounded-lg font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-all shadow-[0_3px_0_0_rgb(29,78,216)] hover:shadow-[0_3px_0_0_rgb(29,78,216)] active:shadow-[0_1px_0_0_rgb(29,78,216)] active:translate-y-1"
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                >
                                    <Maximize2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                    <span className="hidden sm:inline">FULLSCREEN</span>
                                    <span className="sm:hidden">VIEW</span>
                                </button>
                                <button
                                    onClick={() => onAddToProject(true)}
                                    className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-lg font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-all shadow-[0_3px_0_0_rgb(5,150,105)] hover:shadow-[0_3px_0_0_rgb(5,150,105)] active:shadow-[0_1px_0_0_rgb(5,150,105)] active:translate-y-1"
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                >
                                    <span className="hidden sm:inline">✓ ADD TO PDF</span>
                                    <span className="sm:hidden">✓ ADD</span>
                                </button>
                                <button
                                    onClick={onDiscardImage}
                                    className="p-2 sm:p-2.5 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg transition-all shadow-[0_3px_0_0_rgb(153,27,27)] hover:shadow-[0_3px_0_0_rgb(153,27,27)] active:shadow-[0_1px_0_0_rgb(153,27,27)] active:translate-y-1"
                                >
                                    <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

