export function IdentitySection() {
  return (
    <section className="py-12 sm:py-16 bg-white border-t border-palnadu-border" id="identity">
      <div className="container max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1">
            Our Roots
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-palnadu-dark">
            Built by Palnadu. Built with Pride.
          </h2>
        </div>

        {/* Clean 3-Column Editorial Grid — No Card Boxes */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-mono text-palnadu-blue uppercase">Origin</h3>
            <p className="text-xs text-palnadu-body leading-relaxed">
              Founded and engineered in Palnadu, building digital products for clients locally and globally.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-mono text-palnadu-blue uppercase">Experience</h3>
            <p className="text-xs text-palnadu-body leading-relaxed">
              8+ years building production web platforms, mobile applications, and resilient backends.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-mono text-palnadu-blue uppercase">Direct Access</h3>
            <p className="text-xs text-palnadu-body leading-relaxed">
              No outsourcing or intermediaries. You collaborate directly with the engineers writing code.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
