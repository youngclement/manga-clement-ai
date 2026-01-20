'use client'

import { Sparkles } from 'lucide-react';
import { MangaSession } from '@/lib/types';

interface PromptPanelProps {
    prompt: string;
    currentSession: MangaSession | null;
    loading: boolean;
    error: string | null;
    onPromptChange: (value: string) => void;
    onGenerate: () => void;
}

export default function PromptPanel({
    prompt,
    currentSession,
    loading,
    error,
    onPromptChange,
    onGenerate,
}: PromptPanelProps) {
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
                                <span className="text-[9px] text-green-500 font-normal normal-case">(Page {currentSession.pages.length + 1})</span>
                            )}
                        </label>
                    </div>
                </div>

                {/* Prompt Textarea */}
                <textarea
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder={currentSession && currentSession.pages.length > 0
                        ? "Continue the story with the SAME characters from Context..."
                        : "Describe the scene: A hero standing on a rooftop, looking at the sunset..."}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm leading-relaxed text-zinc-300 placeholder:text-zinc-600 placeholder:text-xs focus:outline-none focus:border-amber-500 transition-colors resize-none custom-scrollbar"
                    style={{ fontFamily: 'var(--font-inter)' }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            onGenerate();
                        }
                    }}
                />

                {/* Generate Button */}
                <button
                    onClick={onGenerate}
                    disabled={loading || !prompt.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 disabled:from-zinc-800 disabled:to-zinc-900 disabled:text-zinc-600 text-black font-manga text-lg rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_0_rgb(180,83,9)] hover:shadow-[0_4px_0_0_rgb(180,83,9)] active:shadow-[0_1px_0_0_rgb(180,83,9)] disabled:shadow-none active:translate-y-1 disabled:translate-y-0"
                >
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
    );
}

