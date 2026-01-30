import React from "react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className=" border-t border-zinc-800/70 bg-zinc-950/80">
      <div className="mx-auto flex  flex-col gap-4  py-8 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-manga text-sm text-zinc-100">
            Manga Studio
          </p>
          <p className="max-w-md leading-relaxed">
            AI-powered studio for creating manga pages, keeping characters consistent,
            and exporting print-ready chapters.
          </p>
          <p className="text-[11px] text-zinc-500">
            © {year} Manga Studio. Made by{' '}
            <a
              href="https://x.com/younngclement"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-2"
            >
              ClementHoang
            </a>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] sm:justify-end">
          <a
            href="#"
            className="rounded-full border border-zinc-700/70 px-3 py-1 text-zinc-300 transition hover:border-amber-400 hover:text-amber-300"
          >
            Documentation
          </a>
          <a
            href="#"
            className="rounded-full border border-zinc-700/70 px-3 py-1 text-zinc-300 transition hover:border-amber-400 hover:text-amber-300"
          >
            Changelog
          </a>
          <a
            href="#"
            className="rounded-full border border-zinc-700/70 px-3 py-1 text-zinc-300 transition hover:border-amber-400 hover:text-amber-300"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}


