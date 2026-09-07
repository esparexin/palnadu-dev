import { SectionHeading } from '@/components/layout/section-heading';
import { MapPin, Code2, HeartHandshake } from 'lucide-react';

export function IdentitySection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden" id="identity">
      <div className="container relative z-10">
        <SectionHeading
          label="Our Roots & Heritage"
          title="Built by Palnadu. Built with pride."
          description="A technology company founded by engineers from the Palnadu region, solving digital problems for clients worldwide."
        />

        <div className="mx-auto mt-14 max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 text-center backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <MapPin className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1.5">Regional Roots</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Founded in Palnadu with the conviction that top-tier digital engineering thrives here.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 text-center backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Code2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1.5">8+ Years Craft</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Real depth in modern full-stack systems, cloud architectures, and user-centric design.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 text-center backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1.5">Global Standards</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Serving startups and businesses locally, nationally across India, and internationally.
              </p>
            </div>
          </div>

          <div className="mt-10 mx-auto max-w-2xl text-center">
            <p className="text-base text-slate-300 leading-relaxed">
              We don&apos;t use exaggerated marketing speak. We believe in letting our technical
              depth, transparency, and the reliability of what we ship speak for itself.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
