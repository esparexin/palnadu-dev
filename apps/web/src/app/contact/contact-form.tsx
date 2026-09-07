'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema, type CreateLeadInput } from '@palnadu/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      projectStage: 'JUST_AN_IDEA',
      requiredHelp: 'NOT_SURE',
      phone: '',
      company: '',
      budget: '',
      currentSituation: '',
      additionalInfo: '',
    },
  });

  const onSubmit = async (data: CreateLeadInput) => {
    try {
      setError(null);
      await api.leads.create(data);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 sm:p-8 text-center">
        <h3 className="text-lg font-semibold text-white">Message Sent</h3>
        <p className="mt-2 text-sm text-slate-300">
          Thank you. We have received your inquiry and will reply to your email within one business day.
        </p>
        <div className="mt-5">
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            size="sm"
            className="border-slate-800 text-slate-300 hover:bg-slate-900"
          >
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6"
    >
      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="name" className="text-xs text-slate-300 font-medium">
          Name <span className="text-cyan-400">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Your name"
          className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-9 text-sm"
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1">
        <Label htmlFor="email" className="text-xs text-slate-300 font-medium">
          Email <span className="text-cyan-400">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-9 text-sm"
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div className="space-y-1">
        <Label htmlFor="phone" className="text-xs text-slate-300 font-medium">
          Phone or WhatsApp <span className="text-slate-500 text-xs">(optional)</span>
        </Label>
        <Input
          id="phone"
          placeholder="Phone number"
          className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-9 text-sm"
          {...register('phone')}
        />
      </div>

      {/* Message */}
      <div className="space-y-1">
        <Label htmlFor="problemDescription" className="text-xs text-slate-300 font-medium">
          What do you want to build or solve? <span className="text-cyan-400">*</span>
        </Label>
        <Textarea
          id="problemDescription"
          placeholder="Briefly describe your idea, or the manual problem you want to automate..."
          rows={4}
          className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 text-sm py-2"
          {...register('problemDescription')}
        />
        {errors.problemDescription && (
          <p className="text-xs text-rose-400">{errors.problemDescription.message}</p>
        )}
      </div>

      {/* Budget */}
      <div className="space-y-1">
        <Label htmlFor="budget" className="text-xs text-slate-300 font-medium">
          Estimated budget <span className="text-slate-500 text-xs">(optional)</span>
        </Label>
        <Input
          id="budget"
          placeholder="Approximate budget (optional)"
          className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-9 text-sm"
          {...register('budget')}
        />
      </div>

      {error && (
        <div className="rounded-md border border-rose-500/30 bg-rose-950/40 p-2.5 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full bg-white text-slate-950 hover:bg-slate-200 font-medium text-sm h-10 transition-colors"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
