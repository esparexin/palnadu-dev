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
import { CheckCircle2, Loader2, ArrowRight, Lightbulb, Cog } from 'lucide-react';

type FormMode = 'IDEA' | 'PROCESS';

export function ContactForm() {
  const [formMode, setFormMode] = useState<FormMode>('IDEA');
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
      requiredHelp: 'MVP_DEVELOPMENT',
      budget: '',
    },
  });

  const handleModeSwitch = (mode: FormMode) => {
    setFormMode(mode);
    if (mode === 'IDEA') {
      setValue('projectStage', 'JUST_AN_IDEA');
      setValue('requiredHelp', 'MVP_DEVELOPMENT');
    } else {
      setValue('projectStage', 'MANUAL_PROCESS');
      setValue('requiredHelp', 'AUTOMATION');
    }
  };

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
      <div className="rounded-2xl border border-cyan-500/40 bg-slate-950/90 p-6 sm:p-10 text-center backdrop-blur-xl shadow-2xl animate-fade-in">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white">We&apos;ve received your inquiry</h3>
        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-300 leading-relaxed">
          An engineer from our team will review your requirements and reply directly within 1-2 business days with honest advice.
        </p>
        <div className="mt-5">
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            size="sm"
            className="border-slate-800 text-slate-300 hover:bg-slate-900"
          >
            Submit another inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-slate-800/90 bg-slate-950/80 p-4 sm:p-6 backdrop-blur-xl shadow-2xl"
    >
      {/* ─── Compact Mode Selector Pill ────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => handleModeSwitch('IDEA')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg font-medium transition-all ${
            formMode === 'IDEA'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <span className="truncate">I have a Business Idea / MVP</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeSwitch('PROCESS')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg font-medium transition-all ${
            formMode === 'PROCESS'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cog className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <span className="truncate">Automate a Manual Process</span>
        </button>
      </div>

      {/* ─── Row 1: Name & Email ──────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-xs font-mono text-slate-300">
            Your Name <span className="text-cyan-400">*</span>
          </Label>
          <Input
            id="name"
            placeholder="John Doe"
            className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 h-9 text-xs sm:text-sm"
            {...register('name')}
          />
          {errors.name && <p className="text-[11px] text-rose-400">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs font-mono text-slate-300">
            Email Address <span className="text-cyan-400">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 h-9 text-xs sm:text-sm"
            {...register('email')}
          />
          {errors.email && <p className="text-[11px] text-rose-400">{errors.email.message}</p>}
        </div>
      </div>

      {/* ─── Row 2: Phone & Company ───────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="phone" className="text-xs font-mono text-slate-300">
            Phone / WhatsApp <span className="text-slate-500 text-[10px]">(Optional)</span>
          </Label>
          <Input
            id="phone"
            placeholder="+91 9876543210"
            className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 h-9 text-xs sm:text-sm"
            {...register('phone')}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="company" className="text-xs font-mono text-slate-300">
            Company / Organization <span className="text-slate-500 text-[10px]">(Optional)</span>
          </Label>
          <Input
            id="company"
            placeholder="Company or Startup name"
            className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 h-9 text-xs sm:text-sm"
            {...register('company')}
          />
        </div>
      </div>

      {/* ─── Row 3: Dynamic Description Prompt ────────────────── */}
      <div className="space-y-1">
        <Label htmlFor="problemDescription" className="text-xs font-mono text-slate-300">
          {formMode === 'IDEA'
            ? 'What is your idea, and who are you building it for?'
            : 'What manual process or bottleneck do you want to automate?'}{' '}
          <span className="text-cyan-400">*</span>
        </Label>
        <Textarea
          id="problemDescription"
          placeholder={
            formMode === 'IDEA'
              ? 'Tell us briefly about the product you want to build and what problem it solves...'
              : 'Tell us what tasks are currently done by hand (e.g. WhatsApp orders, paper registers, Excel sheets)...'
          }
          rows={3}
          className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 text-xs sm:text-sm py-2"
          {...register('problemDescription')}
        />
        {errors.problemDescription && (
          <p className="text-[11px] text-rose-400">{errors.problemDescription.message}</p>
        )}
      </div>

      {/* ─── Row 4: Budget / Expectations (Compact) ──────────── */}
      <div className="space-y-1">
        <Label htmlFor="budget" className="text-xs font-mono text-slate-300">
          Estimated Budget Range <span className="text-slate-500 text-[10px]">(Optional)</span>
        </Label>
        <Input
          id="budget"
          placeholder="e.g. ₹50,000 - ₹2 Lakhs, $2k - $5k, or Not Sure"
          className="bg-slate-900/60 border-slate-800 focus-visible:ring-cyan-400 text-white placeholder:text-slate-600 h-9 text-xs sm:text-sm"
          {...register('budget')}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 p-2.5 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* ─── Submit Action ───────────────────────────────────── */}
      <Button
        type="submit"
        size="lg"
        className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-bold shadow-lg shadow-cyan-500/20 text-xs sm:text-sm h-10"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending to engineers...
          </>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>Send to our engineering team</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
      </Button>

      <p className="text-center text-[11px] text-slate-400">
        Direct engineer consultation • No sales spam • We respond in 1-2 business days
      </p>
    </form>
  );
}
