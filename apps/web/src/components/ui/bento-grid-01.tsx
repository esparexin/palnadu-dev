"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Smartphone, Globe } from "lucide-react";

function TypeTester() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setScale((prev) => (prev === 1 ? 1.5 : 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full">
      <motion.span
        className="font-serif text-6xl md:text-8xl text-white font-medium"
        animate={{ scale }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        Aa
      </motion.span>
    </div>
  );
}

function LayoutAnimation() {
  const [layout, setLayout] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLayout((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const layouts = ["grid-cols-2", "grid-cols-3", "grid-cols-1"];

  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        className={`grid ${layouts[layout]} gap-1.5 w-full max-w-[140px] h-full`}
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

function SpeedIndicator() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
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
              className="text-3xl md:text-4xl font-sans font-medium text-white"
            >
              100ms
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className="text-sm text-gray-400 font-mono">Load Time</span>
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
    <div className="flex items-center justify-center h-full gap-2">
      {shields.map((shield) => (
        <motion.div
          key={shield.id}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
            shield.active ? "bg-palnadu-teal/20 border border-palnadu-teal/40" : "bg-white/5 border border-white/10"
          }`}
          animate={{ scale: shield.active ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Lock className={`w-5 h-5 ${shield.active ? "text-palnadu-teal" : "text-gray-500"}`} />
        </motion.div>
      ))}
    </div>
  );
}

function GlobalNetwork() {
  const [pulses] = useState([0, 1, 2, 3, 4]);

  return (
    <div className="flex items-center justify-center h-full relative">
      <Globe className="w-16 h-16 text-white/80 z-10" />
      {pulses.map((pulse) => (
        <motion.div
          key={pulse}
          className="absolute w-16 h-16 border-2 border-palnadu-teal/40 rounded-full"
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: pulse * 0.8,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export function BentoGrid01() {
  return (
    <section className="bg-palnadu-dark px-4 sm:px-8 md:px-12 lg:px-16 py-16 sm:py-20 lg:py-24 text-white">
      <div className="max-w-7xl w-full mx-auto space-y-8">
        <div className="max-w-2xl text-left space-y-1.5">
          <motion.p
            className="text-palnadu-teal text-xs font-mono uppercase tracking-widest font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Capabilities & Polish
          </motion.p>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Engineered Down To Every Pixel.
          </h2>
          <p className="text-sm text-gray-300">
            Interactive, responsive, and performance-tuned components running in production.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
          
          {/* 1. Typography - Tall (2x2) */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
          >
            <div className="flex-1">
              <TypeTester />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-lg text-white">Typography</h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Beautiful, responsive type that scales perfectly.</p>
            </div>
          </motion.div>

          {/* 2. Layouts - Standard (2x1) */}
          <motion.div
            className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1">
              <LayoutAnimation />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-lg text-white">Layouts</h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Flexible grids that adapt smoothly.</p>
            </div>
          </motion.div>

          {/* 3. Global Network - Tall (2x2) */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <GlobalNetwork />
              </div>
            </div>
            <div className="mt-auto relative z-20 bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-palnadu-teal" />
                Global Edge CDN
              </h3>
              <p className="text-gray-300 text-xs mt-1">Lightning-fast content delivery worldwide with edge locations.</p>
            </div>
          </motion.div>

          {/* 4. Speed - Standard (2x1) */}
          <motion.div
            className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1">
              <SpeedIndicator />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-lg text-white">Speed</h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Blazing fast performance.</p>
            </div>
          </motion.div>

          {/* 5. Security - Wide (3x1) */}
          <motion.div
            className="md:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1">
              <SecurityBadge />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-palnadu-teal" />
                Security First
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Enterprise-grade encryption and data protection built-in.</p>
            </div>
          </motion.div>

          {/* 6. Mobile Responsive - Wide (3x1) */}
          <motion.div
            className="md:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col hover:border-palnadu-teal/50 transition-colors cursor-pointer overflow-hidden backdrop-blur-xs"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 0.99 }}
          >
            <div className="flex-1 flex items-center justify-center">
              <Smartphone className="w-14 h-14 text-white/90" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-lg text-white">Mobile Ready</h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Optimized for all devices and touch targets.</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

export default BentoGrid01;
