"use client";

import { motion } from "framer-motion";
import { CardContainer, CardBody, CardItem } from "@/components/ui/card-3d";
import { Spotlight } from "@/components/ui/spotlight";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";

export function Showcase() {
  return (
    <section className="py-20 md:py-32 bg-zinc-900 relative overflow-hidden">
      <Spotlight
        className="top-10 left-full"
        fill="rgb(59, 130, 246)"
      />
      <Spotlight
        className="top-28 left-0"
        fill="rgb(168, 85, 247)"
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h2 className="font-sans text-4xl md:text-6xl font-bold text-white mb-4">
            See It In Action
          </h2>
          <p className="text-lg text-zinc-400">
            Experience the power of AI-driven manga creation
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {showcaseItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <CardContainer className="inter-var">
                <CardBody className="bg-zinc-950 relative group/card border-zinc-800 border w-auto sm:w-[20rem] h-auto rounded-xl p-6">
                  <CardItem
                    translateZ="50"
                    className="text-xl font-bold text-white"
                  >
                    {item.title}
                  </CardItem>
                  <CardItem
                    as="p"
                    translateZ="60"
                    className="text-zinc-400 text-sm max-w-sm mt-2"
                  >
                    {item.description}
                  </CardItem>
                  <CardItem translateZ="100" className="w-full mt-4">
                    <div className={`w-full h-48 rounded-lg ${item.gradient} flex items-center justify-center`}>
                      <span className="text-6xl">{item.icon}</span>
                    </div>
                  </CardItem>
                  <div className="flex justify-between items-center mt-6">
                    <CardItem
                      translateZ={20}
                      className="flex items-center gap-1 text-amber-500 text-sm"
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-500" />
                      ))}
                    </CardItem>
                    <CardItem
                      translateZ={20}
                      as={Link}
                      href="/studio"
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center gap-1"
                    >
                      Try Now
                      <ArrowRight className="w-3 h-3" />
                    </CardItem>
                  </div>
                </CardBody>
              </CardContainer>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const showcaseItems = [
  {
    title: "Shonen Action",
    description: "Dynamic poses, intense expressions, and powerful energy effects",
    icon: "⚡",
    gradient: "bg-gradient-to-br from-orange-500/20 to-red-500/20",
  },
  {
    title: "Shoujo Romance",
    description: "Elegant characters, beautiful flowers, and sparkling backgrounds",
    icon: "🌸",
    gradient: "bg-gradient-to-br from-pink-500/20 to-rose-500/20",
  },
  {
    title: "Seinen Drama",
    description: "Realistic details, mature themes, and sophisticated compositions",
    icon: "🎭",
    gradient: "bg-gradient-to-br from-blue-500/20 to-purple-500/20",
  },
  {
    title: "Chibi Comedy",
    description: "Cute deformed characters perfect for humorous moments",
    icon: "😊",
    gradient: "bg-gradient-to-br from-yellow-500/20 to-amber-500/20",
  },
  {
    title: "Horror Atmosphere",
    description: "Dark shadows, eerie effects, and unsettling compositions",
    icon: "👻",
    gradient: "bg-gradient-to-br from-zinc-700/20 to-zinc-900/20",
  },
  {
    title: "Fantasy Adventure",
    description: "Magical effects, epic scenes, and fantastical creatures",
    icon: "🐉",
    gradient: "bg-gradient-to-br from-violet-500/20 to-purple-500/20",
  },
];


