import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { siteConfig } from '@palnadu/config';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { MobileStickyCta } from '@/components/layout/mobile-sticky-cta';
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll-provider';
import './globals.css';

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
});

export const viewport: Viewport = {
  themeColor: '#042C53',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getActiveFavicon(): Promise<{ faviconUrl: string; appleIconUrl: string }> {
  try {
    const res = await fetch(`${API_URL}/api/settings/branding`, { next: { revalidate: 30 } });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.favicon?.url) {
        return {
          faviconUrl: json.data.favicon.url,
          appleIconUrl: json.data.favicon.url,
        };
      }
    }
  } catch {}

  return {
    faviconUrl: '/favicon.png',
    appleIconUrl: '/apple-touch-icon.png',
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { faviconUrl, appleIconUrl } = await getActiveFavicon();

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: [...siteConfig.keywords],
    authors: [{ name: siteConfig.creator }],
    creator: siteConfig.creator,
    icons: {
      icon: [{ url: faviconUrl, sizes: 'any' }],
      apple: [{ url: appleIconUrl, sizes: '180x180' }],
    },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: siteConfig.url,
      title: siteConfig.title,
      description: siteConfig.description,
      siteName: siteConfig.name,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.name }],
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
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { faviconUrl, appleIconUrl } = await getActiveFavicon();

  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href={faviconUrl} sizes="any" />
        <link rel="apple-touch-icon" href={appleIconUrl} />
        <link rel="canonical" href={siteConfig.url} />
      </head>
      <body className="min-h-screen font-sans antialiased bg-white text-palnadu-body selection:bg-palnadu-light-blue selection:text-palnadu-blue">
        <SmoothScrollProvider>
          <div className="relative flex min-h-screen flex-col bg-white">
            <Navbar />
            <main className="flex-1 bg-white">{children}</main>
            <Footer />
            <MobileStickyCta />
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
