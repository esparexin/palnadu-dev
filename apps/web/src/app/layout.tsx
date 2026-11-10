import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { siteConfig } from '@palnadu/config';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { MobileStickyCta } from '@/components/layout/mobile-sticky-cta';
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll-provider';
import { GtmScripts, GtmNoscript } from '@/components/analytics/gtm-scripts';
import { AnalyticsRouteTracker } from '@/components/analytics/route-tracker';
import { CookieConsentBanner } from '@/components/analytics/cookie-consent-banner';
import './globals.css';

// Primary font definitions adhering to palnadu-ui-ux SSOT
const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '700'],
});

export const viewport: Viewport = {
  themeColor: '#042C53',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-TTNNVNM5';

interface ActiveBranding {
  faviconUrl: string;
  appleIconUrl: string;
  headerLogoUrl: string | null;
  footerLogoUrl: string | null;
}

let activeBrandingPromise: Promise<ActiveBranding> | null = null;

async function fetchActiveBranding(): Promise<ActiveBranding> {
  try {
    const res = await fetch(`${API_URL}/api/settings/branding`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(350),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          faviconUrl: json.data.favicon?.url || '/favicon.png',
          appleIconUrl: json.data.favicon?.url || '/apple-touch-icon.png',
          headerLogoUrl: json.data.headerLogo?.url || json.data.logoUrl || null,
          footerLogoUrl: json.data.footerLogo?.url || json.data.headerLogo?.url || null,
        };
      }
    }
  } catch {}

  return {
    faviconUrl: '/favicon.png',
    appleIconUrl: '/apple-touch-icon.png',
    headerLogoUrl: null,
    footerLogoUrl: null,
  };
}

function getActiveBranding(): Promise<ActiveBranding> {
  if (!activeBrandingPromise) {
    activeBrandingPromise = fetchActiveBranding();
  }
  return activeBrandingPromise;
}

export async function generateMetadata(): Promise<Metadata> {
  const { faviconUrl, appleIconUrl } = await getActiveBranding();

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    authors: [{ name: siteConfig.creator }],
    creator: siteConfig.creator,
    icons: {
      icon: [
        { url: faviconUrl || '/favicon.ico', sizes: 'any' },
        { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
        { url: '/favicon-96.png', sizes: '96x96', type: 'image/png' },
        { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: [{ url: appleIconUrl || '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: siteConfig.url,
      title: siteConfig.title,
      description: siteConfig.description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          secureUrl: siteConfig.ogImage,
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.title,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
      creator: '@palnadudev',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const branding = await getActiveBranding();

  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased bg-white text-palnadu-body selection:bg-palnadu-light-blue selection:text-palnadu-blue">
        <GtmNoscript gtmId={GTM_ID} />
        <GtmScripts gtmId={GTM_ID} />
        <Suspense fallback={null}>
          <AnalyticsRouteTracker />
        </Suspense>
        <SmoothScrollProvider>
          <div className="relative flex min-h-screen flex-col bg-white">
            <Navbar initialLogoUrl={branding.headerLogoUrl} />
            <main className="flex-1 bg-white">{children}</main>
            <Footer initialLogoUrl={branding.footerLogoUrl} />
            <MobileStickyCta />
          </div>
        </SmoothScrollProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
