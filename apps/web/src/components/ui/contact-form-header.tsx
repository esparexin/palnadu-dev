"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@palnadu/config';
import { trackContactChannelClick } from '@/lib/analytics';
import { renderSocialIcon, type ContactSectionProps } from './contact-data';

interface ContactFormHeaderProps {
  mainMessage: string;
  contactEmail: string;
  socialLinks: NonNullable<ContactSectionProps['socialLinks']>;
}

export function ContactFormHeader({
  mainMessage,
  contactEmail,
  socialLinks,
}: ContactFormHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-palnadu-border/60">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-palnadu-dark">{mainMessage}</h2>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <a
            href={`mailto:${contactEmail}`}
            onClick={() =>
              trackContactChannelClick({
                channel: 'email',
                destination: contactEmail,
                source_section: 'contact_form_header',
                source_page: '/contact',
              })
            }
            className="font-semibold text-palnadu-blue hover:underline"
          >
            {contactEmail}
          </a>
          {siteConfig.contact.phone && (
            <>
              <span className="text-palnadu-secondary/60">•</span>
              <a
                href={`tel:${siteConfig.contact.phone}`}
                onClick={() =>
                  trackContactChannelClick({
                    channel: 'phone',
                    destination: siteConfig.contact.phone,
                    source_section: 'contact_form_header',
                    source_page: '/contact',
                  })
                }
                className="font-semibold font-mono text-palnadu-blue hover:underline"
              >
                {siteConfig.contact.phone}
              </a>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        {socialLinks.map((link) => (
          <Button
            key={link.id}
            variant="outline"
            size="icon"
            asChild
            className="h-7 w-7 rounded-md border-palnadu-border bg-white hover:bg-palnadu-light-blue hover:border-palnadu-blue"
          >
            <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.name}>
              {renderSocialIcon(link)}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}
