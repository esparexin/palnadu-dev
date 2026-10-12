import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
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
  weight: ['400', '500', '700'],
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getActiveFavicon(): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/api/settings/branding`, { next: { revalidate: 30 } });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.favicon?.url) {
        return json.data.favicon.url;
      }
    }
  } catch {}
  return '/favicon.png';
}

export async function generateMetadata(): Promise<Metadata> {
  const faviconUrl = await getActiveFavicon();

  return {
    title: {
      default: 'Admin | Palnadu.dev',
      template: '%s | Admin | Palnadu.dev',
    },
    description: 'Palnadu.dev Admin Dashboard',
    robots: { index: false, follow: false },
    icons: {
      icon: [{ url: faviconUrl, sizes: 'any' }],
      apple: [{ url: faviconUrl, sizes: '180x180' }],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const faviconUrl = await getActiveFavicon();

  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href={faviconUrl} sizes="any" />
        <link rel="apple-touch-icon" href={faviconUrl} />
      </head>
      <body className="min-h-screen font-sans antialiased bg-white text-palnadu-body">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
