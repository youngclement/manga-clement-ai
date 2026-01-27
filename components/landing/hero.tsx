"use client";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";

export default function Hero() {
    // Base manga demo images
    const baseMangaImages = [
        "/demo-img/demoimg1.png",
        "/demo-img/demoimg2.png",
        "/demo-img/demoimg3.png",
        "/demo-img/demoimg4.png",
        "/demo-img/demoimg5.png",
        "/demo-img/demoimg6.png",
    ];

    // Loop to create 32 images from base images
    const images = Array.from({ length: 32 }, (_, i) => baseMangaImages[i % baseMangaImages.length]);

    return (
        <section className=" my-10  rounded-3xl bg-gray-950/5 px-4 py-8 ring-1 ring-neutral-700/10 dark:bg-neutral-900/60">
            <div className="flex flex-col items-center gap-6">
                {/* Top: Heading + subcopy (stacked, centered) */}
                <div className="space-y-3 text-center">
                    <TypewriterEffect
                        words={[
                            {
                                text: "AI ",
                                className: "font-manga tracking-wide text-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.45)]",
                            },
                            {
                                text: "MANGA ",
                                className:
                                    "font-manga tracking-[0.08em] text-white drop-shadow-[0_0_16px_rgba(248,250,252,0.5)]",
                            },
                            {
                                text: "STUDIO",
                                className:
                                    "font-manga tracking-[0.08em] bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(248,113,113,0.5)]",
                            },
                        ]}
                        className="mb-1 text-2xl sm:text-3xl md:text-4xl lg:text-4xl leading-tight"
                        cursorClassName="bg-amber-400"
                    />

                    <p
                        className="mx-auto max-w-2xl text-xs sm:text-sm md:text-base text-zinc-300"
                        style={{ fontFamily: "var(--font-inter)" }}
                    >
                        Turn simple prompts into full manga pages. Maintain character consistency, control panel
                        layouts, and export chapters as print‑ready PDFs – all in one focused studio.
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 text-[11px] sm:text-xs text-zinc-400">
                        <span className="inline-flex items-center rounded-full border border-zinc-700/60 bg-zinc-900/60 px-3 py-1">
                            Stable layouts
                        </span>
                        <span className="inline-flex items-center rounded-full border border-zinc-700/60 bg-zinc-900/60 px-3 py-1">
                            Character consistency
                        </span>
                        <span className="inline-flex items-center rounded-full border border-zinc-700/60 bg-zinc-900/60 px-3 py-1">
                            One‑click PDF export
                        </span>
                    </div>
                </div>

                {/* Bottom: 3D marquee gallery (full width under text) */}
                <div className="w-full rounded-3xl bg-black/40 p-2 ring-1 ring-zinc-800/70 shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
                    <ThreeDMarquee images={images} />
                </div>
            </div>
        </section>
    );
}
