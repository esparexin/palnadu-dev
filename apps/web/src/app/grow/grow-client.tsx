"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Share2,
  Target,
  MapPin,
  Sparkles,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Users,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  Compass,
  Zap,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import MetroHero from "@/components/ui/scroll-locked-video-hero";
import { Button } from "@/components/ui/button";
import { StackingDeck, StackingSection } from "@/components/ui/stacking-card";
import { cn } from "@/lib/utils";

// ─── 1. GROWTH STAGES DATA ────────────────────────────────────
const growthStages = [
  {
    id: "visibility",
    tag: "Stage 01",
    shortTitle: "Visibility",
    title: "More Visibility",
    tagline: "Be Found When People Look",
    description:
      "Help your business get discovered by the people searching for what you offer across search engines, Google Maps, and local directories.",
    metrics: "Top 3 Regional Search Ranking",
    color: "from-blue-600/20 to-cyan-500/10",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Search,
    previewContent: {
      type: "search",
      headline: "Google Search & Regional Discovery",
      details: [
        { label: "Target Search Term", val: "Industrial electrical services in Narasaraopet" },
        { label: "Google Search Ranking", val: "#1 Organic Result" },
        { label: "Google Business Profile", val: "Verified local listing" },
      ],
    },
  },
  {
    id: "engagement",
    tag: "Stage 02",
    shortTitle: "Engagement",
    title: "More Engagement",
    tagline: "Connect With Clarity",
    description:
      "Build meaningful connections with your customers through the right digital channels, high-speed mobile pages, and clear, authoritative content.",
    metrics: "< 1s Mobile Page Load & Clean UI",
    color: "from-teal-600/20 to-emerald-500/10",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    icon: Users,
    previewContent: {
      type: "engagement",
      headline: "Customer Engagement & Experience",
      details: [
        { label: "Mobile Experience", val: "Fully responsive and sub-second loading" },
        { label: "Credibility Signals", val: "Verified project portfolio and credentials" },
        { label: "Mobile Engagement", val: "42% improvement in user retention" },
      ],
    },
  },
  {
    id: "enquiries",
    tag: "Stage 03",
    shortTitle: "Enquiries",
    title: "More Enquiries",
    tagline: "Attention That Converts",
    description:
      "Turn online visitors into genuine telephone calls, direct WhatsApp messages, and verified inquiries without broken contact forms.",
    metrics: "Direct WhatsApp & Phone Pipelines",
    color: "from-amber-600/20 to-orange-500/10",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: MessageSquare,
    previewContent: {
      type: "enquiries",
      headline: "Qualified Inflow of Inquiries",
      details: [
        { label: "Direct Inquiries", val: "One-tap WhatsApp and phone contact" },
        { label: "Inquiry Quality", val: "Verified commercial intent" },
        { label: "Response Window", val: "Targeted under 15 minutes" },
      ],
    },
  },
  {
    id: "growth",
    tag: "Stage 04",
    shortTitle: "Growth",
    title: "More Growth",
    tagline: "Compound Over Time",
    description:
      "Continuously improve your digital presence based on real performance data, refining marketing campaigns with verifiable business outcomes.",
    metrics: "Measurable Commercial Returns",
    color: "from-indigo-600/20 to-palnadu-blue/20",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: TrendingUp,
    previewContent: {
      type: "growth",
      headline: "Long-Term Commercial Presence",
      details: [
        { label: "Regional Visibility", val: "Leading share in target categories" },
        { label: "Customer Acquisition", val: "Consistent month-over-month leads" },
        { label: "Asset Ownership", val: "100% client-owned code and domains" },
      ],
    },
  },
];

