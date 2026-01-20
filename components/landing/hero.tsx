"use client";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";

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

    // Loop to create 31 images from 4 base images
    const images = Array.from({ length: 32 }, (_, i) =>
        baseMangaImages[i % baseMangaImages.length]
    );

    return (
        <div className="mx-auto my-10 rounded-3xl bg-gray-950/5 p-2 ring-1 ring-neutral-700/10 dark:bg-neutral-800">
            <ThreeDMarquee images={images} />
        </div>
    );
}
