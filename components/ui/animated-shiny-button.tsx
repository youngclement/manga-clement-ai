"use client";

import type React from "react";
import { ChevronRight } from "lucide-react";

interface AnimatedShinyButtonProps {
  children: React.ReactNode;
  className?: string;
  url?: string;
}

export function AnimatedShinyButton({
  children,
  className = "",
  url,
}: AnimatedShinyButtonProps) {
  return (
    <>
      <style jsx>{`
        @property --gradient-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-angle-offset {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-percent {
          syntax: "<percentage>";
          initial-value: 8%;
          inherits: false;
        }

        @property --gradient-shine {
          syntax: "<color>";
          initial-value: white;
          inherits: false;
        }

        .shiny-cta,
        .shiny-cta-link {
          /* Dark theme colors aligned with app */
          --shiny-cta-bg: #020617; /* zinc-950 */
          --shiny-cta-bg-subtle: #18181b; /* zinc-900 */
          --shiny-cta-fg: #f9fafb; /* zinc-50 */
          --shiny-cta-highlight: #fbbf24; /* amber-400 */
          --shiny-cta-highlight-subtle: #fb923c; /* orange-400 */
          --animation: gradient-angle linear infinite;
          --duration: 3s;
          --shadow-size: 2px;
          --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);

          isolation: isolate;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          outline-offset: 4px;
          padding: 0.6rem 1.4rem;
          font-family: var(--font-inter), system-ui, -apple-system, sans-serif;
          font-size: 0.9rem;
          line-height: 1.2;
          font-weight: 600;
          border: 1px solid transparent;
          border-radius: 999px;
          color: var(--shiny-cta-fg);
          background:
            linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg))
              padding-box,
            conic-gradient(
                from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
                transparent,
                var(--shiny-cta-highlight) var(--gradient-percent),
                var(--gradient-shine) calc(var(--gradient-percent) * 2),
                var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
                transparent calc(var(--gradient-percent) * 4)
              )
              border-box;
          box-shadow:
            inset 0 0 0 1px var(--shiny-cta-bg-subtle),
            0 12px 30px rgba(0, 0, 0, 0.7);
          transition: var(--transition);
          transition-property:
            --gradient-angle-offset, --gradient-percent, --gradient-shine,
            transform, box-shadow;
        }

        .shiny-cta-link {
          display: inline-block;
          text-decoration: none;
        }

        .shiny-cta::before,
        .shiny-cta::after,
        .shiny-cta span::before,
        .shiny-cta-link::before,
        .shiny-cta-link::after,
        .shiny-cta-link span::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset-inline-start: 50%;
          inset-block-start: 50%;
          translate: -50% -50%;
          z-index: -1;
        }

        .shiny-cta:active,
        .shiny-cta-link:active {
          translate: 0 1px;
        }

        /* Dots pattern */
        .shiny-cta::before,
        .shiny-cta-link::before {
          --size: calc(100% - var(--shadow-size) * 3);
          --position: 2px;
          --space: calc(var(--position) * 2);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(
              circle at var(--position) var(--position),
              white calc(var(--position) / 4),
              transparent 0
            )
            padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
          mask-image: conic-gradient(
            from calc(var(--gradient-angle) + 45deg),
            black,
            transparent 10% 90%,
            black
          );
          border-radius: 999px;
          opacity: 0.35;
          z-index: -1;
        }

        /* Inner shimmer */
        .shiny-cta::after,
        .shiny-cta-link::after {
          --animation: shimmer linear infinite;
          width: 120%;
          aspect-ratio: 1;
          background: linear-gradient(
            -50deg,
            transparent,
            var(--shiny-cta-highlight),
            transparent
          );
          mask-image: radial-gradient(circle at bottom, transparent 45%, black);
          opacity: 0.6;
        }

        .shiny-cta span,
        .shiny-cta-link span {
          z-index: 1;
        }

        .shiny-cta span::before,
        .shiny-cta-link span::before {
          --size: calc(100% + 1rem);
          width: var(--size);
          height: var(--size);
          box-shadow: inset 0 -1ex 2rem 4px var(--shiny-cta-highlight);
          opacity: 0;
          transition: opacity var(--transition);
          animation: calc(var(--duration) * 1.5) breathe linear infinite;
        }

        /* Animate */
        .shiny-cta,
        .shiny-cta::before,
        .shiny-cta::after,
        .shiny-cta-link,
        .shiny-cta-link::before,
        .shiny-cta-link::after {
          animation:
            var(--animation) var(--duration),
            var(--animation) calc(var(--duration) / 0.4) reverse paused;
          animation-composition: add;
        }

        .shiny-cta:is(:hover, :focus-visible),
        .shiny-cta-link:is(:hover, :focus-visible) {
          --gradient-percent: 18%;
          --gradient-angle-offset: 110deg;
          --gradient-shine: var(--shiny-cta-highlight-subtle);
          transform: translateY(-1px);
          box-shadow:
            inset 0 0 0 1px var(--shiny-cta-bg-subtle),
            0 16px 40px rgba(0, 0, 0, 0.85);
        }

        .shiny-cta:is(:hover, :focus-visible),
        .shiny-cta:is(:hover, :focus-visible)::before,
        .shiny-cta:is(:hover, :focus-visible)::after,
        .shiny-cta-link:is(:hover, :focus-visible),
        .shiny-cta-link:is(:hover, :focus-visible)::before,
        .shiny-cta-link:is(:hover, :focus-visible)::after {
          animation-play-state: running;
        }

        .shiny-cta:is(:hover, :focus-visible) span::before,
        .shiny-cta-link:is(:hover, :focus-visible) span::before {
          opacity: 1;
        }

        @keyframes gradient-angle {
          to {
            --gradient-angle: 360deg;
          }
        }

        @keyframes shimmer {
          to {
            rotate: 360deg;
          }
        }

        @keyframes breathe {
          from,
          to {
            scale: 1;
          }
          50% {
            scale: 1.12;
          }
        }

        /* Light theme overrides */
        @media (prefers-color-scheme: light) {
          .shiny-cta,
          .shiny-cta-link {
            --shiny-cta-bg: #ffffff;
            --shiny-cta-bg-subtle: #e5e7eb; /* zinc-200 */
            --shiny-cta-fg: #0f172a; /* slate-900 */
            --shiny-cta-highlight: #f59e0b; /* amber-500 */
            --shiny-cta-highlight-subtle: #f97316; /* orange-500 */
          }
        }
      `}</style>

      {url ? (
        <a href={url} className={`shiny-cta-link group ${className}`}>
          <span className="flex items-center gap-1.5">
            {children}
            <ChevronRight className="ml-0.5 size-4 shrink-0 transition-all duration-300 ease-out group-hover:translate-x-1" />
          </span>
        </a>
      ) : (
        <button className={`shiny-cta group ${className}`}>
          <span className="flex items-center gap-1.5">
            {children}
            <ChevronRight className="ml-0.5 size-4 shrink-0 transition-all duration-300 ease-out group-hover:translate-x-1" />
          </span>
        </button>
      )}
    </>
  );
}