// ─── 2. WHAT WE DO DATA ───────────────────────────────────────
const servicesList = [
  {
    icon: Share2,
    title: "Social Media Marketing",
    description:
      "Build a consistent, professional brand presence across social platforms with thoughtful content that genuinely engages customers.",
    focus: [
      "Structured content planning",
      "Consistent brand voice and messaging",
      "High-clarity visual communication",
      "Active customer engagement",
    ],
  },
  {
    icon: Search,
    title: "Search Engine Optimization",
    description:
      "Improve your search visibility so customers find your business when looking for your products or services in your area.",
    focus: [
      "Technical SEO and clean schema markup",
      "Fast Core Web Vitals performance",
      "Regional keyword authority",
      "Structured page content",
    ],
  },
  {
    icon: Target,
    title: "Online Advertising",
    description:
      "Reach the right customers with targeted search and social campaigns designed around your specific business goals, eliminating budget waste.",
    focus: [
      "Google Search intent-based ads",
      "Targeted social campaigns",
      "Dedicated, fast landing pages",
      "Transparent cost-per-lead tracking",
    ],
  },
  {
    icon: MapPin,
    title: "Local Digital Marketing",
    description:
      "Help nearby customers discover, understand, and visit your business through verified Google Maps and local business directories.",
    focus: [
      "Google Business Profile optimization",
      "Local directory citations and NAP consistency",
      "Review management guidance",
      "Regional and town-level targeting",
    ],
  },
  {
    icon: Sparkles,
    title: "Content & Creative",
    description:
      "Create clear, useful, and brand-aligned content that explains what your business offers without marketing buzzwords.",
    focus: [
      "Clear technical copywriting",
      "Product and service overviews",
      "Case studies and proof of work",
      "Professional brand photography guidance",
    ],
  },
  {
    icon: BarChart3,
    title: "Performance Tracking",
    description:
      "We look beyond vanity likes and impressions. We measure genuine customer activity and use those insights to guide the next step.",
    focus: [
      "Call and WhatsApp origin tracking",
      "Form submission telemetry",
      "Conversion tracking setup",
      "Clear, transparent monthly reports",
    ],
  },
];

// ─── 3. PROGRESSION PIPELINE STEPS ────────────────────────────
const pipelineSteps = [
  {
    number: "01",
    title: "Get Discovered",
    subtitle: "Search engines, Google Maps, and local directories",
    description:
      "Prospective customers search for solutions every day. We position your business directly in front of them when their buying intent is highest.",
    stat: "High Search Visibility",
  },
  {
    number: "02",
    title: "Build Trust",
    subtitle: "Fast mobile pages, clean design, and real credentials",
    description:
      "Visitors form opinions about your credibility in seconds. A clean, fast, professional digital presence validates your experience immediately.",
    stat: "Fast First Impression",
  },
  {
    number: "03",
    title: "Generate Enquiries",
    subtitle: "Frictionless paths to direct phone and WhatsApp contact",
    description:
      "No confusing navigation or lengthy forms. Simple, direct communication channels turn interested visitors into genuine prospects.",
    stat: "Direct Inflow",
  },
  {
    number: "04",
    title: "Gain Customers",
    subtitle: "Informed prospects who understand your value",
    description:
      "Because prospects understand what you offer before calling, your initial discussions focus on solutions rather than basic explanations.",
    stat: "Higher Close Rate",
  },
  {
    number: "05",
    title: "Compound Growth",
    subtitle: "Long-term presence and equity that compounds over time",
    description:
      "Every satisfied customer, positive review, and ranking improvement builds lasting digital value for your enterprise.",
    stat: "Sustainable Presence",
  },
];

// ─── 4. PILLARS DATA ──────────────────────────────────────────
const customPillars = [
  {
    title: "Your Customers",
    desc: "Understanding who your customers are, the problems they face, and the channels they use to make buying decisions.",
    icon: Users,
  },
  {
    title: "Your Location",
    desc: "Tailoring strategies to commercial patterns across Palnadu, Guntur, coastal Andhra, and regional business hubs.",
    icon: MapPin,
  },
  {
    title: "Your Competition",
    desc: "Analyzing regional competitors to identify underserved search terms, service gaps, and unique local advantages.",
    icon: Compass,
  },
  {
    title: "Your Business Goals",
    desc: "Aligning digital marketing with tangible commercial outcomes like wholesale enquiries, admissions, or service orders.",
    icon: Target,
  },
  {
    title: "Your Budget",
    desc: "Deploying resources deliberately where they generate the highest measurable commercial return without waste.",
    icon: Zap,
  },
];

