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
import { Switch } from '@/components/ui/switch';
import {
    MangaStyle,
    InkingStyle,
    ScreentoneDensity,
    AspectRatio,
    PanelLayout,
    PanelBorderStyle,
    DialogueDensity,
    Language,
    MangaConfig,
    ReferenceImage,
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
    const [autoContinue, setAutoContinue] = useState(true);

    // Helper to normalize image format (string -> ReferenceImage)
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newImages: ReferenceImage[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            await new Promise((resolve) => {
                reader.onload = (event) => {
                    if (event.target?.result) {
                        newImages.push({
                            url: event.target.result as string,
                            enabled: true, // New images are enabled by default
                        });
                    }
                    resolve(null);
                };
                reader.readAsDataURL(file);
            });
        }

        const currentImages = config.referenceImages || [];
        // Normalize existing images to ReferenceImage format
        const normalizedImages = currentImages.map(img => normalizeImage(img));
        onConfigChange({ ...config, referenceImages: [...normalizedImages, ...newImages] });
        setUploading(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = async (index: number) => {
        const currentImages = config.referenceImages || [];
        const imageToRemove = currentImages[index];
        
        // If image is base64 (stored in MongoDB), delete it
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

    const toggleImageEnabled = (index: number) => {
        const currentImages = config.referenceImages || [];
        const normalizedImages = currentImages.map(img => normalizeImage(img));
        normalizedImages[index].enabled = !normalizedImages[index].enabled;
        onConfigChange({ ...config, referenceImages: normalizedImages });
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
                                <span className="text-[9px] text-zinc-500 font-normal normal-case">(Keep characters consistent!)</span>
                            </label>
                            <textarea
                                value={context}
                                onChange={(e) => {
                                    try {
                                        onContextChange(e.target.value);
                                    } catch (error) {
                                        console.error("Error in context onChange:", error);
                                    }
                                }}
                                placeholder="Describe your characters in detail:&#10;&#10;Main character: Male, 17yo, spiky black hair, blue eyes, wearing red jacket with white shirt...&#10;&#10;Setting: Modern Tokyo, high school..."
                                className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm leading-relaxed text-zinc-300 placeholder:text-zinc-600 placeholder:text-[11px] placeholder:leading-relaxed focus:outline-none focus:border-amber-500 transition-colors resize-none custom-scrollbar"
                                style={{ fontFamily: 'var(--font-inter)' }}
                                maxLength={10000}
                            />
                        </div>

                        {/* Reference Images */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                <ImageIcon size={14} />
                                <span>Reference Images</span>
                                <span className="text-[9px] text-zinc-500 font-normal normal-case">(Optional: Character/Style references)</span>
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
                                <div className="space-y-2">
                                    <p className="text-xs text-zinc-400 mb-2">
                                        Click checkbox to enable/disable. Disabled images won't be used in generation but will be saved.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {config.referenceImages.map((img, idx) => {
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleImageEnabled(idx);
                                                        }}
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeImage(idx);
                                                        }}
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
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                <span>Art Style</span>
                                {(config.style && (config.style.includes('Webtoon') || config.style.includes('Manhwa') || config.style.includes('Digital'))) && (
                                    <span className="text-[9px] text-zinc-500 font-normal normal-case">Modern</span>
                                )}
                            </label>
                            <Select value={config.style} onValueChange={(value) => onConfigChange({ ...config, style: value as MangaStyle })}>
                                <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500 focus:border-amber-500 h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-zinc-800 font-sans max-h-[300px]">
                                    <div className="px-2 py-1 text-[9px] text-zinc-500 uppercase tracking-wider">Traditional Manga</div>
                                    {['Shonen', 'Shoujo', 'Seinen', 'Josei'].map(s => (
                                        <SelectItem key={s} value={s} className="text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer">
                                            {s}
                                        </SelectItem>
                                    ))}
                                    <div className="px-2 py-1 mt-2 text-[9px] text-zinc-500 uppercase tracking-wider">Modern Styles</div>
                                    {['Manhwa 3D', 'Modern Webtoon', 'Korean Manhwa', 'Digital Painting', 'Realistic Manga', 'Semi-Realistic', 'Clean Line Art', 'Cinematic Style'].map(s => (
                                        <SelectItem key={s} value={s} className="text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer">
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
                                    Inking/Render
                                </label>
                                <Select value={config.inking} onValueChange={(value) => onConfigChange({ ...config, inking: value as InkingStyle })}>
                                    <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500 focus:border-amber-500 h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-800 max-h-[300px]">
                                        <div className="px-2 py-1 text-[9px] text-zinc-500 uppercase tracking-wider">Traditional Ink</div>
                                        {['G-Pen', 'Tachikawa Pen', 'Brush Ink', 'Marker'].map(s => (
                                            <SelectItem key={s} value={s} className="text-xs text-zinc-300 hover:bg-amber-500/20 focus:bg-amber-500/20 focus:text-white cursor-pointer">
                                                {s}
                                            </SelectItem>
                                        ))}
                                        <div className="px-2 py-1 mt-2 text-[9px] text-zinc-500 uppercase tracking-wider">Digital Rendering</div>
                                        {['Digital', 'Clean Digital', 'Digital Painting', 'Soft Brush', 'Airbrush', 'Painterly'].map(s => (
                                            <SelectItem key={s} value={s} className="text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer">
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1" style={{ fontFamily: 'var(--font-inter)' }}>
                                    <span>Screentone</span>
                                    {(config.style && (config.style.includes('Webtoon') || config.style.includes('Manhwa') || config.style.includes('Digital'))) && config.screentone !== 'None' && (
                                        <span className="text-[8px] text-zinc-500 font-normal normal-case">None</span>
                                    )}
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
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                <span>Panel Layout</span>
                                <span className="text-[9px] text-zinc-500 font-normal normal-case">(Choose manga page style)</span>
                            </label>
                            <Select value={config.layout} onValueChange={(value) => onConfigChange({ ...config, layout: value as PanelLayout })}>
                                <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500 focus:border-amber-500 h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-zinc-800 font-sans max-h-[300px]">
                                    {Object.values(PanelLayout).map(l => (
                                        <SelectItem key={l} value={l} className="text-xs text-zinc-300 hover:bg-amber-500/20 focus:bg-amber-500/20 focus:text-white cursor-pointer">
                                            {l}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Panel Border Style - Toggle */}
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Panel Border
                                </label>
                                <span className="text-[9px] text-zinc-500 font-normal normal-case">
                                    {(config.panelBorderStyle === PanelBorderStyle.FULL_BORDER || !config.panelBorderStyle)
                                        ? 'Có viền đen' 
                                        : 'Full ảnh không viền trắng'}
                                </span>
                            </div>
                            <Switch
                                checked={config.panelBorderStyle === PanelBorderStyle.FULL_BORDER}
                                onCheckedChange={(checked) => {
                                    onConfigChange({
                                        ...config,
                                        panelBorderStyle: checked ? PanelBorderStyle.FULL_BORDER : PanelBorderStyle.NO_BORDER
                                    });
                                }}
                            />
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
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1" style={{ fontFamily: 'var(--font-inter)' }}>
                                    <span>Color Mode</span>
                                    {(config.style && (config.style.includes('Webtoon') || config.style.includes('Manhwa') || config.style.includes('Digital') || config.style.includes('Cinematic'))) && !config.useColor && (
                                        <span className="text-[8px] text-zinc-500 font-normal normal-case">Try COLOR!</span>
                                    )}
                                </label>
                                <button
                                    onClick={() => onConfigChange({ ...config, useColor: !config.useColor })}
                                    className={`w-full h-[34px] rounded-lg transition-all flex items-center justify-center text-xs font-bold ${config.useColor ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 text-black shadow-[0_2px_0_0_rgb(180,83,9)] hover:from-amber-500 hover:via-orange-600 hover:to-amber-700 hover:shadow-[0_2px_0_0_rgb(180,83,9)] active:shadow-[0_0.5px_0_0_rgb(180,83,9)] active:translate-y-0.5' : 'bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-800 text-zinc-400 shadow-[0_2px_0_0_rgb(24,24,27)] hover:shadow-[0_2px_0_0_rgb(24,24,27)] active:shadow-[0_0.5px_0_0_rgb(24,24,27)] active:translate-y-0.5'}`}
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                >
                                    {config.useColor ? 'COLOR' : 'B&W'}
                                </button>
                            </div>
                        </div>

                        {/* Auto-Continue Story */}
                        <div className="space-y-2 pt-2 border-t border-zinc-800">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                        <span>Auto-Continue Story</span>
                                    </label>
                                    <p className="text-[9px] text-zinc-500 mt-1 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                                        AI tự động tiếp tục câu chuyện từ page trước (không cần viết prompt mới)
                                    </p>
                                </div>
                                <button
                                    onClick={() => onConfigChange({ ...config, autoContinueStory: !config.autoContinueStory })}
                                    className={`ml-3 relative w-14 h-7 rounded-full transition-all ${config.autoContinueStory ? 'bg-zinc-600' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${config.autoContinueStory ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            
                            {/* Story Direction/Flow */}
                            {config.autoContinueStory && (
                                <div className="space-y-2 mt-3">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                        <span>Story Flow Direction</span>
                                        <span className="text-[9px] text-zinc-500 font-normal normal-case">(Optional: Guide auto-continue flow)</span>
                                    </label>
                                    <textarea
                                        value={config.storyDirection || ''}
                                        onChange={(e) => {
                                            try {
                                                onConfigChange({ ...config, storyDirection: e.target.value });
                                            } catch (error) {
                                                console.error("Error in storyDirection onChange:", error);
                                            }
                                        }}
                                        placeholder="Mô tả hướng phát triển của câu chuyện khi auto-continue:&#10;&#10;Ví dụ:&#10;- Hero đang trên đường tìm kiếm sức mạnh cổ xưa&#10;- Cuộc chiến với quái vật sẽ diễn ra ở thành phố cổ&#10;- Tình cảm giữa nhân vật chính và nữ chính sẽ phát triển dần..."
                                        className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm leading-relaxed text-zinc-300 placeholder:text-zinc-600 placeholder:text-[11px] placeholder:leading-relaxed focus:outline-none focus:border-amber-500 transition-colors resize-y custom-scrollbar"
                                        style={{ fontFamily: 'var(--font-inter)', minHeight: '120px', maxHeight: '400px' }}
                                        maxLength={10000}
                                    />
                                </div>
                            )}
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

