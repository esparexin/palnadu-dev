"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden pb-12 pt-6">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Software Solutions Built for <br />
              <span className="text-palnadu-blue font-bold">Real-World Operations</span>
            </h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg mt-4 sm:mt-6 text-slate-600 leading-relaxed font-normal">
              Explore enterprise web applications, operations portals, and mobile platforms engineered by Palnadu.dev for businesses in Andhra Pradesh.
            </p>
          </>
        }
      >
        <Image
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2400&q=80"
          alt="Palnadu.dev Software Operations Dashboard"
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
          priority
        />
      </ContainerScroll>
    </div>
  );
}

export default HeroScrollDemo;
