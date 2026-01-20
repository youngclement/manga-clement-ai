"use client";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { motion } from "framer-motion";
import {
  Palette,
  Pencil,
  Layout,
  Image,
  FileText,
  Sparkles,
  Layers,
  Zap,
} from "lucide-react";

const features = [
  {
    title: "Multiple Art Styles",
    description: "Choose from Shonen, Shoujo, Seinen, Josei, and more. Each style brings unique character designs and visual storytelling.",
    icon: <Sparkles className="w-6 h-6 text-amber-500" />,
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
        <div className="flex items-center justify-center w-full">
          <div className="grid grid-cols-3 gap-2 p-4">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="w-12 h-12 rounded bg-gradient-to-br from-amber-400 to-orange-500"
              />
            ))}
          </div>
        </div>
      </div>
    ),
    className: "md:col-span-2",
  },
  {
    title: "Professional Inking",
    description: "Apply G-Pen, Brush, Digital, Calligraphy, and other inking techniques for authentic manga feel.",
    icon: <Pencil className="w-6 h-6 text-blue-500" />,
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <motion.path
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            d="M 10 50 Q 50 10 100 50 T 190 50"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    title: "Dynamic Layouts",
    description: "Single, Double, Triple, Grid, and Dramatic Spread panel layouts to tell your story perfectly.",
    icon: <Layout className="w-6 h-6 text-purple-500" />,
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 p-4">
        <div className="grid grid-cols-2 gap-2 w-full">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-purple-500/30 rounded"
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-purple-500/30 rounded row-span-2"
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-purple-500/30 rounded"
          />
        </div>
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    title: "Screentone Effects",
    description: "Add professional depth with adjustable screentone density for realistic shadows and textures.",
    icon: <Layers className="w-6 h-6 text-green-500" />,
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(34, 197, 94, 0.1) 10px, rgba(34, 197, 94, 0.1) 20px)',
        }} />
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    title: "Color & Black/White",
    description: "Create stunning full-color illustrations or stick to classic black and white manga aesthetics.",
    icon: <Palette className="w-6 h-6 text-pink-500" />,
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg overflow-hidden">
        <div className="w-1/2 bg-gradient-to-br from-pink-500 to-rose-500" />
        <div className="w-1/2 bg-gradient-to-br from-zinc-700 to-zinc-900" />
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    title: "AI-Powered Generation",
    description: "State-of-the-art AI technology brings your creative vision to life with stunning accuracy and detail.",
    icon: <Zap className="w-6 h-6 text-yellow-500" />,
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/20 items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Zap className="w-12 h-12 text-yellow-500" />
        </motion.div>
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    title: "Export to PDF",
    description: "Save and print your manga projects as professional-quality PDFs ready for publishing.",
    icon: <FileText className="w-6 h-6 text-red-500" />,
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 items-center justify-center">
        <FileText className="w-16 h-16 text-red-500/50" />
      </div>
    ),
    className: "md:col-span-1",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h2 className="font-sans text-4xl md:text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            Powerful Features
          </h2>
          <p className="text-lg text-zinc-400">
            Everything you need to create professional manga artwork with AI
          </p>
        </motion.div>

        <BentoGrid className="max-w-7xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <BentoGridItem
                title={feature.title}
                description={feature.description}
                header={feature.header}
                icon={feature.icon}
                className={feature.className}
              />
            </motion.div>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
