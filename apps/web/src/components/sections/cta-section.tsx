import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="py-20 md:py-28" id="cta">
      <div className="container">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-10 text-center shadow-sm md:p-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Have a problem that needs solving?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
            Tell us what you&apos;re dealing with. We&apos;ll listen, understand, and let you know
            how we can help — honestly.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="xl">
              <Link href="/contact">
                Tell us your problem
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/services">Explore our services</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
