'use client';

import { siteConfig } from '@palnadu/config';
import { trackContactChannelClick } from '@/lib/analytics';
import { MessageSquare, Phone, Mail } from 'lucide-react';

interface QuickContactActionsProps {
  sourceSection?: string;
  sourcePage?: string;
}

export function QuickContactActions({
  sourceSection = 'quick_contact',
  sourcePage = '/contact',
}: QuickContactActionsProps) {
  const whatsappUrl =
    'https://wa.me/919030787819?text=Hello%20Palnadu.dev%2C%20I%20would%20like%20to%20discuss%20a%20project';

  return (
    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackContactChannelClick({
            channel: 'whatsapp',
            destination: 'https://wa.me/919030787819',
            source_section: sourceSection,
            source_page: sourcePage,
          })
        }
        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-palnadu-teal hover:bg-palnadu-teal-dark text-white text-xs font-semibold shadow-sm transition-colors"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <span>WhatsApp</span>
      </a>
      <a
        href={`tel:${siteConfig.contact.phone}`}
        onClick={() =>
          trackContactChannelClick({
            channel: 'phone',
            destination: siteConfig.contact.phone,
            source_section: sourceSection,
            source_page: sourcePage,
          })
        }
        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-palnadu-blue text-white text-xs font-semibold hover:bg-palnadu-dark-hover transition-colors"
      >
        <Phone className="h-3.5 w-3.5" />
        <span>{siteConfig.contact.phone}</span>
      </a>
      <a
        href={`mailto:${siteConfig.contact.email}`}
        onClick={() =>
          trackContactChannelClick({
            channel: 'email',
            destination: siteConfig.contact.email,
            source_section: sourceSection,
            source_page: sourcePage,
          })
        }
        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md border border-palnadu-border text-palnadu-dark text-xs font-semibold hover:bg-palnadu-off-white transition-colors"
      >
        <Mail className="h-3.5 w-3.5" />
        <span>{siteConfig.contact.email}</span>
      </a>
    </div>
  );
}
