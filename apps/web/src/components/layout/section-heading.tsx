import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  label,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-3xl space-y-4',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {label && (
        <div className={cn('flex', align === 'center' && 'justify-center')}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/25 bg-cyan-950/40 text-cyan-300 text-xs font-mono uppercase tracking-widest backdrop-blur-md">
            <span className="h-1 w-1 rounded-full bg-cyan-400" />
            {label}
          </span>
        </div>
      )}
      <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl text-balance leading-[1.15]">
        {title}
      </h2>
      {description && (
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed text-balance">
          {description}
        </p>
      )}
    </div>
  );
}
