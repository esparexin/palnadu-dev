import { MapPin, Building2, AlertCircle } from 'lucide-react';

interface LocationProfileProps {
  location: any;
}

export function LocationProfile({ location }: LocationProfileProps) {
  return (
    <section className="py-14 sm:py-20 border-b border-palnadu-border">
      <div className="container max-w-4xl space-y-10">
        <div className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
            Regional Commercial Profile
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-palnadu-dark tracking-tight">
            Empowering Enterprises Across {location.name}
          </h2>
          <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
            {location.economicProfile}
          </p>
        </div>

        {/* Key Industries in this Location */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-palnadu-secondary font-bold flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-palnadu-blue" />
            <span>Primary Commercial Sectors in {location.name}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {location.keyIndustries.map((industry: string) => (
              <div
                key={industry}
                className="p-3 rounded-lg border border-palnadu-border bg-palnadu-off-white/50 text-xs font-semibold text-palnadu-dark flex items-center gap-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-palnadu-blue shrink-0" />
                <span>{industry}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Surrounding Mandals & Corridors Served */}
        {location.surroundingMandals && location.surroundingMandals.length > 0 && (
          <div className="rounded-xl border border-palnadu-border bg-palnadu-off-white/40 p-6 space-y-3">
            <div className="flex items-center gap-2 text-palnadu-dark">
              <MapPin className="h-4 w-4 text-palnadu-blue shrink-0" />
              <h3 className="text-sm font-bold">
                Serving {location.name} & Surrounding Mandals / Corridors:
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {location.surroundingMandals.map((mandal: string) => (
                <span
                  key={mandal}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-palnadu-border text-xs font-medium text-palnadu-dark shadow-sm"
                >
                  {mandal}
                </span>
              ))}
            </div>
            <p className="text-xs text-palnadu-secondary leading-relaxed">
              Traders, clinics, schools, and enterprises across these regional mandals receive direct engineering advisory and on-site support from Palnadu.dev.
            </p>
          </div>
        )}

        {/* Common Operational Challenges Solved */}
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-6 space-y-3">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <h3 className="text-sm font-bold">
              Common Bottlenecks Facing Businesses in {location.name}
            </h3>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-palnadu-body">
            {location.commonPainPoints.map((pain: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                <span>{pain}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
