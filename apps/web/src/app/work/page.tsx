"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Palette, Puzzle, Lock, Smartphone, Globe, ArrowRight } from "lucide-react";

// ── 1. ANIMATED BOX COMPONENT: TYPOGRAPHY (Aa Scaling) ──
function TypeTester() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setScale((prev) => (prev === 1 ? 1.4 : 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full py-4">
      <motion.span
        className="font-serif text-6xl md:text-8xl text-white font-medium select-none"
        animate={{ scale }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        Aa
      </motion.span>
    </div>
  );
}

// ── 2. ANIMATED BOX COMPONENT: DYNAMIC LAYOUTS ──
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
    <div className="h-full flex items-center justify-center py-2">
      <motion.div
        className={`grid ${layouts[layout]} gap-1.5 w-full max-w-[140px]`}
        layout
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="bg-white/20 rounded-md h-5 w-full"
            layout
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ── 3. ANIMATED BOX COMPONENT: LIVE SPEED METER (100ms) ──
function SpeedIndicator() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-2">
      <div className="h-10 flex items-center justify-center overflow-hidden relative w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              className="h-8 w-24 bg-white/10 rounded"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              exit={{ opacity: 0, y: -20, position: "absolute" }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ) : (
            <motion.span
              key="text"
              initial={{ y: 20, opacity: 0, filter: "blur(5px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              className="text-3xl md:text-4xl font-mono font-bold text-palnadu-teal"
            >
              100ms
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Load Time</span>
      <div className="w-full max-w-[120px] h-1.5 bg-white/10 rounded-full overflow-hidden">
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

// ── 4. ANIMATED BOX COMPONENT: SECURITY SHIELDS ──
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
    <div className="flex items-center justify-center h-full gap-2.5 py-2">
      {shields.map((shield) => (
        <motion.div
          key={shield.id}
          className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${
            shield.active ? "bg-palnadu-teal/20 border border-palnadu-teal/50" : "bg-white/5 border border-white/10"
          }`}
          animate={{ scale: shield.active ? 1.08 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Lock className={`w-5 h-5 ${shield.active ? "text-palnadu-teal" : "text-gray-500"}`} />
        </motion.div>
      ))}
    </div>
  );
}

// ── 5. ANIMATED BOX COMPONENT: GLOBAL NETWORK RADAR ──
function GlobalNetwork() {
  const [pulses] = useState([0, 1, 2, 3]);

  return (
    <div className="flex items-center justify-center h-full relative py-4">
      <Globe className="w-16 h-16 text-white/90 z-10" />
      {pulses.map((pulse) => (
        <motion.div
          key={pulse}
          className="absolute w-16 h-16 border-2 border-palnadu-teal/40 rounded-full pointer-events-none"
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2.8, opacity: 0 }}
          transition={{
            duration: 2.6,
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
    title: "Beautifully Designed Components",
    description: "Modern, pixel-perfect UI components ready for any project.",
    accent: "text-palnadu-teal",
    bg: "bg-teal-50",
  },
  {
    icon: Puzzle,
    title: "Plug-and-Play Integration",
    description: "Simple setup with support for React, Next.js, and Tailwind CSS.",
    accent: "text-palnadu-dark",
    bg: "bg-palnadu-off-white",
  },
];

export default function WorkPage() {
  return (
    <div className="w-full bg-palnadu-dark text-white">
      {/* ── ONE UNIFIED SECTION WITH ANIMATED BOXES ── */}
      <section className="relative px-4 sm:px-8 md:px-12 lg:px-16 pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden w-full max-w-7xl mx-auto space-y-12 sm:space-y-16">
        
        {/* 1. HEADER */}
        <div className="max-w-4xl mx-auto text-center space-y-3 sm:space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-teal font-bold">
            About our apps
          </p>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.14]">
            A visual collection of our most recent works
            <span className="block text-lg sm:text-2xl lg:text-3xl font-normal text-gray-300 mt-2 sm:mt-3">
              — each piece crafted with intention, emotion and style.
            </span>
          </h1>
        </div>

        {/* 2. THREE PILLARS (Speed, Design, Integration) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {appPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-5 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xs hover:border-palnadu-teal/50 hover:bg-white/[0.08] transition-all space-y-3 text-left"
              >
                <div
                  className={`h-10 w-10 rounded-lg ${pillar.bg} ${pillar.accent} flex items-center justify-center shadow-2xs`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. THE ANIMATED BOXES BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
          
          {/* Box 1: Typography - Tall (2x2) */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
          >
            <div className="flex-1 flex items-center justify-center">
              <TypeTester />
            </div>
            <div className="mt-2">
              <h3 className="font-bold text-lg text-white">Typography</h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Beautiful, responsive type that scales perfectly.</p>
            </div>
          </motion.div>

          {/* Box 2: Layouts - Standard (2x1) */}
          <motion.div
            className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <LayoutAnimation />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Layouts</h3>
              <p className="text-gray-400 text-xs mt-0.5">Flexible grids that adapt smoothly.</p>
            </div>
          </motion.div>

          {/* Box 3: Global Network - Tall (2x2) */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <GlobalNetwork />
            </div>
            <div className="mt-auto bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-palnadu-teal" />
                Global Edge CDN
              </h3>
              <p className="text-gray-300 text-xs mt-0.5">Lightning-fast content delivery worldwide with edge locations.</p>
            </div>
          </motion.div>

          {/* Box 4: Speed - Standard (2x1) */}
          <motion.div
            className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <SpeedIndicator />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Speed</h3>
              <p className="text-gray-400 text-xs mt-0.5">Blazing fast performance.</p>
            </div>
          </motion.div>

          {/* Box 5: Security - Wide (3x1) */}
          <motion.div
            className="md:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <SecurityBadge />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-palnadu-teal" />
                Security First
              </h3>
              <p className="text-gray-400 text-xs mt-0.5">Enterprise-grade encryption and data protection built-in.</p>
            </div>
          </motion.div>

          {/* Box 6: Mobile Ready - Wide (3x1) */}
          <motion.div
            className="md:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <Smartphone className="w-12 h-12 text-white/90" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Mobile Ready</h3>
              <p className="text-gray-400 text-xs mt-0.5">Optimized for all devices and touch targets.</p>
            </div>
          </motion.div>

        </div>

        {/* 4. SEAMLESS BOTTOM CONSULTATION CTA */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 sm:p-10 text-center space-y-4 max-w-3xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-teal font-bold">
            Get Started
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Have an idea or need to build a practical application?
          </h2>
          <p className="text-sm text-gray-300 max-w-lg mx-auto">
            Work directly with our senior developers. We evaluate technical feasibility, estimate realistic costs, and engineer what works.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md font-semibold text-sm bg-palnadu-teal text-white hover:bg-[#157c5c] shadow-xs transition-colors"
            >
              <span>Tell Us What You Want To Build</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </section>
    </div>
  );
}
