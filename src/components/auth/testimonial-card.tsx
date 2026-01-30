'use client';

export function TestimonialCard() {
    return (
        <div className="relative flex min-h-full w-full flex-col items-start justify-end overflow-hidden rounded-2xl bg-black p-4 md:p-8">
            {/* Badges */}
            <div className="relative z-40 mb-2 flex items-center gap-2">
                <p className="rounded-md bg-black/50 px-2 py-1 text-xs text-white">AI Manga</p>
                <p className="rounded-md bg-black/50 px-2 py-1 text-xs text-white">Creative Studio</p>
            </div>

            {/* Testimonial */}
            <div className="relative z-40 max-w-sm rounded-xl bg-black/50 p-4 backdrop-blur-sm">
                <h2 className="text-white text-lg font-medium">
                    Manga Studio has completely changed how we create. What used to take hours is now fully automated.
                </h2>
                <p className="mt-4 text-sm text-white/50">ClementHoang</p>
                <p className="mt-1 text-sm text-white/50">
                    Creator, <span className="font-bold">Manga Studio</span>
                </p>
            </div>

            {/* Decorative Grid - Layer 1 */}
            <div className="absolute -top-48 -right-40 z-20 grid rotate-45 transform grid-cols-4 gap-32">
                <div className="size-40 shrink-0 rounded-3xl bg-neutral-900 shadow-[0px_2px_0px_0px_rgb(64,64,64)_inset]"></div>
                <div className="size-40 shrink-0 rounded-3xl bg-neutral-900 shadow-[0px_2px_0px_0px_rgb(64,64,64)_inset]"></div>
                <div className="size-40 shrink-0 rounded-3xl bg-neutral-900 shadow-[0px_2px_0px_0px_rgb(64,64,64)_inset]"></div>
                <div className="size-40 shrink-0 rounded-3xl bg-neutral-900 shadow-[0px_2px_0px_0px_rgb(64,64,64)_inset]"></div>
            </div>

            {/* Decorative Grid - Layer 2 (with opacity) */}
            <div className="absolute -top-0 -right-10 z-20 grid rotate-45 transform grid-cols-4 gap-32 opacity-50">
                <div className="size-40 shrink-0 rounded-3xl bg-neutral-900 shadow-[0px_2px_0px_0px_rgb(64,64,64)_inset]"></div>
                <div className="size-40 shrink-0 rounded-3xl bg-neutral-900 shadow-[0px_2px_0px_0px_rgb(64,64,64)_inset]"></div>
                <div className="size-40 shrink-0 rounded-3xl bg-neutral-900 shadow-[0px_2px_0px_0px_rgb(64,64,64)_inset]"></div>
                <div className="size-40 shrink-0 rounded-3xl bg-neutral-900 shadow-[0px_2px_0px_0px_rgb(64,64,64)_inset]"></div>
            </div>

            {/* Blur Effect */}
            <div className="absolute inset-0 z-30 h-full w-full bg-gradient-to-t from-black via-black/50 to-transparent blur-3xl"></div>
        </div>
    );
}

