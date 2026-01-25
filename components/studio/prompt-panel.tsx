'use client'

import { useState } from 'react';
import { Sparkles, Zap, X, Wand2 } from 'lucide-react';
import { MangaSession, MangaConfig } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface PromptPanelProps {
    prompt: string;
    currentSession: MangaSession | null;
    loading: boolean;
    error: string | null;
    batchLoading: boolean;
    batchProgress: { current: number; total: number } | null;
    config: MangaConfig;
    onPromptChange: (value: string) => void;
    onGenerate: () => void;
    onBatchGenerate: (count: number) => void;
    onCancelBatch: () => void;
}

export default function PromptPanel({
    prompt,
    currentSession,
    loading,
    error,
    batchLoading,
    batchProgress,
    config,
    onPromptChange,
    onGenerate,
    onBatchGenerate,
    onCancelBatch,
}: PromptPanelProps) {
    const [batchPopoverOpen, setBatchPopoverOpen] = useState(false);
    const hasPages = currentSession && currentSession.pages.length > 0;
    const isAutoContinue = config.autoContinueStory && hasPages;

    const handleBatchSelect = (count: number) => {
        setBatchPopoverOpen(false);
        // Small delay to ensure state updates are processed
        setTimeout(() => {
            onBatchGenerate(count);
        }, 100);
    };

    return (
        <div className="h-1/2 bg-zinc-900 p-4 flex flex-col">
            <div className="flex-1 flex flex-col gap-3">
                {/* Step 3 Header */}
                <div className="flex items-center gap-3 pb-2">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-black font-bold text-sm flex items-center justify-center shrink-0">
                        3
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)' }}>
                            <span>Write Your Prompt</span>
                            {currentSession && currentSession.pages.length > 0 && (
                                <span className="text-[9px] text-zinc-500 font-normal normal-case">(Page {currentSession.pages.length + 1})</span>
                            )}
                            {isAutoContinue && (
                                <span className="text-[9px] text-zinc-400 font-normal normal-case flex items-center gap-1">
                                    <Wand2 size={10} />
                                    Auto-Continue ON
                                </span>
                            )}
                        </label>
                    </div>
                </div>

                {/* Prompt Textarea */}
                <textarea
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder={isAutoContinue
                        ? "Gợi ý hướng phát triển story (optional)... VD: 'The hero discovers a secret', 'A battle begins', 'They meet a new character'..."
                        : hasPages
                            ? "Continue the story with the SAME characters from Context..."
                            : "Describe the scene: A hero standing on a rooftop, looking at the sunset..."}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm leading-relaxed text-zinc-300 placeholder:text-zinc-600 placeholder:text-xs focus:outline-none focus:border-amber-500 transition-colors resize-none custom-scrollbar"
                    style={{ fontFamily: 'var(--font-inter)' }}
                    disabled={batchLoading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            onGenerate();
                        }
                    }}
                />

                {/* Batch Progress */}
                {batchLoading && batchProgress && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-300 font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                <Zap size={14} className="animate-pulse" />
                                {batchProgress.current === 0 ? 'CREATING PAGE 1...' :
                                    batchProgress.current < batchProgress.total ? `CREATING PAGE ${batchProgress.current + 1}...` :
                                        'COMPLETE!'}
                            </span>
                            <span className="text-zinc-400" style={{ fontFamily: 'var(--font-inter)' }}>
                                {batchProgress.current} / {batchProgress.total} pages
                            </span>
                        </div>
                        <div className="relative h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-zinc-600 via-zinc-500 to-zinc-600 transition-all duration-500"
                                style={{
                                    width: `${(batchProgress.current / batchProgress.total) * 100}%`
                                }}
                            />
                        </div>
                        {batchProgress.current >= 1 && batchProgress.current < batchProgress.total && (
                            <div className="text-[9px] text-zinc-400 flex items-center gap-1 leading-relaxed">
                                <Wand2 size={10} className="animate-spin flex-shrink-0" />
                                <span>
                                    <strong>2-Step Process:</strong> ① AI tạo prompt mới từ page {batchProgress.current}
                                    → ② Gen ảnh từ prompt đó
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Generate Buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={onGenerate}
                        disabled={loading || batchLoading || (!prompt.trim() && !isAutoContinue)}
                        className="px-6 py-3 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 disabled:from-zinc-800 disabled:to-zinc-900 disabled:text-zinc-600 text-black font-manga text-base rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_0_rgb(180,83,9)] hover:shadow-[0_4px_0_0_rgb(180,83,9)] active:shadow-[0_1px_0_0_rgb(180,83,9)] disabled:shadow-none active:translate-y-1 disabled:translate-y-0"
                    >
                        {loading ? 'GEN...' : isAutoContinue ? 'CONTINUE' : 'GENERATE'}
                    </button>

                    {batchLoading ? (
                        <button
                            onClick={onCancelBatch}
                            className="px-6 py-3 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_0_rgb(153,27,27)] hover:shadow-[0_4px_0_0_rgb(153,27,27)] active:shadow-[0_1px_0_0_rgb(153,27,27)] active:translate-y-1"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            <X size={16} />
                            CANCEL
                        </button>
                    ) : (
                        <Popover open={batchPopoverOpen} onOpenChange={setBatchPopoverOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    disabled={loading || batchLoading || (!prompt.trim() && !isAutoContinue)}
                                    className="px-6 py-3 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 disabled:from-zinc-800 disabled:to-zinc-900 disabled:text-zinc-600 text-black font-manga text-base rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_0_rgb(180,83,9)] hover:shadow-[0_4px_0_0_rgb(180,83,9)] active:shadow-[0_1px_0_0_rgb(180,83,9)] disabled:shadow-none active:translate-y-1 disabled:translate-y-0"
                                >
                                    <Zap size={16} />
                                    MULTIPLE
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 bg-zinc-900 border-zinc-800 p-2" align="end">
                                <div className="space-y-1">
                                    <button
                                        onClick={() => handleBatchSelect(10)}
                                        className="w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-200 rounded transition-colors text-left"
                                        style={{ fontFamily: 'var(--font-inter)' }}
                                    >
                                        x10 Pages
                                    </button>
                                    <button
                                        onClick={() => handleBatchSelect(15)}
                                        className="w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-200 rounded transition-colors text-left"
                                        style={{ fontFamily: 'var(--font-inter)' }}
                                    >
                                        x15 Pages
                                    </button>
                                    <button
                                        onClick={() => handleBatchSelect(20)}
                                        className="w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-200 rounded transition-colors text-left"
                                        style={{ fontFamily: 'var(--font-inter)' }}
                                    >
                                        x20 Pages
                                    </button>
                                    <button
                                        onClick={() => handleBatchSelect(30)}
                                        className="w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-200 rounded transition-colors text-left"
                                        style={{ fontFamily: 'var(--font-inter)' }}
                                    >
                                        x30 Pages
                                    </button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-2 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-[10px] text-center" style={{ fontFamily: 'var(--font-inter)' }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

