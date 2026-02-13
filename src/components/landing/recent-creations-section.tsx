"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { fetchPublicProjects } from "@/lib/services/storage-service";
import type { MangaProject } from "@/lib/types";
import { MessageCircle, Eye, Heart } from "lucide-react";

export function RecentCreationsSection() {
  const [projects, setProjects] = useState<MangaProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { projects: data } = await fetchPublicProjects({
          limit: 4,
          sortBy: 'mostCommented',
        });
        setProjects(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getCover = (project: MangaProject) => {
    return project.coverImageUrl || 
           project.pages?.[0]?.url || 
           project.sessions?.[0]?.pages?.[0]?.url ||
           "/demo-img/demoimg1.png";
  };

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
            Most Discussed
          </h2>
          <p className="font-manga text-2xl sm:text-3xl text-zinc-50">
            Stories sparking conversations in the community.
          </p>
        </div>
        <Link 
          href="/community" 
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
        >
          View All →
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-zinc-800" />
              <div className="px-3 py-3 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          No stories available yet. Be the first to create one!
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/community/${encodeURIComponent(project.ownerId!)}/${encodeURIComponent(project.id)}`}
              className="group"
            >
              <article className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/60 shadow-[0_16px_40px_rgba(0,0,0,0.6)] hover:border-amber-400/50 transition-all">
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <img
                    src={getCover(project)}
                    alt={project.title || "Manga cover"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-300">
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded">
                        <MessageCircle size={10} className="text-amber-400" />
                        {project.commentCount || 0}
                      </span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded">
                        <Eye size={10} />
                        {project.viewCount || 0}
                      </span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded">
                        <Heart size={10} />
                        {project.likeCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 px-3 py-3">
                  <h3
                    className="truncate text-sm font-semibold text-zinc-50 group-hover:text-amber-400 transition-colors"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {project.title || "Untitled"}
                  </h3>
                  <p
                    className="text-xs text-zinc-400"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    by <span className="text-zinc-200">{project.ownerDisplayName || "Unknown"}</span>
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
