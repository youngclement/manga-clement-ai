'use client'

import { X, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FullscreenModalProps {
    imageUrl: string;
    isFromCanvas: boolean;
    onClose: () => void;
    onAddToProject?: (markForExport: boolean) => void;
}

export default function FullscreenModal({
    imageUrl,
    isFromCanvas,
    onClose,
    onAddToProject,
}: FullscreenModalProps) {
    const router = useRouter();

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-3 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-white transition-all z-10 group"
                title="Close (ESC)"
            >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {isFromCanvas && onAddToProject && (
                <div className="absolute top-4 left-4 flex gap-3 z-10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddToProject(true);
                            onClose();
                        }}
                        className="px-6 py-3 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
                        style={{ fontFamily: 'var(--font-inter)' }}
                    >
                        ✓ ADD TO PDF
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddToProject(true);
                            onClose();
                            router.push('/studio/preview');
                        }}
                        className="px-6 py-3 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
                        style={{ fontFamily: 'var(--font-inter)' }}
                    >
                        <Eye size={16} />
                        PREVIEW PDF
                    </button>
                </div>
            )}

            <img
                src={imageUrl}
                alt="Fullscreen manga"
                className="max-h-[95vh] max-w-[95vw] object-contain rounded-lg shadow-2xl cursor-default"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

