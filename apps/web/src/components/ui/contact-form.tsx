"use client";

import React, { useState, useRef } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema, type CreateLeadInput } from '@palnadu/validation';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@palnadu/config';
import { api } from '@/lib/api';
import {
  trackFormStart,
  trackFormSubmitAttempt,
  trackFormSubmitFailure,
  trackGenerateLead,
  trackContactChannelClick,
} from '@/lib/analytics';
import { renderSocialIcon, helpTypeMapping, type ContactSectionProps } from './contact-data';
import { ContactFormFields } from './contact-form-fields';
import { ContactSuccessState } from './contact-success-state';

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
  const hasStartedRef = useRef(false);

  const handleInteractionStart = () => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      trackFormStart({
        form_id: 'contact_form_main',
        form_name: 'Lead Contact Inquiry Form',
        source_page: '/contact',
      });
    }
  };

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

  const onValidationError = (validationErrors: FieldErrors<CreateLeadInput>) => {
    const firstField = Object.keys(validationErrors)[0] || 'unknown';
    const firstMessage = validationErrors[firstField as keyof CreateLeadInput]?.message || 'Validation failed';
    trackFormSubmitFailure({
      form_id: 'contact_form_main',
      form_name: 'Lead Contact Inquiry Form',
      error_message: String(firstMessage),
      error_field: firstField,
    });
  };

  const onFormSubmit = async (data: CreateLeadInput) => {
    setErrorMessage(null);
    trackFormSubmitAttempt({
      form_id: 'contact_form_main',
      form_name: 'Lead Contact Inquiry Form',
      source_page: '/contact',
      lead_category: data.requiredHelp || 'web_software_inquiry',
    });

    try {
      let createdId = `lead_${Date.now()}`;
      if (onSubmit) {
        await onSubmit({ ...data, projectType: selectedTypes });
      } else {
        const response = await api.leads.create({
          ...data,
          additionalInfo:
            selectedTypes.length > 0 ? `Interested in: ${selectedTypes.join(', ')}` : undefined,
        }) as { data?: { id?: string } };
        if (response?.data?.id) {
          createdId = response.data.id;
        }
      }

      setSubmitted(true);
      trackGenerateLead({
        form_id: 'contact_form_main',
        lead_id: createdId,
        lead_category: data.requiredHelp || 'web_software_inquiry',
        project_stage: data.projectStage || 'JUST_AN_IDEA',
        has_budget: Boolean(data.budget && data.budget.trim()),
        source_page: '/contact',
      });

      reset();
      setSelectedTypes([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setErrorMessage(message);
      trackFormSubmitFailure({
        form_id: 'contact_form_main',
        form_name: 'Lead Contact Inquiry Form',
        error_message: message,
      });
    }
  };

  if (submitted) {
    return (
      <ContactSuccessState
        onReset={() => {
          setSubmitted(false);
          setSelectedTypes([]);
        }}
      />
    );
  }

  return (
    <>
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

      <form
        onSubmit={handleSubmit(onFormSubmit, onValidationError)}
        onFocusCapture={handleInteractionStart}
        noValidate
        className="space-y-3"
      >
        <ContactFormFields
          register={register}
          errors={errors}
          projectTypeOptions={projectTypeOptions}
          selectedTypes={selectedTypes}
          onCheckboxToggle={handleCheckboxToggle}
        />

        {errorMessage && (
          <div role="alert" className="p-2 rounded-md bg-palnadu-error/5 border border-palnadu-error/30 text-xs text-palnadu-error font-medium">
            {errorMessage}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-palnadu-blue hover:bg-palnadu-dark-hover text-white font-semibold text-sm h-11 sm:h-10 rounded-md transition-colors shadow-sm mt-1 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Sending Message...' : 'Send Message →'}
        </Button>
      </form>
    </>
  );
}
