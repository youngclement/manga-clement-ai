'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchMyProjects, updateProjectMeta } from '@/lib/services/storage-service'
import { getMyProfile, updateMyProfile } from '@/lib/services/user-service'
import type { MangaProject, UserProfile } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Camera, Sparkles, X } from 'lucide-react'

export default function ProfilePage() {
    const searchParams = useSearchParams()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [projects, setProjects] = useState<MangaProject[]>([])
    const [loading, setLoading] = useState(true)
    const [savingProfile, setSavingProfile] = useState(false)
    const [savingProjectId, setSavingProjectId] = useState<string | null>(null)
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)

    const [displayName, setDisplayName] = useState('')
    const [bio, setBio] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [location, setLocation] = useState('')
    const [website, setWebsite] = useState('')
    const [socialLinks, setSocialLinks] = useState({
        twitter: '',
        instagram: '',
        facebook: '',
        youtube: '',
        tiktok: '',
    })
    const [preferences, setPreferences] = useState({
        theme: 'auto' as 'light' | 'dark' | 'auto',
        language: 'vi',
        notifications: {
            email: true,
            push: true,
            comments: true,
            likes: true,
        },
    })

    useEffect(() => {
        const load = async () => {
            try {
                const [p, proj] = await Promise.all([getMyProfile(), fetchMyProjects()])
                setProfile(p)
                setProjects(proj)
                if (p) {
                    setDisplayName(p.displayName || p.username)
                    setBio(p.bio || '')
                    setAvatarUrl(p.avatarUrl || '')
                    setEmail(p.email || '')
                    setPhone(p.phone || '')
                    setLocation(p.location || '')
                    setWebsite(p.website || '')
                    setSocialLinks({
                        twitter: p.socialLinks?.twitter || '',
                        instagram: p.socialLinks?.instagram || '',
                        facebook: p.socialLinks?.facebook || '',
                        youtube: p.socialLinks?.youtube || '',
                        tiktok: p.socialLinks?.tiktok || '',
                    })
                    setPreferences({
                        theme: p.preferences?.theme || 'auto',
                        language: p.preferences?.language || 'vi',
                        notifications: {
                            email: p.preferences?.notifications?.email ?? true,
                            push: p.preferences?.notifications?.push ?? true,
                            comments: p.preferences?.notifications?.comments ?? true,
                            likes: p.preferences?.notifications?.likes ?? true,
                        },
                    })
                }
            } catch {
                // errors are handled by api layer
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    useEffect(() => {
        // Show welcome banner if coming from registration
        if (searchParams.get('welcome') === 'true') {
            setShowWelcomeBanner(true)
            toast.success('Chào mừng bạn đến với Manga Studio! Hãy hoàn thiện profile của bạn.')
        }
    }, [searchParams])

    // Check if profile is incomplete
    const isProfileIncomplete = profile && (!profile.displayName || !profile.bio || !profile.avatarUrl)

    const handleSaveProfile = async () => {
        if (!profile) return
        setSavingProfile(true)
        try {
            const updated = await updateMyProfile({
                displayName: displayName.trim() || profile.username,
                bio,
                avatarUrl: avatarUrl.trim() || undefined,
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                location: location.trim() || undefined,
                website: website.trim() || undefined,
                socialLinks: {
                    twitter: socialLinks.twitter.trim() || undefined,
                    instagram: socialLinks.instagram.trim() || undefined,
                    facebook: socialLinks.facebook.trim() || undefined,
                    youtube: socialLinks.youtube.trim() || undefined,
                    tiktok: socialLinks.tiktok.trim() || undefined,
                },
                preferences,
            })
            setProfile(updated)
            if (updated) {
                setAvatarUrl(updated.avatarUrl || '')
                setEmail(updated.email || '')
                setPhone(updated.phone || '')
                setLocation(updated.location || '')
                setWebsite(updated.website || '')
                setSocialLinks({
                    twitter: updated.socialLinks?.twitter || '',
                    instagram: updated.socialLinks?.instagram || '',
                    facebook: updated.socialLinks?.facebook || '',
                    youtube: updated.socialLinks?.youtube || '',
                    tiktok: updated.socialLinks?.tiktok || '',
                })
                setPreferences({
                    theme: updated.preferences?.theme || 'auto',
                    language: updated.preferences?.language || 'vi',
                    notifications: {
                        email: updated.preferences?.notifications?.email ?? true,
                        push: updated.preferences?.notifications?.push ?? true,
                        comments: updated.preferences?.notifications?.comments ?? true,
                        likes: updated.preferences?.notifications?.likes ?? true,
                    },
                })
                // Hide welcome banner after first save
                setShowWelcomeBanner(false)
            }
            toast.success('Cập nhật profile thành công')
        } catch {
            // handled in api
        } finally {
            setSavingProfile(false)
        }
    }

    const getInitials = (username: string) => {
        return username.substring(0, 2).toUpperCase()
    }

    const [projectTags, setProjectTags] = useState<Record<string, string[]>>({})

    useEffect(() => {
        if (projects.length > 0) {
            const tagsMap: Record<string, string[]> = {}
            projects.forEach(p => {
                tagsMap[p.id] = p.tags || []
            })
            setProjectTags(tagsMap)
        }
    }, [projects])

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

    const handleUpdateTags = async (projectId: string, tags: string[]) => {
        setSavingProjectId(projectId)
        try {
            await updateProjectMeta(projectId, { tags })
            setProjects(prev =>
                prev.map(p => (p.id === projectId ? { ...p, tags } : p)),
            )
            setProjectTags(prev => ({ ...prev, [projectId]: tags }))
            toast.success('Đã cập nhật tags')
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
            {/* Welcome Banner */}
            {showWelcomeBanner && (
                <div className="bg-linear-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 relative">
                    <div className="bg-amber-500/20 rounded-full p-2 shrink-0">
                        <Sparkles className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h3 className="text-sm font-semibold text-amber-300">
                            Chào mừng bạn đến với Manga Studio!
                        </h3>
                        <p className="text-xs text-zinc-300">
                            Hãy hoàn thiện thông tin profile của bạn để có trải nghiệm tốt nhất. Bạn có thể thêm tên hiển thị, giới thiệu và avatar.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowWelcomeBanner(false)}
                        className="text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Incomplete Profile Banner */}
            {isProfileIncomplete && !showWelcomeBanner && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <div className="bg-blue-500/20 rounded-full p-2 shrink-0">
                        <Sparkles className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h3 className="text-sm font-semibold text-blue-300">
                            Hoàn thiện profile của bạn
                        </h3>
                        <p className="text-xs text-zinc-300">
                            Thêm thông tin chi tiết để cộng đồng biết thêm về bạn.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="space-y-4 max-w-xl">
                    <h1 className="text-2xl md:text-3xl font-manga text-amber-400">
                        Hồ sơ của bạn
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Chỉnh sửa thông tin cá nhân và quản lý tập truyện public lên community.
                    </p>

                    <div className="space-y-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-4 pb-4 border-b border-zinc-800">
                            <div className="relative">
                                <Avatar className="h-20 w-20 border-2 border-amber-400/50">
                                    <AvatarImage src={avatarUrl} alt={displayName || profile?.username} />
                                    <AvatarFallback className="bg-zinc-800 text-amber-400 text-xl font-semibold">
                                        {profile ? getInitials(displayName || profile.username) : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-1.5 border border-zinc-700">
                                    <Camera className="h-3 w-3 text-amber-400" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-xs text-zinc-400">Avatar URL</label>
                                <Input
                                    value={avatarUrl}
                                    onChange={e => setAvatarUrl(e.target.value)}
                                    placeholder="https://example.com/avatar.jpg"
                                    className="bg-zinc-950 border-zinc-700 text-sm"
                                />
                                <p className="text-[10px] text-zinc-500">
                                    Nhập URL ảnh đại diện của bạn
                                </p>
                            </div>
                        </div>

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
                    </div>

                    {/* Contact Information Section */}
                    <div className="space-y-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Thông tin liên hệ</h3>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Email</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="bg-zinc-950 border-zinc-700 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Số điện thoại</label>
                                <Input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="+84 xxx xxx xxx"
                                    className="bg-zinc-950 border-zinc-700 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Địa chỉ</label>
                                <Input
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="Thành phố, Quốc gia"
                                    className="bg-zinc-950 border-zinc-700 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Website</label>
                                <Input
                                    type="url"
                                    value={website}
                                    onChange={e => setWebsite(e.target.value)}
                                    placeholder="https://yourwebsite.com"
                                    className="bg-zinc-950 border-zinc-700 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Social Links Section */}
                    <div className="space-y-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Mạng xã hội</h3>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Twitter/X</label>
                                <Input
                                    value={socialLinks.twitter}
                                    onChange={e => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                                    placeholder="@username hoặc URL"
                                    className="bg-zinc-950 border-zinc-700 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Instagram</label>
                                <Input
                                    value={socialLinks.instagram}
                                    onChange={e => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                                    placeholder="@username hoặc URL"
                                    className="bg-zinc-950 border-zinc-700 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Facebook</label>
                                <Input
                                    value={socialLinks.facebook}
                                    onChange={e => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                                    placeholder="URL Facebook"
                                    className="bg-zinc-950 border-zinc-700 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">YouTube</label>
                                <Input
                                    value={socialLinks.youtube}
                                    onChange={e => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                                    placeholder="URL YouTube"
                                    className="bg-zinc-950 border-zinc-700 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">TikTok</label>
                                <Input
                                    value={socialLinks.tiktok}
                                    onChange={e => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                                    placeholder="@username hoặc URL"
                                    className="bg-zinc-950 border-zinc-700 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preferences Section */}
                    <div className="space-y-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Tùy chọn</h3>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Giao diện</label>
                                <select
                                    value={preferences.theme}
                                    onChange={e => setPreferences({ ...preferences, theme: e.target.value as 'light' | 'dark' | 'auto' })}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white"
                                >
                                    <option value="auto">Tự động</option>
                                    <option value="light">Sáng</option>
                                    <option value="dark">Tối</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Ngôn ngữ</label>
                                <select
                                    value={preferences.language}
                                    onChange={e => setPreferences({ ...preferences, language: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white"
                                >
                                    <option value="vi">Tiếng Việt</option>
                                    <option value="en">English</option>
                                    <option value="ja">日本語</option>
                                    <option value="ko">한국어</option>
                                </select>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-zinc-800">
                                <label className="text-xs text-zinc-400">Thông báo</label>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-300">Email</span>
                                        <Switch
                                            checked={preferences.notifications.email}
                                            onCheckedChange={checked =>
                                                setPreferences({
                                                    ...preferences,
                                                    notifications: { ...preferences.notifications, email: checked },
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-300">Push</span>
                                        <Switch
                                            checked={preferences.notifications.push}
                                            onCheckedChange={checked =>
                                                setPreferences({
                                                    ...preferences,
                                                    notifications: { ...preferences.notifications, push: checked },
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-300">Bình luận</span>
                                        <Switch
                                            checked={preferences.notifications.comments}
                                            onCheckedChange={checked =>
                                                setPreferences({
                                                    ...preferences,
                                                    notifications: { ...preferences.notifications, comments: checked },
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-300">Likes</span>
                                        <Switch
                                            checked={preferences.notifications.likes}
                                            onCheckedChange={checked =>
                                                setPreferences({
                                                    ...preferences,
                                                    notifications: { ...preferences.notifications, likes: checked },
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={!profile || savingProfile}
                        className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {savingProfile ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                    </button>
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
                                        {/* Tags */}
                                        <div className="mt-2 space-y-1">
                                            <label className="text-[10px] text-zinc-500">Tags (phân cách bằng dấu phẩy)</label>
                                            <Input
                                                value={(projectTags[project.id] || project.tags || []).join(', ')}
                                                onChange={e => {
                                                    const tags = e.target.value
                                                        .split(',')
                                                        .map(t => t.trim())
                                                        .filter(Boolean)
                                                    setProjectTags(prev => ({ ...prev, [project.id]: tags }))
                                                }}
                                                onBlur={() => {
                                                    const tags = projectTags[project.id] || project.tags || []
                                                    if (JSON.stringify(tags) !== JSON.stringify(project.tags || [])) {
                                                        handleUpdateTags(project.id, tags)
                                                    }
                                                }}
                                                placeholder="action, romance, fantasy..."
                                                className="bg-zinc-950 border-zinc-700 text-xs h-7"
                                                disabled={savingProjectId === project.id}
                                            />
                                            {projectTags[project.id] && projectTags[project.id].length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {projectTags[project.id].slice(0, 3).map(tag => (
                                                        <span
                                                            key={tag}
                                                            className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-amber-300"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {projectTags[project.id].length > 3 && (
                                                        <span className="text-[10px] text-zinc-500">
                                                            +{projectTags[project.id].length - 3}
                                                        </span>
                                                    )}
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


