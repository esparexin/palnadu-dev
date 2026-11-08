import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MoltenRingItem } from "./molten-ring-constants";

interface MoltenRingFallbackProps extends React.ComponentPropsWithoutRef<"section"> {
  items: MoltenRingItem[];
  brand?: string;
  className?: string;
}

export function MoltenRingFallback({
  items,
  brand,
  className,
  ...props
}: MoltenRingFallbackProps) {
  return (
    <section
      aria-roledescription="carousel"
      aria-label={brand ?? "Gallery"}
      className={cn(
        "bg-palnadu-dark text-white relative h-full min-h-[24rem] w-full",
        className
      )}
      {...props}
    >
      <ul className="flex h-full snap-y snap-mandatory flex-col items-center gap-3 overflow-y-auto py-[6%]">
        {items.map((entry) => (
          <li
            key={entry.image}
            className="w-[62%] shrink-0 snap-center relative aspect-[1.5] overflow-hidden rounded-lg"
          >
            <Image
              src={entry.image}
              alt={entry.title}
              fill
              sizes="(max-width: 768px) 80vw, 400px"
              className="bg-palnadu-dark-hover w-full h-full object-cover"
              unoptimized
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
