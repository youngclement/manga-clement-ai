'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { MangaProject, ProjectComment } from '@/lib/types'
import { fetchPublicProjectDetail } from '@/lib/services/storage-service'
import { fetchLikes, toggleLike, fetchComments, addComment } from '@/lib/services/community-service'
import { Heart, MessageCircle } from 'lucide-react'

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

  useEffect(() => {
    const load = async () => {
      if (!params?.ownerId || !params?.projectId) {
        setLoading(false)
        return
      }
      try {
        const [projectData, likesData, commentsData] = await Promise.all([
          fetchPublicProjectDetail(params.ownerId, params.projectId),
          fetchLikes(params.ownerId, params.projectId),
          fetchComments(params.ownerId, params.projectId),
        ])
        setProject(projectData)
        setLikeTotal(likesData.total)
        setLikedByUser(likesData.likedByUser)
        setComments(commentsData)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params?.ownerId, params?.projectId])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-zinc-400 text-sm">Đang tải tập truyện...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 space-y-4">
        <button
          onClick={() => router.back()}
          className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
        >
          ← Quay lại Community
        </button>
        <div className="text-zinc-400 text-sm">Không tìm thấy tập truyện hoặc tập truyện đã bị ẩn.</div>
      </div>
    )
  }

  const cover = project.coverImageUrl || project.pages?.[0]?.url
  const totalPages = project.pages?.length || 0
  const totalSessions = project.sessions?.length || 0

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
        {list.map(comment => (
          <div key={comment.id} className="rounded-xl bg-zinc-900/60 border border-zinc-800 px-3 py-2">
            <div className="text-xs text-zinc-300 font-semibold">
              {comment.authorName}
            </div>
            <div className="text-xs text-zinc-200 mt-1">
              {comment.text}
            </div>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
              <button
                onClick={() => {
                  setReplyTo(comment.id)
                  setReplyText('')
                }}
                className="hover:text-zinc-300"
              >
                Trả lời
              </button>
              <span>
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            {replyTo === comment.id && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none"
                  placeholder="Viết câu trả lời..."
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddReply(comment.id)}
                    className="px-3 py-1 rounded-lg bg-amber-500 text-black text-[11px] font-semibold hover:bg-amber-400"
                  >
                    Gửi
                  </button>
                  <button
                    onClick={() => {
                      setReplyTo(null)
                      setReplyText('')
                    }}
                    className="px-3 py-1 rounded-lg border border-zinc-700 text-[11px] text-zinc-300 hover:bg-zinc-800"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
            {renderComments(comment.id, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <button
        onClick={() => router.back()}
        className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
      >
        ← Quay lại Community
      </button>

      <div className="flex flex-col md:flex-row gap-6 md:items-start">
        <div className="w-full md:w-1/3 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/60">
          <div className="aspect-[3/4] bg-zinc-800/80 flex items-center justify-center">
            {cover ? (
              <img
                src={cover}
                alt={project.title || 'Manga cover'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-zinc-500">Chưa có ảnh preview</span>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <h1 className="text-2xl md:text-3xl font-manga text-amber-400">
            {project.title || 'Untitled project'}
          </h1>
          <div className="text-sm text-zinc-400">
            Tác giả:{' '}
            <span className="text-zinc-100">
              {project.ownerDisplayName || 'Unknown'}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-zinc-300">
              {project.description}
            </p>
          )}
          <div className="text-xs text-zinc-500">
            {totalSessions} sessions · {totalPages} pages
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleToggleLike}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800/70 transition-colors"
            >
              <Heart
                size={14}
                className={likedByUser ? 'fill-red-500 text-red-500' : 'text-zinc-400'}
              />
              <span>{likeTotal} lượt thích</span>
            </button>
          </div>
        </div>
      </div>

      {totalPages > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-manga text-zinc-100">
            Các trang truyện
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {project.pages.map((page, idx) => (
              <div
                key={page.id}
                className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/60"
              >
                <div className="aspect-[3/4] bg-zinc-800/80">
                  <img
                    src={page.url}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="px-2 py-1.5 text-[11px] text-zinc-400 text-center">
                  PAGE {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg md:text-xl font-manga text-zinc-100 flex items-center gap-2">
          <MessageCircle size={18} className="text-amber-400" />
          Bình luận
        </h2>
        <div className="space-y-2">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            rows={3}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none"
            placeholder="Chia sẻ cảm nhận về tập truyện này..."
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddRootComment}
              disabled={!newComment.trim()}
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Gửi bình luận
            </button>
          </div>
        </div>
        {comments.length > 0 ? (
          <div className="space-y-3">
            {renderComments(null)}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            Chưa có bình luận nào, hãy là người đầu tiên bình luận.
          </p>
        )}
      </div>
    </div>
  )
}


