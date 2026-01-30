'use client'

import { X } from 'lucide-react';
import { MangaSession } from '@/lib/types';

interface ChatHistoryPanelProps {
    currentSession: MangaSession;
    onClose: () => void;
}

export default function ChatHistoryPanel({ currentSession, onClose }: ChatHistoryPanelProps) {
    if (!currentSession.chatHistory || currentSession.chatHistory.length === 0) {
        return null;
    }

    return (
        <div className="absolute right-2 lg:right-4 top-20 w-[calc(100vw-1rem)] sm:w-96 max-h-[600px] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden z-10">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                <h3 className="text-xs font-bold text-zinc-400 uppercase" style={{ fontFamily: 'var(--font-inter)' }}>
                    Chat History
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition-colors">
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
    );
}

