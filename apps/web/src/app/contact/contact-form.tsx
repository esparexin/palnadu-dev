'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema, type CreateLeadInput } from '@palnadu/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { CheckCircle, Loader2 } from 'lucide-react';

const projectStageLabels: Record<string, string> = {
  JUST_AN_IDEA: 'Just an idea',
  EXISTING_BUSINESS: 'Existing business',
  EXISTING_PRODUCT: 'Existing product',
  EXISTING_WEBSITE: 'Existing website',
  MANUAL_PROCESS: 'Manual process',
  NEED_TECHNICAL_HELP: 'Need technical help',
  OTHER: 'Other',
};

const requiredHelpLabels: Record<string, string> = {
  IDEA_VALIDATION: 'Idea validation',
  WEB_APPLICATION: 'Web application',
  MOBILE_APPLICATION: 'Mobile application',
  CUSTOM_SOFTWARE: 'Custom software',
  AUTOMATION: 'Automation',
  TECHNICAL_CONSULTING: 'Technical consulting',
  MVP_DEVELOPMENT: 'MVP development',
  NOT_SURE: 'Not sure',
};

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      projectStage: 'JUST_AN_IDEA',
      requiredHelp: 'NOT_SURE',
    },
  });

  const onSubmit = async (data: CreateLeadInput) => {
    try {
      setError(null);
      await api.leads.create(data);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold">Thank you for reaching out</h3>
        <p className="mt-2 text-muted-foreground">
          We&apos;ve received your message and will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border bg-card p-8">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input id="name" placeholder="Your name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input id="email" type="email" placeholder="your@email.com" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="Your phone number" {...register('phone')} />
        </div>

        {/* Company */}
        <div className="space-y-2">
          <Label htmlFor="company">Company / Organization</Label>
          <Input id="company" placeholder="Your company name" {...register('company')} />
        </div>
      </div>

      {/* Problem Description */}
      <div className="space-y-2">
        <Label htmlFor="problemDescription">
          What problem are you trying to solve? <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="problemDescription"
          placeholder="Describe the problem you're facing or the idea you want to explore..."
          rows={5}
          {...register('problemDescription')}
        />
        {errors.problemDescription && (
          <p className="text-sm text-destructive">{errors.problemDescription.message}</p>
        )}
      </div>

      {/* Current Situation */}
      <div className="space-y-2">
        <Label htmlFor="currentSituation">Current situation</Label>
        <Textarea
          id="currentSituation"
          placeholder="How are you currently handling this? What's not working?"
          rows={3}
          {...register('currentSituation')}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Stage */}
        <div className="space-y-2">
          <Label>
            Project stage <span className="text-destructive">*</span>
          </Label>
          <Select
            defaultValue="JUST_AN_IDEA"
            onValueChange={(val) => setValue('projectStage', val as CreateLeadInput['projectStage'])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(projectStageLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectStage && (
            <p className="text-sm text-destructive">{errors.projectStage.message}</p>
          )}
        </div>

        {/* Required Help */}
        <div className="space-y-2">
          <Label>
            What help do you need? <span className="text-destructive">*</span>
          </Label>
          <Select
            defaultValue="NOT_SURE"
            onValueChange={(val) =>
              setValue('requiredHelp', val as CreateLeadInput['requiredHelp'])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(requiredHelpLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label htmlFor="budget">Budget (optional)</Label>
        <Input
          id="budget"
          placeholder="Approximate budget range"
          {...register('budget')}
        />
      </div>

      {/* Additional Info */}
      <div className="space-y-2">
        <Label htmlFor="additionalInfo">Additional information</Label>
        <Textarea
          id="additionalInfo"
          placeholder="Anything else you'd like us to know?"
          rows={3}
          {...register('additionalInfo')}
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Tell us your problem'
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        We&apos;ll review your message and respond within 1-2 business days.
      </p>
    </form>
  );
}
