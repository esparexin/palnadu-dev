"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema, type CreateLeadInput } from '@palnadu/validation';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@palnadu/config';
import { api } from '@/lib/api';
import { CheckCircle2 } from 'lucide-react';
import { renderSocialIcon, helpTypeMapping, type ContactSectionProps } from './contact-data';
import { ContactFormFields } from './contact-form-fields';

interface ContactFormProps {
  mainMessage: string;
  contactEmail: string;
  socialLinks: NonNullable<ContactSectionProps['socialLinks']>;
  projectTypeOptions: string[];
  onSubmit?: (_data: any) => void;
}

export function ContactFormCard({
  mainMessage,
  contactEmail,
  socialLinks,
  projectTypeOptions,
  onSubmit,
}: ContactFormProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      budget: '',
      problemDescription: '',
      projectStage: 'JUST_AN_IDEA',
      requiredHelp: 'NOT_SURE',
    },
  });

  const handleCheckboxToggle = (type: string) => {
    setSelectedTypes((prev) => {
      const updated = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type];
      if (updated.length > 0) {
        const primaryHelp = helpTypeMapping[updated[0]] || 'NOT_SURE';
        setValue('requiredHelp', primaryHelp);
        setValue('additionalInfo', `Interested in: ${updated.join(', ')}`);
      } else {
        setValue('requiredHelp', 'NOT_SURE');
        setValue('additionalInfo', undefined);
      }
      return updated;
    });
  };

  const onFormSubmit = async (data: CreateLeadInput) => {
    setErrorMessage(null);
    try {
      if (onSubmit) {
        await onSubmit({ ...data, projectType: selectedTypes });
      } else {
        await api.leads.create({
          ...data,
          additionalInfo:
            selectedTypes.length > 0 ? `Interested in: ${selectedTypes.join(', ')}` : undefined,
        });
      }
      setSubmitted(true);
      if (typeof window !== 'undefined') {
        const win = window as any;
        win.dataLayer = win.dataLayer || [];
        win.dataLayer.push({
          event: 'generate_lead',
          lead_category: data.requiredHelp || 'web_software_inquiry',
          project_stage: data.projectStage || 'JUST_AN_IDEA',
        });
        if (typeof win.gtag === 'function') {
          win.gtag('event', 'generate_lead', {
            event_category: 'engagement',
            event_label: data.requiredHelp || 'inquiry',
          });
        }
      }
      reset();
      setSelectedTypes([]);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="py-10 text-center space-y-3 animate-fade-in">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-palnadu-light-blue text-palnadu-teal mx-auto">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-bold text-palnadu-dark">Message Received</h3>
        <p className="text-xs text-palnadu-body max-w-xs mx-auto leading-relaxed">
          Thank you. We have received your inquiry and will reply with honest engineering advice within one business day.
        </p>
        <div className="pt-2">
          <Button
            onClick={() => {
              setSubmitted(false);
              setSelectedTypes([]);
            }}
            variant="outline"
            className="border-palnadu-blue text-palnadu-blue hover:bg-palnadu-light-blue rounded-md text-xs px-4 h-8"
          >
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-palnadu-border/60">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-palnadu-dark">{mainMessage}</h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <a href={`mailto:${contactEmail}`} className="font-semibold text-palnadu-blue hover:underline">
              {contactEmail}
            </a>
            {siteConfig.contact.phone && (
              <>
                <span className="text-palnadu-secondary/60">•</span>
                <a href={`tel:${siteConfig.contact.phone}`} className="font-semibold font-mono text-palnadu-blue hover:underline">
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

      <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-3">
        <ContactFormFields
          register={register}
          errors={errors}
          projectTypeOptions={projectTypeOptions}
          selectedTypes={selectedTypes}
          onCheckboxToggle={handleCheckboxToggle}
        />

        {errorMessage && (
          <div role="alert" className="p-2 rounded-md bg-red-50 border border-palnadu-error/40 text-xs text-palnadu-error font-medium">
            {errorMessage}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-palnadu-blue hover:bg-palnadu-dark-hover text-white font-semibold text-sm h-11 sm:h-10 rounded-md transition-colors shadow-sm mt-1 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Sending...' : 'Send Message →'}
        </Button>
      </form>
    </>
  );
}
