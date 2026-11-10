"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@palnadu/config';
import { cn } from '@/lib/utils';
import {
  defaultSocialLinks,
  defaultProjectTypes,
  type ContactSectionProps,
} from './contact-data';
import { ContactFormCard } from './contact-form';

export type { ContactSectionProps };

export const ContactSection: React.FC<ContactSectionProps> = ({
  title = "We turn real-world problems into practical digital solutions",
  mainMessage = "Let's talk! 👋",
  contactEmail = siteConfig.contact.email,
  socialLinks = defaultSocialLinks,
  backgroundImageSrc = "https://cdn.21st.dev/assets/mirror/96/96fdf2b6baa37ce1a93e8bbc4f9af1ad007f689c5df9b1b78d2f7a8df47a450b.jpg",
  projectTypeOptions = defaultProjectTypes,
  showNav = false,
  onSubmit,
  className,
}) => {
  return (
    <section className={cn("relative min-h-[90vh] w-full overflow-hidden bg-white text-palnadu-dark", className)}>
      {/* Background Image with Palnadu Primary Dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 ease-in-out"
        style={{ backgroundImage: `url(${backgroundImageSrc})` }}
      >
        <div className="absolute inset-0 bg-palnadu-dark/70 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-palnadu-dark/95 via-palnadu-dark/75 to-palnadu-dark/50" />

        {/* Animated Bubbles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/20 rounded-full animate-bubble opacity-0"
              style={{
                width: `${(i % 4) * 6 + 10}px`,
                height: `${(i % 4) * 6 + 10}px`,
                left: `${(i * 7) % 100}%`,
                animationDelay: `${(i * 1.3) % 8}s`,
                animationDuration: `${14 + (i % 6) * 2}s`,
                top: `${(i * 9) % 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content Container — Top-aligned, responsive padding */}
      <div className="relative z-10 flex flex-col items-center justify-start w-full h-full px-3 py-3 sm:px-6 sm:py-6 md:px-8 lg:px-12">
        {showNav && (
          <nav className="w-full max-w-6xl flex items-center justify-between p-3.5 bg-white/90 backdrop-blur-md rounded-xl border border-palnadu-border shadow-md mb-4">
            <span className="font-extrabold text-lg text-palnadu-dark">Palnadu<span className="text-palnadu-blue">.dev</span></span>
            <Button asChild size="sm" className="bg-palnadu-blue text-white hover:bg-palnadu-dark-hover">
              <a href="#contact-card">Get in touch</a>
            </Button>
          </nav>
        )}

        {/* Main Grid: Desktop 2-Column (Left Headline, Right Form) | Mobile Form-First */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 w-full max-w-6xl pb-8" id="contact-card">
          <div className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left space-y-2 lg:space-y-4 p-2 sm:p-4 lg:p-6 max-w-sm sm:max-w-md lg:max-w-none mx-auto lg:mx-0">
            <p className="text-xs font-mono uppercase tracking-widest text-palnadu-light-blue font-bold">
              Start With The Problem
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white leading-tight drop-shadow-sm lg:drop-shadow-md">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-palnadu-light-blue/90 leading-relaxed max-w-md">
              Have an idea, or need to automate a manual process? Talk directly with the software engineers building your solution.
            </p>
          </div>

          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md p-4 sm:p-6 lg:p-7 rounded-xl sm:rounded-2xl shadow-xl border border-palnadu-border">
            <ContactFormCard
              mainMessage={mainMessage}
              contactEmail={contactEmail}
              socialLinks={socialLinks}
              projectTypeOptions={projectTypeOptions}
              onSubmit={onSubmit}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bubble {
          0% {
            transform: translateY(0) translateX(0) scale(0.6);
            opacity: 0;
          }
          30% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-90vh) translateX(40px) scale(1.15);
            opacity: 0;
          }
        }
        .animate-bubble {
          animation: bubble var(--animation-duration, 16s) ease-in-out infinite;
          animation-fill-mode: forwards;
        }
      `}</style>
    </section>
  );
};

export default ContactSection;
