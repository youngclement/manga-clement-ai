"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

interface VideoDemoSectionProps {
  youtubeId?: string;
  title?: string;
  subtitle?: string;
}

export function VideoDemoSection({
  youtubeId = "dQw4w9WgXcQ",
  title = "See Manga Studio in Action",
  subtitle = "Watch how easy it is to create stunning manga pages with AI in just minutes.",
}: VideoDemoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  return (
    <section className="relative py-16 lg:py-24 max-w-6xl mx-auto px-4">
      <div className="text-center mb-10">
        <h2
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80",
            "mb-3"
          )}
        >
          Video Demo
        </h2>
        <h3 className="font-manga text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-4">
          {title}
        </h3>
        <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      <div className="relative group rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="relative aspect-video bg-zinc-900">
          {isPlaying ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title="Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="group/btn relative"
                  aria-label="Play video"
                >
                  <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-150 group-hover/btn:bg-amber-500/30 transition-all" />
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500 flex items-center justify-center shadow-2xl hover:bg-amber-400 hover:scale-110 transition-all">
                    <Play size={32} className="text-black ml-1" fill="currentColor" />
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-sm" />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-6 text-center">
        <div className="px-6">
          <div className="text-2xl sm:text-3xl font-manga text-amber-400">10s</div>
          <div className="text-xs text-zinc-500 mt-1">Per Page</div>
        </div>
        <div className="w-px h-12 bg-zinc-800 hidden sm:block" />
        <div className="px-6">
          <div className="text-2xl sm:text-3xl font-manga text-amber-400">AI</div>
          <div className="text-xs text-zinc-500 mt-1">Powered</div>
        </div>
        <div className="w-px h-12 bg-zinc-800 hidden sm:block" />
        <div className="px-6">
          <div className="text-2xl sm:text-3xl font-manga text-amber-400">PDF</div>
          <div className="text-xs text-zinc-500 mt-1">Export</div>
        </div>
      </div>
    </section>
  );
}
