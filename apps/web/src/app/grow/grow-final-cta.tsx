"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackConsultationRequest } from "@/lib/analytics";

export function GrowFinalCta() {
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCta(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <section className="relative w-full bg-palnadu-dark py-16 sm:py-24 border-t border-white/10 text-white text-center">
        <div className="container max-w-3xl mx-auto px-4 space-y-4">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-palnadu-teal">
            Start Growing Today
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ready to Turn Visibility Into Real Business?
          </h2>
          <p className="text-sm sm:text-base text-palnadu-light-blue/80 max-w-xl mx-auto leading-relaxed">
            Schedule a direct discovery consultation with our software engineers. We’ll analyze your digital presence, local search opportunities, and competitor landscape.
          </p>
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-palnadu-teal hover:bg-palnadu-teal-dark text-white font-bold px-8 h-12 text-base shadow-lg rounded-full"
            >
              <Link
                href="/contact"
                onClick={() =>
                  trackConsultationRequest({
                    cta_label: 'Contact Us',
                    source_section: 'grow_final_cta',
                    source_page: '/grow',
                    destination_url: '/contact',
                  })
                }
                className="flex items-center gap-2"
              >
                <span>Contact Us</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 font-semibold h-12 text-base rounded-full"
            >
              <Link href="/work">View Our Work</Link>
            </Button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showFloatingCta && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 hidden sm:block"
          >
            <Link
              href="/contact"
              onClick={() =>
                trackConsultationRequest({
                  cta_label: 'Contact Us',
                  source_section: 'grow_floating_cta',
                  source_page: '/grow',
                  destination_url: '/contact',
                })
              }
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-palnadu-blue text-white font-bold text-sm shadow-xl hover:bg-palnadu-dark-hover hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border border-white/20"
            >
              <span>Contact Us</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
