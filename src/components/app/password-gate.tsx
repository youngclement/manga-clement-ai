'use client'

import React, { useEffect, useState } from 'react'

const PASSWORD = '***REMOVED***'
const STORAGE_KEY = 'manga_studio_site_pass_ok'

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ok = window.localStorage.getItem(STORAGE_KEY)
    if (ok === '1') {
      setAuthorized(true)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === PASSWORD) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, '1')
      }
      setAuthorized(true)
      setError('')
    } else {
      setError('Sai mật khẩu, vui lòng thử lại.')
    }
  }

  if (authorized) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-2 text-center font-manga">
          Manga Studio Access
        </h1>
        <p className="text-xs text-zinc-400 mb-4 text-center">
          Nhập mật khẩu để vào website
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-500 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            Vào web
          </button>
        </form>
      </div>
    </div>
  )
}


