"use client";

import React from "react";
import { cn } from "@/lib/utils";

type RecentCreation = {
  id: string;
  title: string;
  author: string;
  image: string;
};

const MOCK_RECENT: RecentCreation[] = [
  {
    id: "1",
    title: "Neon Skyline Duel",
    author: "@akira",
    image: "/demo-img/demoimg1.png",
  },
  {
    id: "2",
    title: "Last Train to Shibuya",
    author: "@hana",
    image: "/demo-img/demoimg2.png",
  },
  {
    id: "3",
    title: "Echoes of the Rooftop",
    author: "@kaito",
    image: "/demo-img/demoimg3.png",
  },
  {
    id: "4",
    title: "Midnight Alley Pact",
    author: "@yui",
    image: "/demo-img/demoimg4.png",
  },
];

export function RecentCreationsSection() {
  return (
    <section className="mx-auto my-16 max-w-6xl px-4">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80",
              "mb-2"
            )}
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Recent Manga Created
          </h2>
          <p className="font-manga text-2xl sm:text-3xl text-zinc-50">
            See what creators are making with Manga Studio.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_RECENT.map((item) => (
          <article
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/60 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            </div>
            <div className="flex flex-col gap-1 px-3 py-3">
              <h3
                className="truncate text-sm font-semibold text-zinc-50"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {item.title}
              </h3>
              <p
                className="text-xs text-zinc-400"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                by <span className="text-zinc-200">{item.author}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}


