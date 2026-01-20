'use client'

import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    MangaStyle,
    InkingStyle,
    ScreentoneDensity,
    AspectRatio,
    PanelLayout,
    DialogueDensity,
    Language,
    MangaConfig,
} from '@/lib/types';

interface StorySettingsPanelProps {
    context: string;
    config: MangaConfig;
    onContextChange: (context: string) => void;
    onConfigChange: (config: MangaConfig) => void;
}

export default function StorySettingsPanel({
    context,
    config,
    onContextChange,
    onConfigChange,
}: StorySettingsPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newImages: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            await new Promise((resolve) => {
                reader.onload = (event) => {
                    if (event.target?.result) {
                        newImages.push(event.target.result as string);
                    }
                    resolve(null);
                };
                reader.readAsDataURL(file);
            });
        }

        const currentImages = config.referenceImages || [];
        onConfigChange({ ...config, referenceImages: [...currentImages, ...newImages] });
        setUploading(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        const currentImages = config.referenceImages || [];
        const newImages = currentImages.filter((_, i) => i !== index);
        onConfigChange({ ...config, referenceImages: newImages });
    };

    return (
        <div className="h-full bg-zinc-900 overflow-y-auto custom-scrollbar">
            {/* Step 1: Story Settings */}
            <div className="border-b border-zinc-800">
                <div className="p-4 pb-3 bg-zinc-950/30">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-7 h-7 rounded-full bg-amber-500 text-black font-bold text-sm flex items-center justify-center">
                            1
                        </div>
                        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                            Story Settings
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {/* Context Text */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                <span>Context</span>
                                <span className="text-[9px] text-amber-500 font-normal normal-case">(Keep characters consistent!)</span>
                            </label>
                            <textarea
                                value={context}
                                onChange={(e) => onContextChange(e.target.value)}
                                placeholder="📝 Describe your characters in detail:&#10;&#10;Main character: Male, 17yo, spiky black hair, blue eyes, wearing red jacket with white shirt...&#10;&#10;Setting: Modern Tokyo, high school..."
                                className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm leading-relaxed text-zinc-300 placeholder:text-zinc-600 placeholder:text-[11px] placeholder:leading-relaxed focus:outline-none focus:border-amber-500 transition-colors resize-none custom-scrollbar"
                                style={{ fontFamily: 'var(--font-inter)' }}
                            />
                        </div>

                        {/* Reference Images */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                <ImageIcon size={14} />
                                <span>Reference Images</span>
                                <span className="text-[9px] text-amber-500 font-normal normal-case">(Optional: Character/Style references)</span>
                            </label>

                            {/* Upload Button */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-amber-500 transition-colors flex items-center justify-center gap-2 text-zinc-400 hover:text-amber-500 text-sm"
                            >
                                <Upload size={16} />
                                {uploading ? 'Uploading...' : 'Upload Reference Images'}
                            </button>

                            {/* Display uploaded images */}
                            {config.referenceImages && config.referenceImages.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {config.referenceImages.map((img, idx) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={img}
                                                alt={`Reference ${idx + 1}`}
                                                className="w-full h-20 object-cover rounded border border-zinc-800"
                                            />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} className="text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 2: Generation Options */}
            <div>
                <div className="p-4 bg-zinc-950/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-7 h-7 rounded-full bg-amber-500 text-black font-bold text-sm flex items-center justify-center">
                            2
                        </div>
                        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                            Generation Options
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Style */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                                Manga Style
                            </label>
                            <Select value={config.style} onValueChange={(value) => onConfigChange({ ...config, style: value as MangaStyle })}>
                                <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500 focus:border-amber-500 h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-zinc-800 font-sans">
                                    {Object.values(MangaStyle).map(s => (
                                        <SelectItem key={s} value={s} className="text-xs text-zinc-300 hover:bg-amber-500/20 focus:bg-amber-500/20 focus:text-white cursor-pointer">
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Inking & Screentone */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Pen Style
                                </label>
                                <Select value={config.inking} onValueChange={(value) => onConfigChange({ ...config, inking: value as InkingStyle })}>
                                    <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500 focus:border-amber-500 h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-800">
                                        {Object.values(InkingStyle).map(s => (
                                            <SelectItem key={s} value={s} className="text-xs text-zinc-300 hover:bg-amber-500/20 focus:bg-amber-500/20 focus:text-white cursor-pointer">
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Screentone
                                </label>
                                <Select value={config.screentone} onValueChange={(value) => onConfigChange({ ...config, screentone: value as ScreentoneDensity })}>
                                    <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500 focus:border-amber-500 h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-800">
                                        {Object.values(ScreentoneDensity).map(s => (
                                            <SelectItem key={s} value={s} className="text-xs text-zinc-300 hover:bg-amber-500/20 focus:bg-amber-500/20 focus:text-white cursor-pointer">
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Layout */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                                Panel Layout
                            </label>
                            <Select value={config.layout} onValueChange={(value) => onConfigChange({ ...config, layout: value as PanelLayout })}>
                                <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500 focus:border-amber-500 h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-zinc-800 font-sans">
                                    {Object.values(PanelLayout).map(l => (
                                        <SelectItem key={l} value={l} className="text-xs text-zinc-300 hover:bg-amber-500/20 focus:bg-amber-500/20 focus:text-white cursor-pointer">
                                            {l}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dialogue & Language */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Dialogue
                                </label>
                                <Select value={config.dialogueDensity} onValueChange={(value) => onConfigChange({ ...config, dialogueDensity: value as DialogueDensity })}>
                                    <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500 focus:border-amber-500 h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-800">
                                        {Object.values(DialogueDensity).map(d => (
                                            <SelectItem key={d} value={d} className="text-xs text-zinc-300 hover:bg-amber-500/20 focus:bg-amber-500/20 focus:text-white cursor-pointer">
                                                {d}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Language
                                </label>
                                <Select value={config.language} onValueChange={(value) => onConfigChange({ ...config, language: value as Language })}>
                                    <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500 focus:border-amber-500 h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-800">
                                        {Object.values(Language).map(l => (
                                            <SelectItem key={l} value={l} className="text-xs text-zinc-300 hover:bg-amber-500/20 focus:bg-amber-500/20 focus:text-white cursor-pointer">
                                                {l}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Aspect Ratio & Color */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Aspect Ratio
                                </label>
                                <Select value={config.aspectRatio} onValueChange={(value) => onConfigChange({ ...config, aspectRatio: value as AspectRatio })}>
                                    <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500 focus:border-amber-500 h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-800">
                                        {Object.values(AspectRatio).map(r => (
                                            <SelectItem key={r} value={r} className="text-xs text-zinc-300 hover:bg-amber-500/20 focus:bg-amber-500/20 focus:text-white cursor-pointer">
                                                {r}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Color Mode
                                </label>
                                <button
                                    onClick={() => onConfigChange({ ...config, useColor: !config.useColor })}
                                    className={`w-full h-[34px] rounded-lg transition-all flex items-center justify-center text-xs font-bold ${config.useColor ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-[0_2px_0_0_rgb(168,85,247)] hover:shadow-[0_2px_0_0_rgb(168,85,247)] active:shadow-[0_0.5px_0_0_rgb(168,85,247)] active:translate-y-0.5 animate-gradient' : 'bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-800 text-zinc-400 shadow-[0_2px_0_0_rgb(24,24,27)] hover:shadow-[0_2px_0_0_rgb(24,24,27)] active:shadow-[0_0.5px_0_0_rgb(24,24,27)] active:translate-y-0.5'}`}
                                    style={{
                                        fontFamily: 'var(--font-inter)',
                                        ...(config.useColor ? { backgroundImage: 'linear-gradient(to right, #ec4899, #a855f7, #3b82f6, #06b6d4)' } : {})
                                    }}
                                >
                                    {config.useColor ? 'COLOR' : 'B&W'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
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
      `}</style>
        </div>
    );
}

