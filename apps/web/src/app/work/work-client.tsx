"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Palette, Puzzle, Lock, Smartphone, Globe, ArrowRight } from "lucide-react";

// ── 1. ANIMATED BOX: TYPOGRAPHY (Aa Scaling) ──
function TypeTester() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setScale((prev) => (prev === 1 ? 1.3 : 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full">
      <motion.span
        className="font-serif text-4xl sm:text-6xl md:text-7xl text-white font-medium select-none"
        animate={{ scale }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        Aa
      </motion.span>
    </div>
  );
}

// ── 2. ANIMATED BOX: DYNAMIC LAYOUTS ──
function LayoutAnimation() {
  const [layout, setLayout] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLayout((prev) => (prev + 1) % 3);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const layouts = ["grid-cols-2", "grid-cols-3", "grid-cols-1"];

  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        className={`grid ${layouts[layout]} gap-1 w-full max-w-[90px] sm:max-w-[130px]`}
        layout
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="bg-white/20 rounded-md h-3.5 sm:h-5 w-full"
            layout
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ── 3. ANIMATED BOX: LIVE SPEED METER (100ms) ──
function SpeedIndicator() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1.5 sm:gap-2.5">
      <div className="h-7 sm:h-9 flex items-center justify-center overflow-hidden relative w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              className="h-6 w-16 sm:h-8 sm:w-20 bg-white/10 rounded"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              exit={{ opacity: 0, y: -15, position: "absolute" }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ) : (
            <motion.span
              key="text"
              initial={{ y: 15, opacity: 0, filter: "blur(5px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              className="text-xl sm:text-3xl md:text-4xl font-mono font-bold text-palnadu-teal"
            >
              100ms
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className="text-[10px] sm:text-xs text-gray-400 font-mono uppercase tracking-wider">Load Time</span>
      <div className="w-full max-w-[80px] sm:max-w-[110px] h-1 sm:h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-palnadu-teal rounded-full"
          initial={{ width: 0 }}
          animate={{ width: loading ? 0 : "100%" }}
          transition={{ type: "spring", stiffness: 100, damping: 15, mass: 1 }}
        />
      </div>
    </div>
  );
}

// ── 4. ANIMATED BOX: SECURITY SHIELDS ──
function SecurityBadge() {
  const [shields, setShields] = useState([
    { id: 1, active: false },
    { id: 2, active: false },
    { id: 3, active: false },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShields((prev) => {
        const nextIndex = prev.findIndex((s) => !s.active);
        if (nextIndex === -1) {
          return prev.map(() => ({ id: Math.random(), active: false }));
        }
        return prev.map((s, i) => (i === nextIndex ? { ...s, active: true } : s));
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full gap-1.5 sm:gap-2.5">
      {shields.map((shield) => (
        <motion.div
          key={shield.id}
          className={`w-8 h-8 sm:w-11 sm:h-11 rounded-md sm:rounded-lg flex items-center justify-center transition-colors ${
            shield.active ? "bg-palnadu-teal/20 border border-palnadu-teal/50" : "bg-white/5 border border-white/10"
          }`}
          animate={{ scale: shield.active ? 1.08 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Lock className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${shield.active ? "text-palnadu-teal" : "text-gray-500"}`} />
        </motion.div>
      ))}
    </div>
  );
}

// ── 5. ANIMATED BOX: GLOBAL NETWORK RADAR ──
function GlobalNetwork() {
  const [pulses] = useState([0, 1, 2]);

  return (
    <div className="flex items-center justify-center h-full relative">
      <Globe className="w-10 h-10 sm:w-14 sm:h-14 text-white/90 z-10" />
      {pulses.map((pulse) => (
        <motion.div
          key={pulse}
          className="absolute w-10 h-10 sm:w-14 sm:h-14 border border-palnadu-teal/40 rounded-full pointer-events-none"
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: pulse * 0.7,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ── 3 CORE ARCHITECTURAL PILLARS ──
const appPillars = [
  {
    icon: Zap,
    title: "Lightning-Fast Performance",
    description: "Built with speed — minimal load times and optimized.",
    accent: "text-palnadu-blue",
    bg: "bg-palnadu-light-blue",
  },
  {
    icon: Palette,
    title: "Beautifully Designed",
    description: "Modern, pixel-perfect UI components ready for any project.",
    accent: "text-palnadu-teal",
    bg: "bg-teal-50",
  },
  {
    icon: Puzzle,
    title: "Plug-and-Play",
    description: "Simple setup with support for React, Next.js, and Tailwind CSS.",
    accent: "text-palnadu-dark",
    bg: "bg-palnadu-off-white",
  },
];

export function WorkClient() {
  return (
    <div className="w-full bg-palnadu-dark text-white">
      {/* ── ONE UNIFIED SECTION WITH COMPACT ANIMATED BOXES ── */}
      <section className="relative px-3.5 sm:px-8 md:px-12 lg:px-16 pt-10 pb-14 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden w-full max-w-7xl mx-auto space-y-8 sm:space-y-14">
        
        {/* 1. HEADER */}
        <div className="max-w-4xl mx-auto text-center space-y-2.5 sm:space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-teal">
            Portfolio and Case Studies
          </p>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Software Solutions Built for Real-World Operations
          </h1>
          <p className="text-sm sm:text-base lg:text-lg font-normal text-gray-300 max-w-2xl mx-auto leading-relaxed">
            From high-speed web platforms to mobile applications and automated dispatch systems, explore practical technology engineered for growing businesses across Andhra Pradesh.
          </p>
        </div>

        {/* 2. THREE PILLARS (Compact 3-Column on Mobile & Desktop) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-5">
          {appPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-3 sm:p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xs hover:border-palnadu-teal/50 transition-all text-center flex flex-col items-center justify-center space-y-1 sm:space-y-2"
              >
                <div
                  className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg ${pillar.bg} ${pillar.accent} flex items-center justify-center shadow-2xs shrink-0`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-[11px] sm:text-sm text-white leading-tight">
                    {pillar.title}
                  </h3>
                  <p className="hidden sm:block text-xs text-gray-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. THE ANIMATED BOXES: 2-COLUMN ON MOBILE | 6-COLUMN ON DESKTOP */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 sm:gap-4 md:auto-rows-[190px]">
          
          {/* Box 1: Typography */}
          <motion.div
            className="col-span-1 md:col-span-2 md:row-span-2 h-[140px] md:h-auto bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <TypeTester />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-base text-white">Typography</h3>
              <p className="hidden sm:block text-gray-400 text-xs mt-0.5">Responsive type that scales.</p>
            </div>
          </motion.div>

          {/* Box 2: Speed */}
          <motion.div
            className="col-span-1 md:col-span-2 h-[140px] md:h-auto bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <SpeedIndicator />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-base text-white">Speed</h3>
              <p className="hidden sm:block text-gray-400 text-xs mt-0.5">Blazing fast performance.</p>
            </div>
          </motion.div>

          {/* Box 3: Layouts */}
          <motion.div
            className="col-span-1 md:col-span-2 h-[140px] md:h-auto bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <LayoutAnimation />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-base text-white">Layouts</h3>
              <p className="hidden sm:block text-gray-400 text-xs mt-0.5">Grids that adapt smoothly.</p>
            </div>
          </motion.div>

          {/* Box 4: Security */}
          <motion.div
            className="col-span-1 md:col-span-3 h-[140px] md:h-auto bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <SecurityBadge />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-base text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-palnadu-teal" />
                Security First
              </h3>
              <p className="hidden sm:block text-gray-400 text-xs mt-0.5">Enterprise data protection.</p>
            </div>
          </motion.div>

          {/* Box 5: Global CDN */}
          <motion.div
            className="col-span-1 md:col-span-2 md:row-span-2 h-[140px] md:h-auto bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <GlobalNetwork />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-base text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-palnadu-teal" />
                Global CDN
              </h3>
              <p className="hidden sm:block text-gray-300 text-xs mt-0.5">Worldwide edge delivery.</p>
            </div>
          </motion.div>

          {/* Box 6: Mobile Ready */}
          <motion.div
            className="col-span-1 md:col-span-3 h-[140px] md:h-auto bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <Smartphone className="w-8 h-8 sm:w-11 sm:h-11 text-white/90" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-base text-white">Mobile Ready</h3>
              <p className="hidden sm:block text-gray-400 text-xs mt-0.5">Optimized for touch screens.</p>
            </div>
          </motion.div>

        </div>

        {/* 4. SEAMLESS BOTTOM CONSULTATION CTA */}
        <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-10 text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-teal font-bold">
            Get Started
          </p>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
            Have an idea or need to build a practical application?
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto">
            Work directly with our senior developers. We evaluate technical feasibility, estimate realistic costs, and engineer what works.
          </p>
          <div className="pt-1.5">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 rounded-md font-semibold text-xs sm:text-sm bg-palnadu-teal text-white hover:bg-[#157c5c] shadow-xs transition-colors"
            >
              <span>Tell Us What You Want To Build</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>
        </div>

      </section>
    </div>
  );
}

export default WorkClient;
