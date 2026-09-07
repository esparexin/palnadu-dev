import type { Metadata } from 'next';
import { CtaSection } from '@/components/sections/cta-section';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Palnadu.dev is a technology company built by developers from Palnadu with 8+ years of experience. We turn real-world problems into practical software.',
};

export default function AboutPage() {
  return (
    <>
      <section className="py-24 sm:py-32 relative">
        <div className="container max-w-4xl">
          <div className="space-y-4 mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              About Palnadu.dev
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              Software engineers,<br />
              <span className="text-slate-400 font-normal">not commission salespeople.</span>
            </h1>
          </div>

          <div className="space-y-12 text-base sm:text-lg text-slate-300 leading-relaxed">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Who we are</h2>
              <p>
                Palnadu.dev was built by software engineers from the Palnadu region. We have spent more than eight years in the industry designing web applications, building mobile platforms, automating manual business operations, and validating startup MVPs.
              </p>
              <p>
                We do not position ourselves as a generic freelance marketplace or an overpriced metropolitan agency with marble lobbies. We are an engineering studio that partners directly with startup founders, small-to-medium businesses, and individuals who have genuine digital challenges.
              </p>
            </div>

            <div className="space-y-4 border-t border-slate-900 pt-10">
              <h2 className="text-2xl font-bold text-white">Our standard: Truth before code</h2>
              <p>
                Before we write a single line of code, we spend time understanding your workflow and where things break down. We look for hidden bottlenecks, assess hosting and database dependencies, and explain the realistic costs upfront.
              </p>
              <p>
                If an idea has technical limitations or future scaling traps, we explain them before development starts. If you don&apos;t need custom software, we tell you that honestly and point you to simpler existing tools.
              </p>
            </div>

            <div className="space-y-4 border-t border-slate-900 pt-10">
              <h2 className="text-2xl font-bold text-white">A boundary on price, not on quality</h2>
              <p>
                We believe great software should be accessible. Affordable engineering does not come from cutting corners or hiring cheap, unverified contractors. It comes from disciplined scope, sensible architectural choices, avoiding trendy bloat, and shipping in phases.
              </p>
              <p>
                When you partner with us, you work directly with the developers building your product. That means faster communication, honest engineering answers, and software that actually works when your customers use it.
              </p>
            </div>
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
