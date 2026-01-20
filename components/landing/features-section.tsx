"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      title: "AI-Powered Manga Generation",
      description:
        "Generate professional manga pages in seconds. Just describe your scene and watch it come to life.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800",
    },
    {
      title: "Character Consistency",
      description:
        "Keep your characters consistent across all pages with our Context feature. Define once, use forever.",
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 lg:col-span-2 dark:border-neutral-800",
    },
    {
      title: "Multiple Manga Styles",
      description:
        "Choose from various manga styles: Shonen, Seinen, Shoujo, and more. Customize everything from inking to screentones.",
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 lg:col-span-3 lg:border-r dark:border-neutral-800",
    },
    {
      title: "Session & PDF Export",
      description:
        "Organize your work in sessions and export to professional PDF. Perfect for creating complete manga chapters.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-none",
    },
  ];

  return (
    <div className="relative z-20 py-10 lg:py-40 max-w-7xl mx-auto">
      <div className="px-8">
        <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-manga text-zinc-200">
          Everything You Need to Create Manga
        </h4>

        <p className="text-sm lg:text-base max-w-2xl my-4 mx-auto text-zinc-400 text-center font-normal">
          From character design to final PDF export, our AI-powered studio has
          all the tools you need to bring your manga stories to life.
        </p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-6 mt-12 xl:border rounded-md dark:border-neutral-800">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn(`p-4 sm:p-8 relative overflow-hidden`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="max-w-5xl mx-auto text-left tracking-tight text-zinc-200 text-xl md:text-2xl md:leading-snug font-bold">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={cn(
        "text-sm md:text-base max-w-4xl text-left mx-auto",
        "text-zinc-500 font-normal",
        "text-left max-w-sm mx-0 md:text-sm my-2"
      )}
    >
      {children}
    </p>
  );
};

// AI Generation Video
export const SkeletonOne = () => {
  return (
    <div className="relative flex py-8 px-2 gap-10 h-200">
      <a
        href="https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full p-5 mx-auto bg-zinc-900/50 shadow-lg group h-full rounded-lg border border-zinc-800 hover:border-amber-500 transition-all cursor-pointer"
      >
        <div className="flex flex-1 w-full h-full flex-col space-y-4 relative">
          <img
            src="/demo-img/demoimg1.png"
            alt="Manga generation demo"
            className="h-full w-full object-cover rounded-lg group-hover:opacity-75 transition-opacity"
          />
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </div>
          </div>
        </div>
      </a>

      <div className="absolute bottom-0 z-40 inset-x-0 h-60 bg-gradient-to-t from-black via-black to-transparent w-full pointer-events-none" />
      <div className="absolute top-0 z-40 inset-x-0 h-60 bg-gradient-to-b from-black via-transparent to-transparent w-full pointer-events-none" />
    </div>
  );
};

// Character Consistency Demo
export const SkeletonTwo = () => {
  return (
    <div className="relative flex flex-col items-center justify-center p-8 gap-8 h-full overflow-hidden">
      {/* Top Row - 2 overlapping images */}
      <div className="relative w-full h-[45%]">
        <div className="absolute left-[5%] top-0 w-[45%] h-full transform -rotate-6 transition-transform hover:rotate-0 hover:scale-105 duration-300">
          <img
            src="/demo-img/demoimg1.png"
            alt="Character example 1"
            className="w-full h-full object-cover rounded-xl shadow-2xl border-4 border-white/10"
          />
        </div>
        <div className="absolute right-[5%] top-0 w-[45%] h-full transform rotate-6 transition-transform hover:rotate-0 hover:scale-105 duration-300 z-10">
          <img
            src="/demo-img/demoimg2.png"
            alt="Character example 2"
            className="w-full h-full object-cover rounded-xl shadow-2xl border-4 border-white/10"
          />
        </div>
      </div>

      {/* Bottom Row - 2 overlapping images */}
      <div className="relative w-full h-[45%]">
        <div className="absolute left-[5%] bottom-0 w-[45%] h-full transform rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-300">
          <img
            src="/demo-img/demoimg3.png"
            alt="Character example 3"
            className="w-full h-full object-cover rounded-xl shadow-2xl border-4 border-white/10"
          />
        </div>
        <div className="absolute right-[5%] bottom-0 w-[45%] h-full transform -rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-300 z-10">
          <img
            src="/demo-img/demoimg4.png"
            alt="Character example 4"
            className="w-full h-full object-cover rounded-xl shadow-2xl border-4 border-white/10"
          />
        </div>
      </div>

      <div className="absolute left-0 z-[100] inset-y-0 w-20 bg-gradient-to-r from-black to-transparent h-full pointer-events-none" />
      <div className="absolute right-0 z-[100] inset-y-0 w-20 bg-gradient-to-l from-black to-transparent h-full pointer-events-none" />
    </div>
  );
};

// Multiple Styles Showcase - 5 images
export const SkeletonThree = () => {
  return (
    <div className="relative flex gap-3 h-full group/styles p-4">
      <div className="grid grid-cols-3 gap-3 w-full h-full">
        {/* Top row - 3 images */}
        <img
          src="/demo-img/demoimg1.png"
          alt="Shonen style"
          className="w-full h-full object-cover rounded-lg border border-zinc-800 hover:border-amber-500 transition-all"
        />
        <img
          src="/demo-img/demoimg2.png"
          alt="Seinen style"
          className="w-full h-full object-cover rounded-lg border border-zinc-800 hover:border-amber-500 transition-all"
        />
        <img
          src="/demo-img/demoimg3.png"
          alt="Shoujo style"
          className="w-full h-full object-cover rounded-lg border border-zinc-800 hover:border-amber-500 transition-all"
        />
        {/* Bottom row - 2 images centered */}
        <img
          src="/demo-img/demoimg4.png"
          alt="Kodomo style"
          className="w-full h-full object-cover rounded-lg border border-zinc-800 hover:border-amber-500 transition-all col-start-1"
        />
        <img
          src="/demo-img/demoimg5.png"
          alt="Josei style"
          className="w-full h-full object-cover rounded-lg border border-zinc-800 hover:border-amber-500 transition-all"
        />
      </div>
    </div>
  );
};

// Session & PDF Export
export const SkeletonFour = () => {
  return (
    <div className="h-60 md:h-60 flex flex-col items-center justify-center relative bg-transparent mt-10 p-8">
      <div className="relative w-full h-full">
        <div className="grid grid-cols-2 gap-3 h-full">
          <img
            src="/demo-img/demoimg5.png"
            alt="Session pages"
            className="w-full h-full object-cover rounded-lg border border-zinc-800"
          />
          <img
            src="/demo-img/demoimg6.png"
            alt="PDF export"
            className="w-full h-full object-cover rounded-lg border border-zinc-800"
          />
        </div>
      </div>
    </div>
  );
};

