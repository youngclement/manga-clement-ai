"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";

export function AutoContinueSection() {
  const cards = [
    {
      title: "Understands your current page",
      description:
        "Auto-continue looks at the latest pages in your session to understand where the story is right now – characters, poses, camera, and mood.",
      content: (
        <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-zinc-900 to-zinc-800 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/90">
            Session Timeline
          </div>
          <div className="mt-2 space-y-2 text-[11px] text-zinc-200">
            <div className="flex items-center justify-between rounded-md bg-zinc-900/90 px-3 py-2">
              <span className="text-zinc-300">Page 5 – Cliff edge confrontation</span>
              <span className="text-[10px] text-amber-300">Current</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-zinc-900/60 px-3 py-2 text-zinc-400">
              <span>Page 4 – Rooftop chase</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-zinc-900/60 px-3 py-2 text-zinc-400">
              <span>Page 3 – City reveal</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Generates the next beat for you",
      description:
        "Instead of rewriting prompts, the model generates the next scene description and page based on your context and story direction.",
      content: (
        <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-sky-900 to-emerald-800 p-4 text-[11px] text-sky-50">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">
            Auto-Continue Prompt
          </div>
          <div className="space-y-2 rounded-md bg-black/20 p-3">
            <p className="font-semibold text-sky-100">Next page summary</p>
            <p>
              The hero hangs off the crumbling ledge as debris falls into the glowing city below.
              The villain steps closer, silhouetted by neon signs, offering a final deal before
              dropping him.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md bg-black/20 px-3 py-2">
            <span className="text-sky-100">Page 6 – Generated automatically</span>
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-200">
              No manual prompt
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Keeps long‑form flow stable",
      description:
        "Works with batch generation so you can create 10+ pages in one run while characters and pacing stay consistent from start to finish.",
      content: (
        <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-fuchsia-900 to-amber-800 p-4 text-[11px] text-fuchsia-50">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200">
            Batch Auto-Continue
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md bg-black/15 px-3 py-2">
              <span>Pages generated</span>
              <span className="text-xs font-semibold text-amber-200">10</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-black/15 px-3 py-2">
              <span>Character consistency</span>
              <span className="text-xs font-semibold text-emerald-200">Locked</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-black/15 px-3 py-2">
              <span>Story direction</span>
              <span className="truncate text-right text-xs text-amber-100">
                “Rival showdown above the city at night”
              </span>
            </div>
          </div>
          <div className="mt-3 rounded-md bg-black/25 px-3 py-2 text-[10px] text-amber-100">
            Auto-continue stitches every page together so the chapter feels like one continuous
            scene, not a set of disconnected images.
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="mx-auto my-16 max-w-6xl px-4">
      <div className="mb-6 text-center">
        <h2
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80",
            "mb-2"
          )}
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Auto-Continue Story
        </h2>
        <p className="font-manga text-2xl sm:text-3xl md:text-4xl leading-snug text-zinc-50">
          Scroll to see how your manga keeps going by itself.
        </p>
        <p
          className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm md:text-base text-zinc-300"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Auto-continue reads your latest pages, understands the current beat, and generates the
          next one — so you can stay in flow instead of rewriting prompts for every single panel.
        </p>
      </div>

      <StickyScroll content={cards} contentClassName="h-64 w-80" />
    </section>
  );
}

