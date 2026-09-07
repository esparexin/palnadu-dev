export function IdentitySection() {
  return (
    <section className="py-12 sm:py-20 md:py-28 relative border-t border-slate-900" id="identity">
      <div className="container max-w-4xl">
        <div className="space-y-2 mb-6 sm:mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            Our roots
          </p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Built by Palnadu.<br />
            <span className="text-slate-400 font-normal">Built with pride.</span>
          </h2>
        </div>

        <div className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed max-w-3xl">
          <p>
            Palnadu.dev was founded by software developers from Palnadu. We grew up here, we code from here, and we build digital products for clients across India and globally.
          </p>
          <p>
            With over eight years of hands-on experience building web platforms, mobile apps, and distributed backends, we know what it takes to build software that runs reliably under pressure.
          </p>
          <p>
            You don&apos;t get corporate bureaucracy or outsourced junior contractors. When you contact us, you speak directly with the engineers who design and write your application.
          </p>
        </div>
      </div>
    </section>
  );
}
