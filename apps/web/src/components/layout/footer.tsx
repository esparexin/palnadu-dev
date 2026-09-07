import Link from 'next/link';
import { siteConfig, footerNavItems } from '@palnadu/config';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30" role="contentinfo">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Palnadu<span className="text-muted-foreground">.dev</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Start with the problem. We build the solution. Helping startups, businesses, and
              individuals turn real-world problems into practical digital solutions.
            </p>
            <p className="text-sm text-muted-foreground">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="hover:text-foreground transition-colors"
              >
                {siteConfig.contact.email}
              </a>
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Services</h3>
            <ul className="space-y-2.5">
              {footerNavItems.services.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-2.5">
              {footerNavItems.company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2.5">
              {footerNavItems.legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Palnadu.dev. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built by Palnadu. Built with pride.
          </p>
        </div>
      </div>
    </footer>
  );
}
