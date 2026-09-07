import Link from 'next/link';
import { siteConfig, footerNavItems } from '@palnadu/config';
import { Separator } from '@/components/ui/separator';
import { ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-300" role="contentinfo">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-tight text-white group">
              Palnadu<span className="text-cyan-400 group-hover:text-cyan-300 transition-colors">.dev</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Start with the problem. We build the solution. Helping startups, businesses, and
              individuals turn real-world problems into practical digital solutions.
            </p>
            <p className="text-sm">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs inline-flex items-center gap-1"
              >
                <span>{siteConfig.contact.email}</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 text-xs font-mono uppercase tracking-widest text-slate-200">
              Services
            </h3>
            <ul className="space-y-2.5">
              {footerNavItems.services.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-400 transition-colors hover:text-cyan-300"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-xs font-mono uppercase tracking-widest text-slate-200">
              Company
            </h3>
            <ul className="space-y-2.5">
              {footerNavItems.company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-400 transition-colors hover:text-cyan-300"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-xs font-mono uppercase tracking-widest text-slate-200">
              Legal
            </h3>
            <ul className="space-y-2.5">
              {footerNavItems.legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-400 transition-colors hover:text-cyan-300"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-slate-800/80" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} Palnadu.dev. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span>Built by Palnadu. Built with pride.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
