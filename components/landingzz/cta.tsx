"use client";

import React from 'react';
import { MovingBorderButton } from '@/components/ui/moving-border';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Rocket, Sparkles, ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 pointer-events-none" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-amber-500/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-semibold">
                Start Your Journey Today
              </span>
            </motion.div>

            <h2 className="font-sans text-4xl md:text-6xl font-bold text-white">
              Ready to Create Your{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Masterpiece
              </span>
              ?
            </h2>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
              Join thousands of manga creators using AI to bring their stories to life. No experience needed, just your imagination.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Link href="/studio">
                <MovingBorderButton
                  borderRadius="1rem"
                  className="bg-zinc-950 text-white border-zinc-800 font-bold text-lg px-8"
                  containerClassName="h-16 w-64"
                  borderClassName="bg-[radial-gradient(var(--amber-500)_40%,transparent_60%)]"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Creating Free
                </MovingBorderButton>
              </Link>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="#features"
                  className="inline-flex items-center gap-2 px-8 h-16 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:bg-zinc-800 text-white font-semibold text-lg transition-all group"
                >
                  Learn More
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              viewport={{ once: true }}
              className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  <CountUpAnimation value={10000} />+
                </div>
                <div className="text-zinc-400 text-sm">Manga Pages Created</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  <CountUpAnimation value={5000} />+
                </div>
                <div className="text-zinc-400 text-sm">Active Creators</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  <CountUpAnimation value={50} />+
                </div>
                <div className="text-zinc-400 text-sm">Art Styles</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CountUpAnimation({ value }: { value: number }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count.toLocaleString()}</span>;
}
