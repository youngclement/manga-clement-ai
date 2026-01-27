'use client'

import { motion } from 'motion/react'

interface GenerationProgressProps {
  progress: number // 0-100
  label?: string
  retryCount?: number
  className?: string
}

export function GenerationProgress({ progress, label, retryCount = 0, className = '' }: GenerationProgressProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-300 font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)' }}>
            {label}
            {retryCount > 0 && (
              <span className="text-amber-400/70 text-[10px] font-normal">
                (Retry {retryCount}/5)
              </span>
            )}
          </span>
          <span className="text-amber-400 font-manga text-sm">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="relative h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
    </div>
  )
}

