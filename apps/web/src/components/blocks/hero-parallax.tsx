"use client";

import React, { useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export interface ProductItem {
  title: string;
  link: string;
  thumbnail: string;
}

export const HeroParallax = ({
  products,
}: {
  products: ProductItem[];
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Balanced spring configuration: avoids jitter on mobile, fluid on desktop
  const springConfig = isMobile
    ? { stiffness: 220, damping: 38, bounce: 0 }
    : { stiffness: 280, damping: 32, bounce: 0 };

  // Adaptive translation distances: mobile uses smaller offsets to stay within screen bounds
  const xRange = isMobile ? 320 : 900;
  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, xRange]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -xRange]),
    springConfig
  );

  // Gentle 3D perspective to prevent mobile WebKit composite stutter
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.25], [isMobile ? 4 : 12, 0]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.25], [isMobile ? 3 : 14, 0]),
    springConfig
  );

  // Smooth vertical positioning starting BELOW the header (never pulled up into the title)
  const translateY = useSpring(
    useTransform(
      scrollYProgress,
      [0, 0.3],
      isMobile ? [0, 60] : [0, 120]
    ),
    springConfig
  );

  return (
    <div
      ref={ref}
      className="min-h-[180vh] sm:min-h-[230vh] md:min-h-[270vh] py-16 sm:py-28 md:py-36 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1200px]"
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
        }}
        className="w-full mt-4 sm:mt-8"
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-6 sm:space-x-12 md:space-x-16 mb-8 sm:mb-12 md:mb-16">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row space-x-6 sm:space-x-12 md:space-x-16 mb-8 sm:mb-12 md:mb-16">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-6 sm:space-x-12 md:space-x-16">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto pt-6 pb-6 sm:pt-10 sm:pb-10 px-4 w-full left-0 top-0 z-20">
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-palnadu-dark leading-tight max-w-4xl">
        Software Engineering and Web Development Services
      </h1>
      <p className="max-w-2xl text-base sm:text-lg md:text-xl mt-4 sm:mt-5 text-palnadu-body leading-relaxed font-normal">
        We build high-performance web applications, mobile apps, and custom
        software for businesses across Palnadu, Guntur, and coastal Andhra
        Pradesh. Every platform is designed around real operational workflows.
      </p>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: ProductItem;
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -12,
      }}
      key={product.title}
      className="group/product h-60 w-72 sm:h-80 sm:w-96 md:h-96 md:w-[28rem] relative shrink-0 rounded-2xl overflow-hidden shadow-lg border border-palnadu-border/60 bg-palnadu-dark"
    >
      <Link
        href={product.link}
        className="block w-full h-full relative"
      >
        <Image
          src={product.thumbnail}
          fill
          sizes="(max-width: 640px) 288px, (max-width: 768px) 384px, 448px"
          className="object-cover object-left-top transition-transform duration-500 group-hover/product:scale-105"
          alt={product.title}
        />

        {/* High-contrast backdrop gradient: ensures white title is razor sharp against any background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent transition-opacity duration-300 group-hover/product:from-black group-hover/product:via-black/70" />

        {/* Service Title & Route Badge: 100% clear and legible on all devices */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end z-10">
          <p className="text-[11px] sm:text-xs font-semibold text-emerald-400 tracking-wide mb-1">
            Engineering Service
          </p>
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white leading-snug drop-shadow-md">
            {product.title}
          </h2>
          <span className="text-xs text-white/90 mt-1 sm:mt-1.5 inline-flex items-center gap-1 font-semibold transition-colors group-hover/product:text-white">
            Learn more
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

export default HeroParallax;
