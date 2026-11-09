import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StackingSection } from "@/components/ui/stacking-card";

interface GrowCardsProps {
  deckProgress: any;
}

export function GrowPrinciplesCard({ deckProgress }: GrowCardsProps) {
  return (
    <StackingSection
      i={6}
      total={8}
      progress={deckProgress}
      cardClassName="bg-palnadu-dark border-white/10 text-white p-5 sm:p-8 lg:p-12"
    >
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2 sm:space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-teal">
            Honest Principles
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-snug sm:leading-tight">
            Results Over Promises
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-palnadu-light-blue/80 max-w-xl mx-auto">
            We focus on genuine commercial outcomes rather than inflated vanity metrics or unrealistic shortcuts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
  );
}

export function GrowNextChapterCard({ deckProgress }: GrowCardsProps) {
  return (
    <StackingSection
      i={7}
      total={8}
      progress={deckProgress}
      cardClassName="bg-gradient-to-br from-palnadu-dark via-palnadu-blue to-palnadu-dark border-white/20 text-white p-5 sm:p-10 lg:p-14 text-center"
    >
      <div className="relative z-10 space-y-4 sm:space-y-6 max-w-2xl mx-auto">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-palnadu-teal">
          Your Next Chapter
        </p>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-snug sm:leading-tight">
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
  );
}
