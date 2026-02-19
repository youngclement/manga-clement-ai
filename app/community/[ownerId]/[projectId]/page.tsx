'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { MangaProject, ProjectComment } from '@/lib/types'
import { fetchPublicProjectDetail } from '@/lib/services/storage-service'
import { fetchLikes, toggleLike, fetchComments, addComment, fetchRelatedProjects } from '@/lib/services/community-service'
import { Heart, MessageCircle, Eye, TrendingUp, BookOpen, Layers, ChevronUp, ChevronDown, X, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react'
import Link from 'next/link'

type ViewMode = 'info' | 'read'

export default function CommunityProjectDetailPage() {
  const params = useParams<{ ownerId: string; projectId: string }>()
  const router = useRouter()
  const [project, setProject] = useState<MangaProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [likeTotal, setLikeTotal] = useState(0)
  const [likedByUser, setLikedByUser] = useState(false)
  const [comments, setComments] = useState<ProjectComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [relatedProjects, setRelatedProjects] = useState<MangaProject[]>([])
  
  const [viewMode, setViewMode] = useState<ViewMode>('info')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [showSessionList, setShowSessionList] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const readerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const load = async () => {
      if (!params?.ownerId || !params?.projectId) {
        setLoading(false)
        return
      }
      try {
        const [projectData, likesData, commentsData, relatedData] = await Promise.all([
          fetchPublicProjectDetail(params.ownerId, params.projectId, true),
          fetchLikes(params.ownerId, params.projectId),
          fetchComments(params.ownerId, params.projectId),
          fetchRelatedProjects(params.ownerId, params.projectId, 6),
        ])
        setProject(projectData)
        setLikeTotal(likesData.total)
        setLikedByUser(likesData.likedByUser)
        setComments(commentsData)
        setRelatedProjects(relatedData)
        if (projectData?.likeCount !== undefined) {
          setLikeTotal(projectData.likeCount)
        }
        if (projectData?.sessions?.length) {
          const firstSessionWithPages = projectData.sessions.find(s => s.pages?.length > 0)
          if (firstSessionWithPages) {
            setSelectedSessionId(firstSessionWithPages.id)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params?.ownerId, params?.projectId])

  const currentSession = project?.sessions?.find(s => s.id === selectedSessionId) || null
  const currentPages = currentSession?.pages || project?.pages || []

  const scrollToPage = (index: number) => {
    if (pageRefs.current[index]) {
      pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setCurrentPageIndex(index)
    }
  }

  useEffect(() => {
    if (viewMode !== 'read') return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        scrollToPage(Math.min(currentPageIndex + 1, currentPages.length - 1))
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        scrollToPage(Math.max(currentPageIndex - 1, 0))
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false)
        } else {
          setViewMode('info')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, currentPageIndex, currentPages.length, isFullscreen])

  useEffect(() => {
    if (viewMode !== 'read') return

    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2
      let closestIndex = 0
      let closestDistance = Infinity

      pageRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect()
          const elementCenter = rect.top + rect.height / 2
          const distance = Math.abs(elementCenter - viewportCenter)
          if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = index
          }
        }
      })

      setCurrentPageIndex(closestIndex)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [viewMode])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-zinc-400 text-sm font-manga">Loading story...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-zinc-400 text-lg font-manga">Story not found</div>
          <button
            onClick={() => router.push('/community')}
            className="px-6 py-2 bg-amber-500 text-black rounded-lg font-semibold hover:bg-amber-400 transition-all"
          >
            Back to Community
          </button>
        </div>
      </div>
    )
  }

  const cover = project.coverImageUrl || currentPages[0]?.url || project.sessions?.[0]?.pages?.[0]?.url
  const totalSessions = project.sessions?.filter(s => s.pages?.length > 0).length || 0
  const totalPages = project.sessions?.reduce((sum, s) => sum + (s.pages?.length || 0), 0) || project.pages?.length || 0

  const handleToggleLike = async () => {
    if (!params?.ownerId || !params?.projectId) return
    const res = await toggleLike(params.ownerId, params.projectId)
    setLikeTotal(res.total)
    setLikedByUser(res.likedByUser)
  }

  const handleAddRootComment = async () => {
    if (!newComment.trim() || !params?.ownerId || !params?.projectId) return
    const created = await addComment(params.ownerId, params.projectId, newComment.trim(), null)
    if (created) {
      setComments(prev => [...prev, created])
      setNewComment('')
    }
  }

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim() || !params?.ownerId || !params?.projectId) return
    const created = await addComment(params.ownerId, params.projectId, replyText.trim(), parentId)
    if (created) {
      setComments(prev => [...prev, created])
      setReplyText('')
      setReplyTo(null)
    }
  }

  const buildCommentTree = (items: ProjectComment[]) => {
    const byParent: Record<string, ProjectComment[]> = {}
    items.forEach(c => {
      const key = c.parentId || 'root'
      if (!byParent[key]) byParent[key] = []
      byParent[key].push(c)
    })
    return byParent
  }

  const commentsByParent = buildCommentTree(comments)

  const renderComments = (parentId: string | null, depth = 0) => {
    const key = parentId || 'root'
    const list = commentsByParent[key] || []
    if (!list.length) return null

    return (
      <div className={depth === 0 ? 'space-y-3' : 'space-y-3 pl-4 border-l border-zinc-800'}>
        {list.map(comment => {
          const isAuthor = comment.authorId === project?.ownerId
          return (
            <div key={comment.id} className={`rounded-xl px-3 py-2 ${isAuthor ? 'bg-amber-500/10 border-2 border-amber-500/40' : 'bg-zinc-900/60 border border-zinc-800'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${isAuthor ? 'text-amber-400' : 'text-zinc-300'}`}>{comment.authorName}</span>
                {isAuthor && <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-semibold">Author</span>}
              </div>
              <div className="text-xs text-zinc-200 mt-1">{comment.text}</div>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
                <button onClick={() => { setReplyTo(comment.id); setReplyText('') }} className="hover:text-zinc-300">Reply</button>
                <span>{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
            {replyTo === comment.id && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white outline-none focus:border-amber-400 resize-none"
                  placeholder="Write a reply..."
                />
                <div className="flex items-center gap-2">
                  <button onClick={() => handleAddReply(comment.id)} className="px-3 py-1 rounded-lg bg-amber-500 text-black text-[11px] font-semibold hover:bg-amber-400">Send</button>
                  <button onClick={() => { setReplyTo(null); setReplyText('') }} className="px-3 py-1 rounded-lg border border-zinc-700 text-[11px] text-zinc-300 hover:bg-zinc-800">Cancel</button>
                </div>
              </div>
            )}
            {renderComments(comment.id, depth + 1)}
          </div>
          )
        })}
      </div>
    )
  }

  if (viewMode === 'read') {
    return (
      <div ref={readerRef} className={`min-h-screen ${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-zinc-950`}>
        <div className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('info')}
                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Back to Info"
              >
                <ArrowLeft size={20} className="text-zinc-400" />
              </button>
              <div>
                <h1 className="text-sm font-semibold text-zinc-100 truncate max-w-[200px] md:max-w-md">
                  {project.title || 'Untitled'}
                </h1>
                <p className="text-xs text-zinc-500">
                  {currentSession?.name || 'All Pages'} · Page {currentPageIndex + 1}/{currentPages.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalSessions > 0 && (
                <button
                  onClick={() => setShowSessionList(!showSessionList)}
                  className="p-2 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1"
                  title="Sessions"
                >
                  <Layers size={18} className="text-zinc-400" />
                  <span className="text-xs text-zinc-400 hidden md:inline">Chapters</span>
                </button>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={18} className="text-zinc-400" /> : <Maximize2 size={18} className="text-zinc-400" />}
              </button>
            </div>
          </div>
        </div>

        {showSessionList && totalSessions > 0 && (
          <div className="fixed top-16 right-4 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto w-72">
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-200">Select Chapter</span>
              <button onClick={() => setShowSessionList(false)} className="p-1 hover:bg-zinc-800 rounded">
                <X size={16} className="text-zinc-400" />
              </button>
            </div>
            <div className="p-2 space-y-1">
              {project.sessions?.filter(s => s.pages?.length > 0).map((session, idx) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setSelectedSessionId(session.id)
                    setCurrentPageIndex(0)
                    setShowSessionList(false)
                    setTimeout(() => scrollToPage(0), 100)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                    session.id === selectedSessionId
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="w-12 h-16 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                    {session.pages?.[0]?.url ? (
                      <img src={session.pages[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{session.name || `Chapter ${idx + 1}`}</div>
                    <div className="text-xs text-zinc-500">{session.pages?.length || 0} pages</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-2 md:px-4 py-8">
          <div className="space-y-4">
            {currentPages.map((page, idx) => (
              <div
                key={page.id}
                ref={el => { pageRefs.current[idx] = el }}
                className="relative bg-zinc-900 rounded-lg overflow-hidden shadow-2xl"
              >
                <img
                  src={page.url}
                  alt={`Page ${idx + 1}`}
                  className="w-full h-auto"
                  loading={idx < 3 ? 'eager' : 'lazy'}
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/70 backdrop-blur-sm rounded-full text-xs text-zinc-300 font-manga">
                  PAGE {idx + 1}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center space-y-4">
            <div className="text-zinc-500 text-sm font-manga">— END OF {currentSession?.name?.toUpperCase() || 'CHAPTER'} —</div>
            
            {totalSessions > 1 && (
              <div className="flex justify-center gap-3">
                {project.sessions?.filter(s => s.pages?.length > 0).map((session, idx, arr) => {
                  if (session.id === selectedSessionId && idx < arr.length - 1) {
                    const nextSession = arr[idx + 1]
                    return (
                      <button
                        key="next"
                        onClick={() => {
                          setSelectedSessionId(nextSession.id)
                          setCurrentPageIndex(0)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="px-6 py-3 bg-amber-500 text-black rounded-xl font-manga font-bold hover:bg-amber-400 transition-all"
                      >
                        Next: {nextSession.name || `Chapter ${idx + 2}`}
                      </button>
                    )
                  }
                  return null
                })}
              </div>
            )}

            <button
              onClick={() => setViewMode('info')}
              className="px-6 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm hover:bg-zinc-800 transition-colors"
            >
              Back to Story Info
            </button>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40">
          <button
            onClick={() => scrollToPage(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="p-3 bg-zinc-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronUp size={20} className="text-white" />
          </button>
          <div className="px-3 py-2 bg-zinc-800/90 backdrop-blur-sm rounded-full text-xs text-center text-zinc-300 font-mono">
            {currentPageIndex + 1}/{currentPages.length}
          </div>
          <button
            onClick={() => scrollToPage(Math.min(currentPages.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex >= currentPages.length - 1}
            className="p-3 bg-zinc-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronDown size={20} className="text-white" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          {cover && (
            <img src={cover} alt="" className="w-full h-full object-cover opacity-20 blur-3xl scale-110" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/80 to-zinc-950" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-12">
          <button
            onClick={() => router.push('/community')}
            className="mb-6 text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Community
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-72 flex-shrink-0">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-2xl">
                {cover ? (
                  <img src={cover} alt={project.title || 'Manga cover'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">No Cover</div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-manga text-amber-400">
                {project.title || 'Untitled Story'}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-zinc-400">
                <span>By <span className="text-zinc-200">{project.ownerDisplayName || 'Unknown'}</span></span>
                <span className="text-zinc-600 hidden sm:inline">•</span>
                <span>{totalSessions} chapters</span>
                <span className="text-zinc-600 hidden sm:inline">•</span>
                <span>{totalPages} pages</span>
              </div>

              {project.description && (
                <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl">{project.description}</p>
              )}

              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-amber-300">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-2">
                <button
                  onClick={handleToggleLike}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-zinc-700 hover:bg-zinc-800/70 transition-colors"
                >
                  <Heart size={16} className={`sm:w-[18px] sm:h-[18px] ${likedByUser ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`} />
                  <span className="text-xs sm:text-sm text-zinc-200">{project.likeCount ?? likeTotal}</span>
                </button>
                <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400">
                  <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm">{project.viewCount || 0} views</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400">
                  <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm">{project.commentCount ?? comments.length}</span>
                </div>
              </div>

              {totalPages > 0 && (
                <button
                  onClick={() => setViewMode('read')}
                  className="mt-4 w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-xl font-manga font-bold text-base sm:text-lg shadow-lg hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen size={18} className="sm:w-5 sm:h-5" />
                  Start Reading
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {totalSessions > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-xl font-manga text-zinc-100 flex items-center gap-2 mb-6">
            Chapters ({totalSessions})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.sessions?.filter(s => s.pages?.length > 0).map((session, idx) => (
              <button
                key={session.id}
                onClick={() => {
                  setSelectedSessionId(session.id)
                  setCurrentPageIndex(0)
                  setViewMode('read')
                }}
                className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-amber-400/50 hover:bg-zinc-800/60 transition-all text-left"
              >
                <div className="w-16 h-20 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                  {session.pages?.[0]?.url ? (
                    <img src={session.pages[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-zinc-100 truncate group-hover:text-amber-400 transition-colors">
                    {session.name || `Chapter ${idx + 1}`}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">{session.pages?.length || 0} pages</div>
                </div>
                <BookOpen size={18} className="text-zinc-600 group-hover:text-amber-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 border-t border-zinc-800/50">
        <h2 className="text-xl font-manga text-zinc-100 flex items-center gap-2 mb-6">
          Comments ({comments.length})
        </h2>
        <div className="max-w-2xl space-y-4">
          <div className="space-y-2">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-amber-400 resize-none"
              placeholder="Share your thoughts about this story..."
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddRootComment}
                disabled={!newComment.trim()}
                className="px-5 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Post Comment
              </button>
            </div>
          </div>
          {comments.length > 0 ? renderComments(null) : (
            <p className="text-sm text-zinc-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </div>

      {relatedProjects.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-8 border-t border-zinc-800/50">
          <h2 className="text-xl font-manga text-zinc-100 flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-amber-400" />
            Related Stories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {relatedProjects.map(related => {
              const relatedCover = related.coverImageUrl || related.pages?.[0]?.url || related.sessions?.[0]?.pages?.[0]?.url
              return (
                <Link
                  key={`related-${related.ownerId}-${related.id}`}
                  href={`/community/${encodeURIComponent(related.ownerId!)}/${encodeURIComponent(related.id)}`}
                  className="group"
                >
                  <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/60 hover:border-amber-400/50 transition-all">
                    <div className="aspect-[3/4] bg-zinc-800 overflow-hidden">
                      {relatedCover ? (
                        <img src={relatedCover} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No preview</div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-semibold truncate text-zinc-200 group-hover:text-amber-400 transition-colors">
                        {related.title || 'Untitled'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                        <span className="flex items-center gap-0.5"><Eye size={10} />{related.viewCount || 0}</span>
                        <span className="flex items-center gap-0.5"><Heart size={10} />{related.likeCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
