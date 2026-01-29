'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchPublicProjects, type FetchPublicProjectsOptions } from '@/lib/services/storage-service'
import { fetchTrendingProjects } from '@/lib/services/community-service'
import type { MangaProject } from '@/lib/types'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Search, TrendingUp, Heart, Eye, MessageCircle, Clock, X } from 'lucide-react'

type SortOption = 'newest' | 'oldest' | 'mostLiked' | 'mostViewed' | 'mostCommented' | 'trending'

export default function CommunityPage() {
  const [projects, setProjects] = useState<MangaProject[]>([])
  const [trendingProjects, setTrendingProjects] = useState<MangaProject[]>([])
  const [loading, setLoading] = useState(true)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const limit = 18

  const loadProjects = useCallback(async (reset: boolean = false) => {
    const currentPage = reset ? 0 : page
    setLoading(true)
    
    try {
      const options: FetchPublicProjectsOptions = {
        limit,
        offset: currentPage * limit,
        search: searchQuery || undefined,
        sortBy: sortBy === 'newest' ? undefined : sortBy,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      }
      
      const result = await fetchPublicProjects(options)
      
      if (reset) {
        setProjects(result.projects)
        setPage(0)
      } else {
        setProjects(prev => [...prev, ...result.projects])
      }
      
      setTotal(result.total)
      setHasMore((currentPage + 1) * limit < result.total)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, sortBy, selectedTags, page, limit])

  useEffect(() => {
    loadProjects(true)
  }, [searchQuery, sortBy, selectedTags])

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const trending = await fetchTrendingProjects(6)
        setTrendingProjects(trending)
      } catch (error) {
        console.error('Failed to load trending:', error)
      } finally {
        setTrendingLoading(false)
      }
    }
    loadTrending()
  }, [])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
      loadProjects(false)
    }
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // Extract all unique tags from projects
  const allTags = Array.from(
    new Set(projects.flatMap(p => p.tags || []))
  ).slice(0, 10)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
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

      {/* Trending Section */}
      {!trendingLoading && trendingProjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-zinc-200">Đang thịnh hành</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {trendingProjects.map(project => (
              <Link
                key={`trending-${project.ownerId}-${project.id}`}
                href={`/community/${encodeURIComponent(project.ownerId!)}/${encodeURIComponent(project.id)}`}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-amber-400/70 transition-all"
              >
                <div className="h-24 bg-zinc-800/80 flex items-center justify-center">
                  {project.coverImageUrl ? (
                    <img
                      src={project.coverImageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : project.pages?.[0]?.url ? (
                    <img
                      src={project.pages[0].url}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-zinc-500">No preview</span>
                  )}
                </div>
                <div className="px-2 py-2">
                  <div className="text-xs font-semibold truncate mb-1">
                    {project.title || 'Untitled'}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {project.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" />
                      {project.likeCount || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Tìm kiếm truyện..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-950 border-zinc-700 text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="mostLiked">Nhiều like nhất</option>
            <option value="mostViewed">Nhiều lượt xem nhất</option>
            <option value="mostCommented">Nhiều bình luận nhất</option>
            <option value="trending">Đang thịnh hành</option>
          </select>
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400">Tags:</span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-amber-500 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="text-sm text-zinc-400">
          Tìm thấy {total} {total === 1 ? 'truyện' : 'truyện'}
        </div>
      )}

      {/* Projects Grid */}
      {loading && projects.length === 0 ? (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-zinc-400 text-sm">Đang tải community...</div>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 text-zinc-500 text-sm">
          {searchQuery || selectedTags.length > 0
            ? 'Không tìm thấy truyện nào phù hợp với bộ lọc của bạn.'
            : 'Chưa có tập truyện public nào. Hãy là người đầu tiên public truyện trong trang Profile.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(project => (
              <Link
                key={`${project.ownerId || 'unknown'}-${project.id}`}
                href={project.ownerId ? `/community/${encodeURIComponent(project.ownerId)}/${encodeURIComponent(project.id)}` : '#'}
                className={project.ownerId ? '' : 'pointer-events-none opacity-60'}
              >
                <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-amber-400/70 hover:shadow-[0_0_35px_rgba(251,191,36,0.25)] transition-all h-full flex flex-col">
                  <div className="h-40 bg-zinc-800/80 flex items-center justify-center relative overflow-hidden">
                    {project.coverImageUrl ? (
                      <img
                        src={project.coverImageUrl}
                        alt={project.title || 'Manga cover'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : project.pages?.[0]?.url ? (
                      <img
                        src={project.pages[0].url}
                        alt={project.title || 'Manga cover'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-xs text-zinc-500 opacity-70">
                        {project.pages?.length ? `${project.pages.length} pages` : 'Chưa có ảnh preview'}
                      </span>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {project.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-amber-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 space-y-2 flex-1 flex flex-col">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold truncate">
                        {project.title || 'Untitled project'}
                      </div>
                      <div className="text-xs text-zinc-500 line-clamp-2">
                        {project.description || 'Không có mô tả'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-auto pt-2">
                      <div>
                        Tác giả:{' '}
                        <span className="text-zinc-200">
                          {project.ownerDisplayName || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {project.viewCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {project.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {project.commentCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Đang tải...' : 'Tải thêm'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
