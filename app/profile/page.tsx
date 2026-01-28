'use client'

import { useEffect, useState } from 'react'
import { fetchMyProjects, updateProjectMeta } from '@/lib/services/storage-service'
import { getMyProfile, updateMyProfile } from '@/lib/services/user-service'
import type { MangaProject, UserProfile } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [projects, setProjects] = useState<MangaProject[]>([])
    const [loading, setLoading] = useState(true)
    const [savingProfile, setSavingProfile] = useState(false)
    const [savingProjectId, setSavingProjectId] = useState<string | null>(null)

    const [displayName, setDisplayName] = useState('')
    const [bio, setBio] = useState('')

    useEffect(() => {
        const load = async () => {
            try {
                const [p, proj] = await Promise.all([getMyProfile(), fetchMyProjects()])
                setProfile(p)
                setProjects(proj)
                if (p) {
                    setDisplayName(p.displayName || p.username)
                    setBio(p.bio || '')
                }
            } catch {
                // errors are handled by api layer
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const handleSaveProfile = async () => {
        if (!profile) return
        setSavingProfile(true)
        try {
            const updated = await updateMyProfile({
                displayName: displayName.trim() || profile.username,
                bio,
            })
            setProfile(updated)
            toast.success('Cập nhật profile thành công')
        } catch {
            // handled in api
        } finally {
            setSavingProfile(false)
        }
    }

    const handleTogglePublic = async (project: MangaProject, value: boolean) => {
        setSavingProjectId(project.id)
        try {
            await updateProjectMeta(project.id, { isPublic: value })
            setProjects(prev =>
                prev.map(p => (p.id === project.id ? { ...p, isPublic: value } : p)),
            )
            toast.success(
                value ? 'Đã public tập truyện lên community' : 'Đã ẩn tập truyện khỏi community',
            )
        } catch {
            // handled in api
        } finally {
            setSavingProjectId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <div className="text-zinc-400 text-sm">Đang tải profile...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="space-y-4 max-w-xl">
                    <h1 className="text-2xl md:text-3xl font-manga text-amber-400">
                        Hồ sơ của bạn
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Chỉnh sửa thông tin cá nhân và quản lý tập truyện public lên community.
                    </p>

                    <div className="space-y-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">Tên hiển thị</label>
                            <Input
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                className="bg-zinc-950 border-zinc-700 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-400">Giới thiệu</label>
                            <Textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                rows={4}
                                className="bg-zinc-950 border-zinc-700 text-sm resize-none"
                            />
                        </div>
                        <button
                            onClick={handleSaveProfile}
                            disabled={!profile || savingProfile}
                            className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                            {savingProfile ? 'Đang lưu...' : 'Lưu profile'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg md:text-xl font-manga text-zinc-100">
                    Bộ sưu tập truyện của bạn
                </h2>
                {projects.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                        Bạn chưa có tập truyện nào. Hãy tạo truyện trong Studio rồi quay lại đây để public
                        lên community.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects.map(project => {
                            const cover = project.pages?.[0]?.url;
                            const totalPages = project.pages?.length || 0;
                            const totalSessions = project.sessions?.length || 0;
                            const updated = project.updatedAt || project.createdAt;
                            const updatedLabel = updated
                                ? new Date(updated).toLocaleDateString()
                                : '';

                            return (
                                <div
                                    key={project.id}
                                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden flex flex-col"
                                >
                                    <div className="h-40 bg-zinc-800/80 flex items-center justify-center">
                                        {cover ? (
                                            <img
                                                src={cover}
                                                alt={project.title || 'Manga cover'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xs text-zinc-500">
                                                Chưa có ảnh preview
                                            </span>
                                        )}
                                    </div>
                                    <div className="px-4 py-3 space-y-2 flex-1 flex flex-col">
                                        <div className="space-y-1">
                                            <div className="text-sm font-semibold truncate">
                                                {project.title || 'Untitled project'}
                                            </div>
                                            <div className="text-[11px] text-zinc-500">
                                                {totalSessions} sessions · {totalPages} pages
                                            </div>
                                            {updatedLabel && (
                                                <div className="text-[11px] text-zinc-600">
                                                    Cập nhật: {updatedLabel}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-3 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-zinc-400">
                                                    Public trên community
                                                </span>
                                                <Switch
                                                    checked={!!project.isPublic}
                                                    disabled={savingProjectId === project.id}
                                                    onCheckedChange={val => handleTogglePublic(project, val)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}


