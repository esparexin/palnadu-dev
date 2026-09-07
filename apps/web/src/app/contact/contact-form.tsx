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
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

const projectStageLabels: Record<string, string> = {
  JUST_AN_IDEA: 'Just an idea / Concept',
  EXISTING_BUSINESS: 'Existing business process',
  EXISTING_PRODUCT: 'Existing product needing improvement',
  EXISTING_WEBSITE: 'Existing website needing overhaul',
  MANUAL_PROCESS: 'Manual workflow needing automation',
  NEED_TECHNICAL_HELP: 'Need technical guidance / audit',
  OTHER: 'Other / Not sure',
};

const requiredHelpLabels: Record<string, string> = {
  NOT_SURE: 'Not sure (Help diagnose)',
  IDEA_VALIDATION: 'Idea validation & research',
  MVP_DEVELOPMENT: 'MVP development',
  WEB_APPLICATION: 'Web application',
  MOBILE_APPLICATION: 'Mobile application',
  CUSTOM_SOFTWARE: 'Custom software',
  AUTOMATION: 'Business automation',
  TECHNICAL_CONSULTING: 'Technical consulting & architecture',
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
      setError(err instanceof Error ? err.message : 'Failed to submit. Please check connection.');
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-cyan-500/40 bg-slate-950/80 p-8 sm:p-14 text-center backdrop-blur-2xl shadow-2xl animate-fade-in">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-white">We&apos;ve received your message</h3>
        <p className="mx-auto mt-3 max-w-md text-sm sm:text-base text-slate-300 leading-relaxed">
          An engineer from our team will review your problem and respond directly within 1-2 business days with honest advice.
        </p>
        <div className="mt-8">
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="border-slate-800 text-slate-300 hover:bg-slate-900"
          >
            Submit another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-3xl border border-slate-800/90 bg-slate-950/80 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider text-slate-300">
            Your Name <span className="text-cyan-400">*</span>
          </Label>
          <Input
            id="name"
            placeholder="John Doe"
            className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 h-11"
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-slate-300">
            Email Address <span className="text-cyan-400">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 h-11"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-xs font-mono uppercase tracking-wider text-slate-300">
            Phone / WhatsApp <span className="text-slate-500 font-normal">(Optional)</span>
          </Label>
          <Input
            id="phone"
            placeholder="+91 9876543210"
            className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 h-11"
            {...register('phone')}
          />
        </div>

        {/* Company */}
        <div className="space-y-2">
          <Label htmlFor="company" className="text-xs font-mono uppercase tracking-wider text-slate-300">
            Company / Project Name <span className="text-slate-500 font-normal">(Optional)</span>
          </Label>
          <Input
            id="company"
            placeholder="Acme Inc."
            className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 h-11"
            {...register('company')}
          />
        </div>
      </div>

      {/* Problem Description */}
      <div className="space-y-2">
        <Label htmlFor="problemDescription" className="text-xs font-mono uppercase tracking-wider text-slate-300">
          What is the problem you want solved? <span className="text-cyan-400">*</span>
        </Label>
        <Textarea
          id="problemDescription"
          placeholder="Describe the bottleneck, pain point, or idea you're trying to solve..."
          rows={5}
          className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600"
          {...register('problemDescription')}
        />
        {errors.problemDescription && (
          <p className="text-xs text-rose-400">{errors.problemDescription.message}</p>
        )}
      </div>

      {/* Current Situation */}
      <div className="space-y-2">
        <Label htmlFor="currentSituation" className="text-xs font-mono uppercase tracking-wider text-slate-300">
          How are you currently handling it? <span className="text-slate-500 font-normal">(Optional)</span>
        </Label>
        <Textarea
          id="currentSituation"
          placeholder="e.g. Using Excel spreadsheets, manual WhatsApp messages, or existing legacy software that is slow..."
          rows={3}
          className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600"
          {...register('currentSituation')}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Stage */}
        <div className="space-y-2">
          <Label className="text-xs font-mono uppercase tracking-wider text-slate-300">
            Current Stage <span className="text-cyan-400">*</span>
          </Label>
          <Select
            defaultValue="JUST_AN_IDEA"
            onValueChange={(val) => setValue('projectStage', val as CreateLeadInput['projectStage'])}
          >
            <SelectTrigger className="bg-slate-900/60 border-slate-800 text-white h-11">
              <SelectValue placeholder="Select current stage" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
              {Object.entries(projectStageLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Required Help */}
        <div className="space-y-2">
          <Label className="text-xs font-mono uppercase tracking-wider text-slate-300">
            Required Help <span className="text-cyan-400">*</span>
          </Label>
          <Select
            defaultValue="NOT_SURE"
            onValueChange={(val) =>
              setValue('requiredHelp', val as CreateLeadInput['requiredHelp'])
            }
          >
            <SelectTrigger className="bg-slate-900/60 border-slate-800 text-white h-11">
              <SelectValue placeholder="Select required help" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
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
        <Label htmlFor="budget" className="text-xs font-mono uppercase tracking-wider text-slate-300">
          Estimated Budget Range <span className="text-slate-500 font-normal">(Optional)</span>
        </Label>
        <Input
          id="budget"
          placeholder="e.g. ₹50,000 - ₹2 Lakhs, $3k - $10k, or Not Sure"
          className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 h-11"
          {...register('budget')}
        />
      </div>

      {/* Additional Info */}
      <div className="space-y-2">
        <Label htmlFor="additionalInfo" className="text-xs font-mono uppercase tracking-wider text-slate-300">
          Any other constraints or notes? <span className="text-slate-500 font-normal">(Optional)</span>
        </Label>
        <Textarea
          id="additionalInfo"
          placeholder="Deadlines, third-party services you already use, technical preferences, etc."
          rows={3}
          className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600"
          {...register('additionalInfo')}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="xl"
        className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-bold shadow-lg shadow-cyan-500/25 transition-all text-base h-12"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting your problem...
          </>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>Tell us your problem</span>
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </Button>

      <p className="text-center text-xs text-slate-500">
        No sales spam. We review your requirements and reply with genuine technical advice.
      </p>
    </form>
  );
}
