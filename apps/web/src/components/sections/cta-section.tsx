import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="py-14 sm:py-20 bg-palnadu-light-blue/40 border-t border-palnadu-border" id="cta">
      <div className="container max-w-xl text-center space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
          Get Started
        </p>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-palnadu-dark text-balance leading-tight">
          Have an idea, or need to automate a process?
        </h2>

        <p className="text-sm sm:text-base text-palnadu-body leading-relaxed max-w-md mx-auto">
          Tell us what you want to achieve. We&apos;ll explain what it takes to build and the most cost-effective path forward.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            asChild
            className="w-full sm:w-auto bg-palnadu-teal text-white hover:bg-[#157c5c] font-semibold px-6 h-11 sm:h-10 rounded-md text-sm shadow-xs"
          >
            <Link href="/contact">
              Tell us what you want to build
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto border-palnadu-blue text-palnadu-blue bg-white hover:bg-palnadu-off-white px-6 h-11 sm:h-10 rounded-md text-sm"
          >
            <Link href="/services">View services</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
