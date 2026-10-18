"use client";

import {
  MoltenRingCarousel,
  type MoltenRingItem,
} from "@/components/ui/molten-ring-carousel";

// Verified Unsplash engineering and digital solutions imagery
const PALNADU_WORK: MoltenRingItem[] = [
  {
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    title: "Web Platforms & Architecture",
    meta: "Full Stack · Next.js · Node",
  },
  {
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
    title: "Mobile App Ecosystems",
    meta: "iOS & Android · Cross-Platform",
  },
  {
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    title: "Business Automation & ERP",
    meta: "Regional Workflow · Cloud Database",
  },
  {
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    title: "Cloud Infrastructure & DevOps",
    meta: "High Availability · Docker & CI/CD",
  },
  {
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    title: "Conversion UX & Strategy",
    meta: "Performance · SEO · Analytics",
  },
  {
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    title: "Startup MVP Engineering",
    meta: "Rapid Delivery · Truth Before Code",
  },
];

export function MoltenRingCarouselDemo() {
  return (
    <div className="h-[480px] sm:h-[540px] w-full rounded-2xl overflow-hidden border border-palnadu-border/60 shadow-xl bg-palnadu-dark">
      <MoltenRingCarousel
        items={PALNADU_WORK}
        brand="PALNADU.DEV CRAFT"
        arc={1.05}
        cardSize={0.24}
        cardRatio={0.7}
        fuse={0.09}
      />
    </div>
  );
}

export default MoltenRingCarouselDemo;
