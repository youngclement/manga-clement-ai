'use client'

import { useEffect, useState } from 'react'
import { fetchPublicProjects } from '@/lib/services/storage-service'
import type { MangaProject } from '@/lib/types'
import Link from 'next/link'

export default function CommunityPage() {
  const [projects, setProjects] = useState<MangaProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPublicProjects(60, 0)
        setProjects(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-manga text-amber-400">
              Community
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Khám phá các tập truyện mà cộng đồng đã public từ Manga Studio.
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-zinc-700 text-xs font-semibold text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            Quản lý truyện của bạn
          </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-zinc-400 text-sm">Đang tải community...</div>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 text-zinc-500 text-sm">
          Chưa có tập truyện public nào. Hãy là người đầu tiên public truyện trong trang Profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(project => (
            <Link
              key={`${project.ownerId || 'unknown'}-${project.id}`}
              href={project.ownerId ? `/community/${encodeURIComponent(project.ownerId)}/${encodeURIComponent(project.id)}` : '#'}
              className={project.ownerId ? '' : 'pointer-events-none opacity-60'}
            >
              <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-amber-400/70 hover:shadow-[0_0_35px_rgba(251,191,36,0.25)] transition-all h-full">
                <div className="h-40 bg-zinc-800/80 flex items-center justify-center text-xs text-zinc-500">
                  <span className="opacity-70">
                    {project.pages?.length
                      ? `${project.pages.length} pages`
                      : 'Chưa có ảnh preview'}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  <div className="text-sm font-semibold truncate">
                    {project.title || 'Untitled project'}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">
                    {project.description || 'Không có mô tả'}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Tác giả:{' '}
                    <span className="text-zinc-200">
                      {project.ownerDisplayName || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


