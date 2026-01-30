"use client";

import React from "react";
import { HolographicCard } from "@/components/ui/holographic-card";

export function HolographicShowcaseSection() {
  return (
    <section className="my-16 px-4">
      <div className="mb-8 text-center">
        <h2
          className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Holographic Character Cards
        </h2>
        <p className="mt-2 font-manga text-2xl sm:text-3xl text-zinc-50">
          Preview your characters in collectible-style hologram cards.
        </p>
        <p
          className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Hover to reveal alternate art and subtle holographic lighting, perfect
          for showcasing key scenes or character variants.
        </p>
      </div>

      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-6">
        <HolographicCard
          id="manga-card-1"
          imageSrc="/demo-img/demoimg1.png"
          hoverImageSrc="/demo-img/demoimg2.png"
          width={260}
          height={380}
          topText="旅"
          bottomText="創世"
          borderWidth={1}
          borderColor="rgba(255,255,255,0.1)"
          topTextHoverColor="#FBE75F"
          bottomTextHoverColor="#FBE75F"
        />

        <HolographicCard
          id="manga-card-2"
          imageSrc="/demo-img/demoimg3.png"
          hoverImageSrc="/demo-img/demoimg4.png"
          width={260}
          height={380}
          topText="旅"
          bottomText="創世"
          borderWidth={1}
          borderColor="rgba(255,255,255,0.1)"
          topTextHoverColor="#FBE75F"
          bottomTextHoverColor="#FBE75F"
        />

        <HolographicCard
          id="manga-card-3"
          imageSrc="/demo-img/demoimg5.png"
          hoverImageSrc="/demo-img/demoimg6.png"
          width={260}
          height={380}
          topText="旅"
          bottomText="創世"
          borderWidth={1}
          borderColor="rgba(255,255,255,0.1)"
          topTextHoverColor="#FBE75F"
          bottomTextHoverColor="#FBE75F"
        />
      </div>
    </section>
  );
}


