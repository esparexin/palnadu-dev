import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Hero3DWrapper } from '@/components/three/hero-3d-wrapper';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* 3D Dynamic Background Layer */}
      <Hero3DWrapper />

      {/* Content — always real HTML (SEO Critical) */}
      <div className="container relative z-10 py-20 md:py-32">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance">
            Start with the problem.{' '}
            <span className="text-muted-foreground">We build the solution.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed md:text-xl">
            We help startups, businesses, and individuals turn real-world problems and ideas into
            practical digital solutions.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="xl">
              <Link href="/contact">
                Tell us your problem
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="#process">See how we work</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            8+ years of experience in technology and problem solving
          </p>
        </div>
      </div>
    </section>
  );
}