// ─── 5. FOUR FOUNDATIONAL WORDS ───────────────────────────────
const methodology = [
  {
    step: "01",
    word: "Strategy",
    summary: "A practical roadmap based on your audience, competitor gaps, and commercial objectives.",
  },
  {
    step: "02",
    word: "Execution",
    summary: "Disciplined implementation across web engineering, search visibility, content, and ad campaigns.",
  },
  {
    step: "03",
    word: "Measurement",
    summary: "Accurate tracking of phone calls, WhatsApp messages, form submissions, and organic traffic.",
  },
  {
    step: "04",
    word: "Improvement",
    summary: "Ongoing adjustments based on actual data to steadily improve lead quality and lower acquisition cost.",
  },
];

export function GrowExperienceClient() {
  const [activeStage, setActiveStage] = useState(0);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCta(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col w-full bg-white text-palnadu-dark">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION: INTEGRATING SCROLL-LOCKED-VIDEO-HERO
         ───────────────────────────────────────────────────────────── */}
      <section className="relative w-full">
        <MetroHero
          videoSrc="/videos/metro-hero.mp4"
          title="Digital Marketing"
          tagline="Grow With Us. Let Your Business Growth Show."
          scrollHint="SCROLL TO EXPLORE GROWTH"
          scrubDistance={2800}
          unlockOnEnd={true}
        >
          {/* Quick jump to content button */}
          <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-auto px-4">
            <button
              type="button"
              data-unlock="true"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("unlock-video-hero"));
                }
                setTimeout(() => {
                  const el = document.getElementById("growth-journey");
                  if (el) {
                    const rect = el.getBoundingClientRect();
                    window.scrollTo({ top: rect.top + window.scrollY, behavior: "smooth" });
                  }
                }, 50);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-semibold hover:bg-white/20 transition-colors shadow-lg active:scale-95 cursor-pointer"
            >
              <span>Explore Growth Journey</span>
              <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
            </button>
          </div>
        </MetroHero>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2-9. STACKING CARDS DECK: FULL PROGRESSIVE JOURNEY
         ───────────────────────────────────────────────────────────── */}
      <StackingDeck className="bg-[#020b18]" cardCount={8}>
        {(deckProgress) => (
          <>
            {/* ── CARD 1: CENTRAL POSITIONING ── */}
            <StackingSection
              i={0}
              total={8}
              progress={deckProgress}
              id="growth-journey"
              cardClassName="bg-white border-palnadu-border p-5 sm:p-8 lg:p-12"
            >
              <div className="max-w-5xl mx-auto">
                <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue mb-3">
                  Clear Commercial Direction
                </p>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-palnadu-dark tracking-tight leading-snug sm:leading-tight mb-4 sm:mb-8">
                  Your business doesn’t need more marketing noise.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 items-start">
                  <div className="md:col-span-7 space-y-3.5 sm:space-y-6 text-sm sm:text-base lg:text-lg text-palnadu-body leading-relaxed">
                    <p className="font-semibold text-palnadu-dark text-base sm:text-xl lg:text-2xl leading-snug">
                      It needs the right people to discover you, trust you, and choose you.
                    </p>
                    <p>
                      At <span className="font-bold text-palnadu-dark">Palnadu.dev</span>, we help local
                      and growing businesses build their digital presence, reach the right audience, and
                      turn online visibility into real business opportunities.
                    </p>
                    <p className="text-xs sm:text-sm text-palnadu-body/80 border-l-2 border-palnadu-blue pl-3 sm:pl-4 py-1 italic">
                      We focus on tangible commercial outcomes rather than inflated follower counts that generate zero revenue.
                    </p>
                  </div>

                  {/* Contrast Card */}
                  <div className="md:col-span-5 rounded-2xl p-5 sm:p-6 bg-palnadu-light-blue/40 border border-palnadu-border space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-palnadu-blue">
                      The Practical Difference
                    </h3>
                    <ul className="space-y-4 text-xs sm:text-sm">
                      <li className="space-y-1">
                        <span className="font-semibold text-palnadu-dark block">Superficial metrics:</span>
                        <p className="text-palnadu-body leading-relaxed">
                          Buying social followers, inflating impression reports, and running generic ad campaigns that never turn into paying customers.
                        </p>
                      </li>
                      <li className="space-y-1 border-t border-palnadu-border/60 pt-3">
                        <span className="font-semibold text-palnadu-blue block">The Palnadu.dev approach:</span>
                        <p className="text-palnadu-body leading-relaxed">
                          Direct phone calls, verified WhatsApp inquiries, local Google Maps ranking, and high-speed web platforms built to convert visitors into clients.
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </StackingSection>

            {/* ── CARD 2: PROGRESSIVE GROWTH STAGES ── */}
            <StackingSection
              i={1}
              total={8}
              progress={deckProgress}
              cardClassName="bg-[#FAFCFF] border-palnadu-border p-5 sm:p-8 lg:p-12"
            >
              <div className="max-w-6xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-2 sm:space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue">
                    Progressive Growth System
                  </p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-palnadu-dark tracking-tight leading-snug sm:leading-tight">
                    We Don’t Just Talk About Growth.
                    <br />
                    <span className="text-palnadu-blue">We Work Towards It.</span>
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-palnadu-body max-w-xl mx-auto">
                    A practical framework that connects every stage of how customers find, evaluate, and choose your business.
                  </p>

                  {/* Clean Horizontal Stage Switcher */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {growthStages.map((stage, idx) => {
                      const isActive = activeStage === idx;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => setActiveStage(idx)}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer touch-manipulation",
                            isActive
                              ? "bg-palnadu-blue text-white shadow-xs"
                              : "bg-white text-palnadu-body border border-palnadu-border hover:text-palnadu-dark hover:border-palnadu-blue/40"
                          )}
                        >
                          {stage.shortTitle}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile-Friendly Stage Segmented Switcher */}
                <div className="lg:hidden grid grid-cols-4 gap-1 p-1 bg-palnadu-light-blue/60 rounded-xl mb-4 border border-palnadu-border">
                  {growthStages.map((stage, idx) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActiveStage(idx)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all touch-manipulation cursor-pointer ${
                        activeStage === idx
                          ? "bg-white text-palnadu-blue shadow-xs"
                          : "text-palnadu-body hover:text-palnadu-dark"
                      }`}
                    >
                      <span className="block text-[10px] font-mono opacity-60">0{idx + 1}</span>
                      <span className="truncate block text-xs">{stage.shortTitle}</span>
                    </button>
                  ))}
                </div>

                {/* Interactive 4-Stage Showcase */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
                  {/* Desktop Stage Selector Column */}
                  <div className="hidden lg:block lg:col-span-5 space-y-3">
                    {growthStages.map((stage, idx) => {
                      const isSelected = activeStage === idx;
                      const Icon = stage.icon;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => setActiveStage(idx)}
                          className={`w-full text-left p-4 sm:p-5 rounded-xl transition-all duration-150 border cursor-pointer touch-manipulation ${
                            isSelected
                              ? "bg-white shadow-md border-palnadu-blue ring-1 ring-palnadu-blue"
                              : "bg-white/60 hover:bg-white border-palnadu-border hover:border-palnadu-blue/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={cn(
                              "text-xs font-bold uppercase tracking-wider",
                              isSelected ? "text-palnadu-blue" : "text-palnadu-muted"
                            )}>
                              {stage.tag}
                            </span>
                            <Icon
                              className={`h-4 w-4 ${
                                isSelected ? "text-palnadu-blue" : "text-palnadu-muted"
                              }`}
                            />
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-palnadu-dark">
                            {stage.title}
                          </h3>
                          <p className="text-xs text-palnadu-body mt-1 line-clamp-2">
                            {stage.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Stage Display Card */}
                  <div className="lg:col-span-7">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div
                        key={growthStages[activeStage].id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="rounded-2xl bg-white border border-palnadu-border shadow-md sm:shadow-xl p-4 sm:p-6 lg:p-7 space-y-4 relative overflow-hidden"
                      >
                        <div
                          className={`absolute -right-20 -top-20 w-64 h-64 rounded-full bg-gradient-to-br ${growthStages[activeStage].color} blur-3xl pointer-events-none`}
                        />

                        <div className="flex items-center justify-between border-b border-palnadu-border pb-3 gap-3">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-palnadu-blue">
                              {growthStages[activeStage].tag}
                            </span>
                            <h4 className="text-lg sm:text-2xl font-bold text-palnadu-dark leading-tight mt-0.5">
                              {growthStages[activeStage].title}
                            </h4>
                            <p className="text-xs sm:text-sm text-palnadu-body mt-0.5">
                              {growthStages[activeStage].tagline}
                            </p>
                          </div>
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center shrink-0">
                            {React.createElement(growthStages[activeStage].icon, { className: "h-5 w-5 sm:h-6 sm:w-6" })}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm lg:text-base text-palnadu-body leading-relaxed">
                          {growthStages[activeStage].description}
                        </p>

                        {/* Clean simulated visual element */}
                        <div className="rounded-xl bg-[#091527] text-white p-4 border border-white/10 space-y-2 text-xs">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="text-xs text-white/90 font-semibold">
                              {growthStages[activeStage].previewContent.headline}
                            </span>
                            <span className="text-[11px] text-palnadu-teal uppercase font-medium">
                              Verified Metric
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            {growthStages[activeStage].previewContent.details.map((item, dIdx) => (
                              <div
                                key={dIdx}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-white/5 last:border-0 text-xs gap-1 sm:gap-2"
                              >
                                <span className="text-white/60">{item.label}</span>
                                <span className="text-white font-medium bg-white/10 px-2 py-0.5 rounded w-fit">
                                  {item.val}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div className="text-xs text-palnadu-body">
                            <span className="text-palnadu-muted">Expected Outcome: </span>
                            <strong className="text-palnadu-dark font-bold text-xs sm:text-sm">
                              {growthStages[activeStage].metrics}
                            </strong>
                          </div>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="text-xs border-palnadu-border text-palnadu-dark hover:bg-palnadu-light-blue w-full sm:w-auto h-10 sm:h-9 justify-center font-medium"
                          >
                            <Link href="/contact" className="flex items-center justify-center gap-1.5">
                              <span>Implement this stage</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>

                        {/* Mobile Stepper */}
                        <div className="lg:hidden flex items-center justify-between pt-2.5 border-t border-palnadu-border/60 text-xs">
                          <button
                            type="button"
                            onClick={() => setActiveStage((prev) => Math.max(0, prev - 1))}
                            disabled={activeStage === 0}
                            className="inline-flex items-center gap-1 text-palnadu-body hover:text-palnadu-dark disabled:opacity-30 disabled:pointer-events-none py-1.5 px-2.5 rounded-lg border border-palnadu-border/60 bg-palnadu-light-blue/30 font-medium"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            <span>Previous</span>
                          </button>
                          <span className="text-xs font-medium text-palnadu-muted">
                            {activeStage + 1} / {growthStages.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveStage((prev) => Math.min(growthStages.length - 1, prev + 1))}
                            disabled={activeStage === growthStages.length - 1}
                            className="inline-flex items-center gap-1 text-palnadu-blue hover:text-palnadu-dark disabled:opacity-30 disabled:pointer-events-none py-1.5 px-2.5 rounded-lg border border-palnadu-blue/30 bg-palnadu-light-blue/60 font-semibold"
                          >
                            <span>Next Stage</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </StackingSection>

            {/* ── CARD 3: CAPABILITIES (WHAT WE DO) ── */}
            <StackingSection
              i={2}
              total={8}
              progress={deckProgress}
              cardClassName="bg-white border-palnadu-border p-5 sm:p-8 lg:p-12"
            >
              <div className="max-w-6xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-2 sm:space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue">
                    Capabilities
                  </p>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-palnadu-dark tracking-tight">
                    What We Do
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-palnadu-body max-w-xl mx-auto">
                    Focused digital channels engineered to bring verifiable customers to your doorstep.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                  {servicesList.map((srv, idx) => {
                    const Icon = srv.icon;
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-2xl border border-palnadu-border bg-white p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center group-hover:bg-palnadu-blue group-hover:text-white transition-colors shrink-0">
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-palnadu-dark leading-snug">
                              {srv.title}
                            </h3>
                          </div>
                          <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed pt-0.5">
                            {srv.description}
                          </p>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-palnadu-border/60">
                          <p className="text-xs font-bold uppercase tracking-wider text-palnadu-dark mb-2">
                            Key Deliverables
                          </p>
                          <ul className="space-y-1.5 text-xs text-palnadu-body">
                            {srv.focus.map((item, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-2">
                                <span className="text-palnadu-teal font-bold select-none">•</span>
                                <span className="leading-snug text-palnadu-dark">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </StackingSection>

            {/* ── CARD 4: THE PROGRESSION FRAMEWORK ── */}
            <StackingSection
              i={3}
              total={8}
              progress={deckProgress}
              cardClassName="bg-[#041E3A] border-white/10 text-white p-5 sm:p-8 lg:p-12"
            >
              <div className="max-w-5xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-2.5 sm:space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-teal">
                    The Progression Framework
                  </p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-snug sm:leading-tight">
                    From Visibility to Business Growth
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-palnadu-light-blue/80 max-w-xl mx-auto">
                    A continuous, measurable chain from first search impression to sustained expansion.
                  </p>
                </div>

                {/* Connected Step Pipeline */}
                <div className="relative space-y-3 sm:space-y-4">
                  {pipelineSteps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.35, delay: idx * 0.08 }}
                      className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-xs hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:block">
                        <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl bg-palnadu-blue border border-white/20 text-white font-mono font-bold text-xs sm:text-base flex items-center justify-center shrink-0 shadow-md">
                          {step.number}
                        </div>
                        <span className="sm:hidden text-xs font-medium text-palnadu-teal">
                          {step.stat}
                        </span>
                      </div>

                      <div className="flex-1 space-y-1 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-white">
                            {step.title}
                          </h3>
                          <span className="hidden sm:inline-block text-xs font-medium text-palnadu-teal">
                            {step.stat}
                          </span>
                        </div>
                        <p className="text-xs text-palnadu-light-blue/80">
                          {step.subtitle}
                        </p>
                        <p className="text-xs sm:text-sm text-palnadu-light-blue/90 leading-relaxed pt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </StackingSection>

            {/* ── CARD 5: TAILORED APPROACH ── */}
            <StackingSection
              i={4}
              total={8}
              progress={deckProgress}
              cardClassName="bg-white border-palnadu-border p-5 sm:p-8 lg:p-12"
            >
              <div className="max-w-5xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-2 sm:space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue">
                    Tailored Strategy
                  </p>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-palnadu-dark tracking-tight leading-snug sm:leading-tight">
                    Every Business Is Different
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-palnadu-body max-w-2xl mx-auto leading-relaxed">
                    We do not sell rigid, one-size-fits-all packages. We examine the specific mechanics of your industry, location, and competition before building your approach.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {customPillars.map((pillar, idx) => {
                    const Icon = pillar.icon;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-palnadu-border bg-[#FAFCFF] p-4 space-y-2 hover:border-palnadu-blue transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-palnadu-dark">{pillar.title}</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed pt-0.5">
                          {pillar.desc}
                        </p>
                      </div>
                    );
                  })}

                  {/* Custom Assessment Highlight */}
                  <div className="rounded-2xl border border-dashed border-palnadu-blue/40 bg-palnadu-light-blue/30 p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-palnadu-blue">
                        Discovery Session
                      </p>
                      <h4 className="text-sm sm:text-base font-bold text-palnadu-dark">
                        No Pre-Packaged Templates
                      </h4>
                      <p className="text-xs text-palnadu-body leading-relaxed">
                        Direct consultation with our engineers to evaluate your specific digital needs.
                      </p>
                    </div>
                    <Button asChild size="sm" className="bg-palnadu-blue text-white text-xs w-full sm:w-auto h-10 font-semibold shadow-xs">
                      <Link href="/contact" className="justify-center">Schedule Discovery</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </StackingSection>

            {/* ── CARD 6: ENGINEERING TRANSPARENCY ── */}
            <StackingSection
              i={5}
              total={8}
              progress={deckProgress}
              cardClassName="bg-[#F5F8FC] border-palnadu-border p-5 sm:p-8 lg:p-12"
            >
              <div className="max-w-5xl mx-auto">
                <div className="max-w-3xl mx-auto text-center space-y-2 sm:space-y-3 mb-6 sm:mb-10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue">
                    Engineering Transparency
                  </p>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-palnadu-dark tracking-tight leading-snug sm:leading-tight">
                    We Show the Work Behind the Growth
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-palnadu-body max-w-xl mx-auto leading-relaxed">
                    No complicated agency buzzwords or unverified promises. We focus on what we can build, measure, and transparently demonstrate to you.
                  </p>
                </div>

                {/* 4 Foundational Words */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
                  {methodology.map((m, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="rounded-xl sm:rounded-2xl bg-white p-4 border border-palnadu-border shadow-xs flex sm:flex-col items-start gap-3 sm:gap-2 group hover:border-palnadu-blue/40 transition-colors"
                    >
                      <span className="font-mono text-xs font-bold text-palnadu-blue">
                        {m.step}
                      </span>
                      <div className="space-y-1 flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-palnadu-dark tracking-tight group-hover:text-palnadu-blue transition-colors">
                          {m.word}
                        </h3>
                        <p className="text-xs text-palnadu-body leading-relaxed">{m.summary}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Central Synthesis Statement */}
                <div className="rounded-2xl bg-palnadu-blue text-white p-6 sm:p-8 text-center max-w-3xl mx-auto shadow-md space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-light-blue">
                    The Primary Goal
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
                    Make Your Digital Presence Work Harder For Your Business
                  </h3>
                  <p className="text-xs sm:text-sm text-palnadu-light-blue/90 max-w-xl mx-auto leading-relaxed">
                    Your website, search listings, and social channels should be active commercial assets that consistently bring customer inquiries.
                  </p>
                </div>
              </div>
            </StackingSection>

            {/* ── CARD 7: HONEST PRINCIPLES ── */}
            <StackingSection
              i={6}
              total={8}
              progress={deckProgress}
              cardClassName="bg-[#091527] border-white/10 text-white p-5 sm:p-8 lg:p-12"
            >
              <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
                <div className="text-center max-w-3xl mx-auto space-y-2 sm:space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-teal">
                    Honest Principles
                  </p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-snug sm:leading-tight">
                    Results Over Promises
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-palnadu-light-blue/80 max-w-xl mx-auto">
                    We focus on genuine commercial outcomes rather than inflated vanity metrics or unrealistic shortcuts.
                  </p>
                </div>

                {/* Who this is for vs Who this is not for */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Who this is for */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-6 space-y-3">
                    <h3 className="text-base font-bold text-white pb-2 border-b border-white/10">
                      Who We Work Best With
                    </h3>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-palnadu-light-blue/90">
                      <li className="leading-relaxed">
                        Established and growing businesses looking to build long-term local market presence.
                      </li>
                      <li className="leading-relaxed">
                        Founders and managers who value real phone calls and customer inquiries over social media likes.
                      </li>
                      <li className="leading-relaxed">
                        Companies that want full ownership of their websites, domain assets, and ad accounts.
                      </li>
                      <li className="leading-relaxed">
                        Enterprises across Palnadu, Guntur, and coastal Andhra ready to expand their regional reach.
                      </li>
                    </ul>
                  </div>

                  {/* Who this is NOT for */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-6 space-y-3">
                    <h3 className="text-base font-bold text-white pb-2 border-b border-white/10">
                      When We Are Not the Right Fit
                    </h3>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-palnadu-light-blue/80">
                      <li className="leading-relaxed">
                        Anyone looking for overnight get-rich-quick schemes or guaranteed 10x lead claims.
                      </li>
                      <li className="leading-relaxed">
                        Businesses wanting to purchase fake followers, automated likes, or spam comments.
                      </li>
                      <li className="leading-relaxed">
                        Situations where team members cannot participate in sharing factual business details.
                      </li>
                      <li className="leading-relaxed">
                        Projects expecting results without reviewing performance data or allowing for iterative improvements.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch pt-2">
                  {/* The 4 Core Actions */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-6 space-y-4">
                    <h3 className="text-base font-bold text-white pb-2 border-b border-white/10">
                      Our Commitments to You
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white">1. We build</h4>
                        <p className="text-xs text-palnadu-light-blue/80 leading-relaxed">
                          Fast, modern Next.js web applications with clean schema data that search engines can easily index.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">2. We measure</h4>
                        <p className="text-xs text-palnadu-light-blue/80 leading-relaxed">
                          Phone calls, WhatsApp enquiries, and form submissions are tracked so you know where leads come from.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">3. We learn</h4>
                        <p className="text-xs text-palnadu-light-blue/80 leading-relaxed">
                          We analyze which products, pages, and search terms bring paying customers in your target territory.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">4. We improve</h4>
                        <p className="text-xs text-palnadu-light-blue/80 leading-relaxed">
                          We make continuous monthly adjustments to search ranking, ad targeting, and page content.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Evidence & Technical Proof */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-6 space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white pb-2 border-b border-white/10 mb-3">
                        Verifiable Outcomes We Focus On
                      </h3>
                      <ul className="space-y-2.5 text-xs sm:text-sm text-palnadu-light-blue/80">
                        <li className="leading-relaxed">
                          Sub-second page load times across Indian mobile networks.
                        </li>
                        <li className="leading-relaxed">
                          Accurate, verified Google Business Profile directory listings.
                        </li>
                        <li className="leading-relaxed">
                          Direct WhatsApp messaging and phone links with referral tracking.
                        </li>
                        <li className="leading-relaxed">
                          Complete client ownership of all code, hosting, and ad accounts.
                        </li>
                      </ul>
                    </div>

                    <div className="pt-2">
                      <p className="text-xs text-white/50 border-t border-white/10 pt-3">
                        We report verified analytics and actual business metrics only.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </StackingSection>

            {/* ── CARD 8: YOUR NEXT CHAPTER (CTA) ── */}
            <StackingSection
              i={7}
              total={8}
              progress={deckProgress}
              cardClassName="bg-gradient-to-br from-palnadu-dark via-palnadu-blue to-[#0b2447] border-white/20 text-white p-5 sm:p-10 lg:p-14 text-center"
            >
              <div className="relative z-10 space-y-4 sm:space-y-6 max-w-2xl mx-auto">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-palnadu-teal">
                  Your Next Chapter
                </p>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-snug sm:leading-tight">
                  Your next customer may already be looking for you.
                  <br />
                  <span className="text-palnadu-teal">Let’s Make Sure They Can Find You.</span>
                </h2>

                <p className="text-xs sm:text-sm lg:text-base text-palnadu-light-blue/90 leading-relaxed">
                  Grow With Palnadu.dev — <br className="sm:hidden" />
                  <strong className="text-white font-semibold">Your Ideas. Our Technology. A Stronger Tomorrow.</strong>
                </p>

                <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-palnadu-blue hover:bg-palnadu-light-blue font-bold shadow-md px-6 sm:px-8 h-12 text-sm sm:text-base w-full sm:w-auto justify-center"
                  >
                    <Link href="/contact" className="flex items-center justify-center gap-2">
                      <span>Contact Us</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 font-semibold h-12 text-sm sm:text-base w-full sm:w-auto justify-center"
                  >
                    <Link href="/work">View Our Work</Link>
                  </Button>
                </div>

                <p className="text-xs text-palnadu-light-blue/70 pt-1">
                  Direct consultation with software engineers. No aggressive sales calls.
                </p>
              </div>
            </StackingSection>
          </>
        )}
      </StackingDeck>

      {/* ─────────────────────────────────────────────────────────────
          10. FINAL CONTACT CALL TO ACTION AFTER SCROLL
         ───────────────────────────────────────────────────────────── */}
      <section className="relative w-full bg-[#020b18] py-16 sm:py-24 border-t border-white/10 text-white text-center">
        <div className="container max-w-3xl mx-auto px-4 space-y-4">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-palnadu-teal">
            Start Growing Today
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Ready to Turn Visibility Into Real Business?
          </h2>
          <p className="text-sm sm:text-base text-palnadu-light-blue/80 max-w-xl mx-auto leading-relaxed">
            Schedule a direct discovery consultation with our software engineers. We’ll analyze your digital presence, local search opportunities, and competitor landscape.
          </p>
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-palnadu-teal hover:bg-[#157c5c] text-white font-bold px-8 h-12 text-base shadow-lg rounded-full"
            >
              <Link href="/contact" className="flex items-center gap-2">
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

      {/* Floating Contact CTA on scroll */}
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
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-palnadu-blue text-white font-bold text-sm shadow-xl hover:bg-[#12487e] hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border border-white/20"
            >
              <span>Contact Us</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
