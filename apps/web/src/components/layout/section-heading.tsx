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
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-balance">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-muted-foreground leading-relaxed text-balance">
          {description}
        </p>
      )}
    </div>
  );
}
