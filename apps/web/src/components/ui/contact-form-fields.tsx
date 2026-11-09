"use client";

import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CreateLeadInput } from '@palnadu/validation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface ContactFormFieldsProps {
  register: UseFormRegister<CreateLeadInput>;
  errors: FieldErrors<CreateLeadInput>;
  projectTypeOptions: string[];
  selectedTypes: string[];
  onCheckboxToggle: (_type: string) => void;
}

export function ContactFormFields({
  register,
  errors,
  projectTypeOptions,
  selectedTypes,
  onCheckboxToggle,
}: ContactFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-0.5">
          <Label htmlFor="name" className="text-xs sm:text-sm font-semibold text-palnadu-dark">
            Your Name <span className="text-palnadu-error">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g. John Doe"
            aria-invalid={!!errors.name}
            className={cn(
              "bg-white text-palnadu-body text-xs h-8 rounded-md transition-colors",
              errors.name ? "border-palnadu-error focus-visible:ring-palnadu-error" : "border-palnadu-border focus-visible:ring-palnadu-blue"
            )}
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-palnadu-error font-medium">{errors.name.message}</p>}
        </div>

        <div className="space-y-0.5">
          <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-palnadu-dark">
            Email Address <span className="text-palnadu-error">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            aria-invalid={!!errors.email}
            className={cn(
              "bg-white text-palnadu-body text-xs h-8 rounded-md transition-colors",
              errors.email ? "border-palnadu-error focus-visible:ring-palnadu-error" : "border-palnadu-border focus-visible:ring-palnadu-blue"
            )}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-palnadu-error font-medium">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-0.5">
          <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold text-palnadu-dark">
            Phone or WhatsApp
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            aria-invalid={!!errors.phone}
            className={cn(
              "bg-white text-palnadu-body text-xs h-8 rounded-md transition-colors",
              errors.phone ? "border-palnadu-error focus-visible:ring-palnadu-error" : "border-palnadu-border focus-visible:ring-palnadu-blue"
            )}
            {...register('phone')}
          />
          {errors.phone && <p className="text-xs text-palnadu-error font-medium">{errors.phone.message}</p>}
        </div>

        <div className="space-y-0.5">
          <Label htmlFor="company" className="text-xs sm:text-sm font-semibold text-palnadu-dark">
            Company or Startup Name
          </Label>
          <Input
            id="company"
            placeholder="e.g. Acme Corp / Stealth"
            className="bg-white border-palnadu-border text-palnadu-body text-xs h-8 rounded-md focus-visible:ring-palnadu-blue"
            {...register('company')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-0.5">
          <Label htmlFor="projectStage" className="text-xs sm:text-sm font-semibold text-palnadu-dark">
            Project Stage
          </Label>
          <select
            id="projectStage"
            className="w-full bg-white border border-palnadu-border text-palnadu-body text-xs h-8 rounded-md px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
            {...register('projectStage')}
          >
            <option value="JUST_AN_IDEA">Just an idea / Concept</option>
            <option value="EXISTING_BUSINESS">Existing business workflow</option>
            <option value="EXISTING_PRODUCT">Existing software / MVP update</option>
            <option value="MANUAL_PROCESS">Manual process automation</option>
            <option value="NEED_TECHNICAL_HELP">Need technical consulting</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <Label htmlFor="budget" className="text-xs sm:text-sm font-semibold text-palnadu-dark">
            Estimated Budget
          </Label>
          <select
            id="budget"
            className="w-full bg-white border border-palnadu-border text-palnadu-body text-xs h-8 rounded-md px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
            {...register('budget')}
          >
            <option value="">Flexible / Exploring options</option>
            <option value="Under ₹1 Lakh / $1.2k">Under ₹1 Lakh (&lt; $1.2k)</option>
            <option value="₹1L - ₹3L / $1.2k-$3.5k">₹1 Lakh – ₹3 Lakh ($1.2k–$3.5k)</option>
            <option value="₹3L - ₹8L / $3.5k-$10k">₹3 Lakh – ₹8 Lakh ($3.5k–$10k)</option>
            <option value="₹8L+ / $10k+">₹8 Lakh+ ($10k+)</option>
          </select>
        </div>
      </div>

      <div className="space-y-0.5">
        <Label htmlFor="problemDescription" className="text-xs sm:text-sm font-semibold text-palnadu-dark">
          What problem are you trying to solve? <span className="text-palnadu-error">*</span>
        </Label>
        <Textarea
          id="problemDescription"
          placeholder="Briefly describe your idea, manual process, or technical challenge..."
          rows={3}
          aria-invalid={!!errors.problemDescription}
          className={cn(
            "bg-white text-palnadu-body text-xs py-1.5 rounded-md transition-colors",
            errors.problemDescription ? "border-palnadu-error focus-visible:ring-palnadu-error" : "border-palnadu-border focus-visible:ring-palnadu-blue"
          )}
          {...register('problemDescription')}
        />
        {errors.problemDescription && <p className="text-xs text-palnadu-error font-medium">{errors.problemDescription.message}</p>}
      </div>

      <div className="space-y-1.5 pt-0.5">
        <p className="text-xs sm:text-sm font-semibold text-palnadu-dark">Help needed with:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {projectTypeOptions.map((option) => {
            const id = option.replace(/\s+/g, '-').toLowerCase();
            const isChecked = selectedTypes.includes(option);
            return (
              <div
                key={option}
                className={cn(
                  "flex items-center space-x-1.5 p-1.5 rounded-md border transition-colors cursor-pointer",
                  isChecked ? "border-palnadu-blue bg-palnadu-light-blue/60" : "border-palnadu-border/70 bg-palnadu-off-white/40 hover:bg-palnadu-light-blue/30"
                )}
                onClick={() => onCheckboxToggle(option)}
              >
                <Checkbox id={id} checked={isChecked} onCheckedChange={() => onCheckboxToggle(option)} />
                <Label htmlFor={id} className="text-xs font-medium text-palnadu-dark cursor-pointer select-none leading-none truncate">
                  {option}
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
