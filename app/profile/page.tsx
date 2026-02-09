'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchMyProjects, updateProjectMeta } from '@/lib/services/storage-service'
import { getMyProfile, updateMyProfile, uploadAvatar } from '@/lib/services/user-service'
import type { MangaProject, UserProfile } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Camera, Sparkles, X, Edit2, Save, X as XIcon } from 'lucide-react'
import { useRef } from 'react'

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
                const [p, proj] = await Promise.all([
                    getMyProfile().catch(() => null),
                    fetchMyProjects().catch(() => [])
                ])
                setProfile(p)
                setProjects(Array.isArray(proj) ? proj : [])
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
            } catch (error: any) {
                const errorMsg = error?.message || 'Failed to load profile'
                toast.error('Failed to load profile', {
                    description: errorMsg
                })
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    useEffect(() => {
        if (searchParams.get('welcome') === 'true') {
            setShowWelcomeBanner(true)
            toast.success('Welcome to Manga Studio! Please complete your profile.')
        }
    }, [searchParams])
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
                setShowWelcomeBanner(false)
                setIsEditing(false)
            }
            toast.success('Profile updated successfully')
        } catch {
        } finally {
            setSavingProfile(false)
        }
    }

    const handleCancelEdit = () => {
        if (profile) {
            setDisplayName(profile.displayName || profile.username)
            setBio(profile.bio || '')
            setAvatarUrl(profile.avatarUrl || '')
            setEmail(profile.email || '')
            setPhone(profile.phone || '')
            setLocation(profile.location || '')
            setWebsite(profile.website || '')
            setSocialLinks({
                twitter: profile.socialLinks?.twitter || '',
                instagram: profile.socialLinks?.instagram || '',
                facebook: profile.socialLinks?.facebook || '',
                youtube: profile.socialLinks?.youtube || '',
                tiktok: profile.socialLinks?.tiktok || '',
            })
            setPreferences({
                theme: profile.preferences?.theme || 'auto',
                language: profile.preferences?.language || 'vi',
                notifications: {
                    email: profile.preferences?.notifications?.email ?? true,
                    push: profile.preferences?.notifications?.push ?? true,
                    comments: profile.preferences?.notifications?.comments ?? true,
                    likes: profile.preferences?.notifications?.likes ?? true,
                },
            })
        }
        setIsEditing(false)
    }

    const getInitials = (username: string) => {
        return username.substring(0, 2).toUpperCase()
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Invalid file type', {
                description: 'Please select an image file'
            })
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large', {
                description: 'Please select an image smaller than 5MB'
            })
            return
        }

        setUploadingAvatar(true)
        try {
            const reader = new FileReader()
            reader.onload = async (e) => {
                const base64 = e.target?.result as string
                if (base64) {
                    const cloudinaryUrl = await uploadAvatar(base64)
                    setAvatarUrl(cloudinaryUrl)
                    if (profile) {
                        const updated = await updateMyProfile({ avatarUrl: cloudinaryUrl })
                        if (updated) {
                            setProfile(updated)
                            toast.success('Avatar uploaded successfully')
                        }
                    }
                }
            }
            reader.readAsDataURL(file)
        } catch (error: any) {
            toast.error('Failed to upload avatar', {
                description: error?.message || 'Please try again'
            })
        } finally {
            setUploadingAvatar(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const [projectTags, setProjectTags] = useState<Record<string, string[]>>({})
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

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
                value ? 'Story published to community' : 'Story hidden from community',
            )
        } catch {
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
            toast.success('Tags updated')
        } catch {
        } finally {
            setSavingProjectId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <div className="text-zinc-400 text-sm">Loading profile...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full py-10 md:py-20 space-y-8">
            {showWelcomeBanner && (
                <div className="bg-linear-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 relative">
                   
                    <div className="flex-1 space-y-1">
                        <h3 className="text-sm font-semibold text-amber-300">
                            Welcome to Manga Studio!
                        </h3>
                        <p className="text-xs text-zinc-300">
                            Complete your profile information for the best experience. You can add a display name, bio, and avatar.
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

            {isProfileIncomplete && !showWelcomeBanner && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <div className="bg-blue-500/20 rounded-full p-2 shrink-0">
                        <Sparkles className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h3 className="text-sm font-semibold text-blue-300">
                            Complete your profile
                        </h3>
                        <p className="text-xs text-zinc-300">
                            Add detailed information for the community to know more about you.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-400">
                            <path d="M0 4.5C0 3.11929 1.11929 2 2.5 2H7.5C8.88071 2 10 3.11929 10 4.5V9.40959C10.0001 9.4396 10.0002 9.46975 10.0002 9.50001C10.0002 10.8787 11.1162 11.9968 12.4942 12C12.4961 12 12.4981 12 12.5 12H17.5C18.8807 12 20 13.1193 20 14.5V19.5C20 20.8807 18.8807 22 17.5 22H12.5C11.1193 22 10 20.8807 10 19.5V14.5C10 14.4931 10 14.4861 10.0001 14.4792C9.98891 13.1081 8.87394 12 7.50017 12C7.4937 12 7.48725 12 7.48079 12H2.5C1.11929 12 0 10.8807 0 9.5V4.5Z" fill="currentColor" />
                        </svg>
                        <h1 className="text-3xl font-medium tracking-tight text-white md:text-4xl" style={{ fontFamily: 'var(--font-inter)' }}>
                            Your Profile
                        </h1>
                    </div>
                    <p className="text-sm font-medium tracking-tight text-zinc-400 md:text-base max-w-2xl" style={{ fontFamily: 'var(--font-inter)' }}>
                        Edit your personal information and manage stories published to community.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Profile Information</h2>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm transition-colors"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Edit
                                </button>
                            )}
                        </div>

                        <div className="flex items-start gap-6 mb-6">
                            <div className="relative group shrink-0">
                                <Avatar className="h-32 w-32 border-2 border-amber-400/50">
                                    {avatarUrl ? (
                                        <AvatarImage src={avatarUrl} alt={displayName || profile?.username || 'User'} />
                                    ) : null}
                                    <AvatarFallback className="bg-zinc-800 text-amber-400 text-3xl font-semibold">
                                        {profile ? getInitials(displayName || profile.username) : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-2 border border-zinc-700 hover:bg-zinc-800 hover:border-amber-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Upload avatar"
                                    >
                                        <Camera className="h-4 w-4 text-amber-400" />
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                            </div>
                            <div className="flex-1 space-y-3">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <Input
                                                value={displayName}
                                                onChange={e => setDisplayName(e.target.value)}
                                                placeholder="Display Name"
                                                className="bg-zinc-950 border-zinc-700 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Textarea
                                                value={bio}
                                                onChange={e => setBio(e.target.value)}
                                                rows={3}
                                                placeholder="Bio"
                                                className="bg-zinc-950 border-zinc-700 text-sm resize-none"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <h3 className="text-xl font-semibold text-white mb-1">
                                                {displayName || profile?.username || 'User'}
                                            </h3>
                                            {bio && (
                                                <p className="text-sm text-zinc-400 leading-relaxed">
                                                    {bio}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2.5 pt-4 border-t border-zinc-800">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Email</span>
                                {isEditing ? (
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="bg-zinc-950 border-zinc-700 text-sm w-64"
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-400">{email || 'Not set'}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Phone</span>
                                {isEditing ? (
                                    <Input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+84 xxx xxx xxx"
                                        className="bg-zinc-950 border-zinc-700 text-sm w-64"
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-400">{phone || 'Not set'}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Location</span>
                                {isEditing ? (
                                    <Input
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        placeholder="City, Country"
                                        className="bg-zinc-950 border-zinc-700 text-sm w-64"
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-400">{location || 'Not set'}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Website</span>
                                {isEditing ? (
                                    <Input
                                        type="url"
                                        value={website}
                                        onChange={e => setWebsite(e.target.value)}
                                        placeholder="https://yourwebsite.com"
                                        className="bg-zinc-950 border-zinc-700 text-sm w-64"
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-400">{website || 'Not set'}</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2.5 pt-4 border-t border-zinc-800 mt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Twitter/X</span>
                                {isEditing ? (
                                    <Input
                                        value={socialLinks.twitter}
                                        onChange={e => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                                        placeholder="@username or URL"
                                        className="bg-zinc-950 border-zinc-700 text-sm w-64"
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-400">{socialLinks.twitter || 'Not set'}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Instagram</span>
                                {isEditing ? (
                                    <Input
                                        value={socialLinks.instagram}
                                        onChange={e => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                                        placeholder="@username or URL"
                                        className="bg-zinc-950 border-zinc-700 text-sm w-64"
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-400">{socialLinks.instagram || 'Not set'}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Facebook</span>
                                {isEditing ? (
                                    <Input
                                        value={socialLinks.facebook}
                                        onChange={e => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                                        placeholder="URL"
                                        className="bg-zinc-950 border-zinc-700 text-sm w-64"
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-400">{socialLinks.facebook || 'Not set'}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">YouTube</span>
                                {isEditing ? (
                                    <Input
                                        value={socialLinks.youtube}
                                        onChange={e => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                                        placeholder="URL"
                                        className="bg-zinc-950 border-zinc-700 text-sm w-64"
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-400">{socialLinks.youtube || 'Not set'}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">TikTok</span>
                                {isEditing ? (
                                    <Input
                                        value={socialLinks.tiktok}
                                        onChange={e => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                                        placeholder="@username or URL"
                                        className="bg-zinc-950 border-zinc-700 text-sm w-64"
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-400">{socialLinks.tiktok || 'Not set'}</span>
                                )}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-4">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={savingProfile}
                                    className="flex-1 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-lg font-bold text-sm py-2.5 px-4 transition-all shadow-[0_3px_0_0_rgb(180,83,9)] hover:shadow-[0_3px_0_0_rgb(180,83,9)] active:shadow-[0_1px_0_0_rgb(180,83,9)] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                >
                                    <Save className="h-4 w-4" />
                                    {savingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={savingProfile}
                                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <XIcon className="h-4 w-4" />
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-white" style={{ fontFamily: 'var(--font-inter)' }}>
                                Your Manga Collection
                            </h2>
                            <p className="text-sm font-medium tracking-tight text-zinc-400" style={{ fontFamily: 'var(--font-inter)' }}>
                                Manage and publish your stories to the community
                            </p>
                        </div>
                        {projects.length === 0 ? (
                            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center">
                                <p className="text-sm text-zinc-400" style={{ fontFamily: 'var(--font-inter)' }}>
                                    You have no manga yet. Create a manga in Studio and come back here to publish to community.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projects.map(project => {
                                    const firstSession = project.sessions?.[0];
                                    const cover = firstSession?.pages?.[0]?.url || project.pages?.[0]?.url;
                                    const totalPages = project.sessions?.reduce((sum, s) => sum + (s.pages?.length || 0), 0) || project.pages?.length || 0;
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
                                                        No preview image
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
                                                            Updated: {updatedLabel}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-2 space-y-1">
                                                    <label className="text-[10px] text-zinc-500">Tags (comma separated)</label>
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
                                                            Public on community
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
            </div>
        </div>
    )
}
