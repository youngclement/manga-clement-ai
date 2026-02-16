'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { fetchPublicProjects, type FetchPublicProjectsOptions } from '@/lib/services/storage-service'
import { fetchTrendingProjects } from '@/lib/services/community-service'
import type { MangaProject } from '@/lib/types'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Search, TrendingUp, Heart, Eye, MessageCircle, X } from 'lucide-react'

type SortOption = 'newest' | 'oldest' | 'mostLiked' | 'mostViewed' | 'mostCommented' | 'trending'

const ITEMS_PER_PAGE = 18
const TRENDING_LIMIT = 6
const MAX_VISIBLE_TAGS = 10

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'mostLiked', label: 'Most liked' },
  { value: 'mostViewed', label: 'Most viewed' },
  { value: 'mostCommented', label: 'Most comments' },
  { value: 'trending', label: 'Trending' },
]

// Helper functions
const getCoverImage = (project: MangaProject): string | undefined =>
  project.coverImageUrl || project.pages?.[0]?.url || project.sessions?.[0]?.pages?.[0]?.url

const getPageCount = (project: MangaProject): number =>
  (project.pages?.length || 0) +
  (project.sessions?.reduce((sum, s) => sum + (s.pages?.length || 0), 0) || 0)

const getProjectUrl = (project: MangaProject): string =>
  project.ownerId
    ? `/community/${encodeURIComponent(project.ownerId)}/${encodeURIComponent(project.id)}`
    : '#'

// Sub-components
function LoadingSpinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-zinc-400 text-sm">Loading community...</div>
      </div>
    </div>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-24 text-zinc-500 text-sm">
      {hasFilters
        ? 'No stories found matching your filters.'
        : 'No public stories yet. Be the first to share your story from the Profile page.'}
    </div>
  )
}

function ProjectStats({ views, likes, comments }: { views: number; likes: number; comments?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1">
        <Eye className="h-3 w-3" />
        {views}
      </span>
      <span className="flex items-center gap-1">
        <Heart className="h-3 w-3" />
        {likes}
      </span>
      {comments !== undefined && (
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          {comments}
        </span>
      )}
    </div>
  )
}

function TrendingCard({ project }: { project: MangaProject }) {
  const coverImg = getCoverImage(project)

  return (
    <Link
      href={getProjectUrl(project)}
      className="group rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-amber-400/70 transition-all"
    >
      <div className="h-24 bg-zinc-800/80 flex items-center justify-center overflow-hidden">
        {coverImg ? (
          <img
            src={coverImg}
            alt={project.title || 'Manga cover'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <span className="text-[10px] text-zinc-500">No preview</span>
        )}
      </div>
      <div className="px-2 py-2">
        <div className="text-xs font-semibold truncate mb-1">
          {project.title || 'Untitled'}
        </div>
        <div className="text-[10px] text-zinc-500">
          <ProjectStats views={project.viewCount || 0} likes={project.likeCount || 0} />
        </div>
      </div>
    </Link>
  )
}

function ProjectCard({ project }: { project: MangaProject }) {
  const coverImg = getCoverImage(project)
  const pageCount = getPageCount(project)
  const hasOwner = Boolean(project.ownerId)

  return (
    <Link
      href={getProjectUrl(project)}
      className={hasOwner ? '' : 'pointer-events-none opacity-60'}
    >
      <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-amber-400/70 hover:shadow-[0_0_35px_rgba(251,191,36,0.25)] transition-all h-full flex flex-col">
        <div className="h-40 bg-zinc-800/80 flex items-center justify-center relative overflow-hidden">
          {coverImg ? (
            <img
              src={coverImg}
              alt={project.title || 'Manga cover'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <span className="text-xs text-zinc-500 opacity-70">
              {pageCount > 0 ? `${pageCount} pages` : 'No preview'}
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
              {project.description || 'No description'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-auto pt-2">
            <div>
              Author: <span className="text-zinc-200">{project.ownerDisplayName || 'Unknown'}</span>
            </div>
            <ProjectStats
              views={project.viewCount || 0}
              likes={project.likeCount || 0}
              comments={project.commentCount || 0}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

function TagFilter({
  tags,
  selectedTags,
  onToggle,
  onClear,
}: {
  tags: string[]
  selectedTags: string[]
  onToggle: (tag: string) => void
  onClear: () => void
}) {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-zinc-400">Tags:</span>
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
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
          onClick={onClear}
          className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  )
}

// Main component
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

  const loadProjects = useCallback(async (currentPage: number, reset: boolean) => {
    setLoading(true)

    try {
      const options: FetchPublicProjectsOptions = {
        limit: ITEMS_PER_PAGE,
        offset: currentPage * ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        sortBy: sortBy === 'newest' ? undefined : sortBy,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      }

      const result = await fetchPublicProjects(options)

      setProjects(prev => reset ? result.projects : [...prev, ...result.projects])
      setTotal(result.total)
      setHasMore((currentPage + 1) * ITEMS_PER_PAGE < result.total)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, sortBy, selectedTags])

  // Load projects on filter change
  useEffect(() => {
    setPage(0)
    loadProjects(0, true)
  }, [searchQuery, sortBy, selectedTags, loadProjects])

  // Load trending projects on mount
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const trending = await fetchTrendingProjects(TRENDING_LIMIT)
        setTrendingProjects(trending)
      } catch (error) {
        console.error('Failed to load trending projects:', error)
      } finally {
        setTrendingLoading(false)
      }
    }
    loadTrending()
  }, [])

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadProjects(nextPage, false)
    }
  }, [loading, hasMore, page, loadProjects])

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }, [])

  const handleClearTags = useCallback(() => setSelectedTags([]), [])

  const allTags = useMemo(
    () => Array.from(new Set(projects.flatMap(p => p.tags || []))).slice(0, MAX_VISIBLE_TAGS),
    [projects]
  )

  const hasFilters = Boolean(searchQuery || selectedTags.length > 0)
  const showTrending = !trendingLoading && trendingProjects.length > 0
  const isInitialLoading = loading && projects.length === 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-manga text-amber-400">Community</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Explore manga stories shared by the community from Manga Studio.
          </p>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-zinc-700 text-xs font-semibold text-zinc-200 hover:bg-zinc-800/60 transition-colors"
        >
          Manage your stories
        </Link>
      </div>

      {/* Trending Section */}
      {showTrending && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-zinc-200">Trending</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {trendingProjects.map(project => (
              <TrendingCard key={`trending-${project.ownerId}-${project.id}`} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search stories..."
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
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <TagFilter
          tags={allTags}
          selectedTags={selectedTags}
          onToggle={handleTagToggle}
          onClear={handleClearTags}
        />
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="text-sm text-zinc-400">
          Found {total} {total === 1 ? 'story' : 'stories'}
        </div>
      )}

      {/* Content */}
      {isInitialLoading ? (
        <LoadingSpinner />
      ) : projects.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(project => (
              <ProjectCard key={`${project.ownerId || 'unknown'}-${project.id}`} project={project} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
