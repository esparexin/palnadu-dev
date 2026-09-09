"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema, type CreateLeadInput } from '@palnadu/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { siteConfig } from '@palnadu/config';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

export interface ContactSectionProps {
  /**
   * The title for the contact section.
   */
  title?: string;
  /**
   * The subtitle or main message for the introductory part.
   */
  mainMessage?: string;
  /**
   * The contact email to display.
   */
  contactEmail?: string;
  /**
   * Array of social media links. Each object should have an 'id', 'name', 'iconSrc', and 'href'.
   */
  socialLinks?: Array<{ id: string; name: string; iconSrc: string; href: string }>;
  /**
   * Placeholder image for the background.
   */
  backgroundImageSrc?: string;
  /**
   * List of project types for checkboxes.
   */
  projectTypeOptions?: string[];
  /**
   * Whether to display the top navbar inside the section.
   */
  showNav?: boolean;
  /**
   * Callback function when the form is submitted.
   * @param data The form data.
   */
  onSubmit?: (data: any) => void;
  className?: string;
}

const defaultSocialLinks = [
  { id: '1', name: 'X', iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg', href: siteConfig.links.twitter },
  { id: '2', name: 'LinkedIn', iconSrc: 'https://cdn.21st.dev/assets/mirror/26/2687ac468d96bd03e748dc8646ef6465cb4cc7f34b96e1d0bc86fcb3dd79121a.svg', href: siteConfig.links.linkedin },
  { id: '3', name: 'GitHub', iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg', href: siteConfig.links.github },
];

const defaultProjectTypes = [
  'Web Application',
  'Mobile App',
  'MVP Development',
  'Custom Software',
  'Business Automation',
  'Technical Consulting',
  'Idea Validation',
  'Other',
];

const helpTypeMapping: Record<string, CreateLeadInput['requiredHelp']> = {
  'Web Application': 'WEB_APPLICATION',
  'Mobile App': 'MOBILE_APPLICATION',
  'MVP Development': 'MVP_DEVELOPMENT',
  'Custom Software': 'CUSTOM_SOFTWARE',
  'Business Automation': 'AUTOMATION',
  'Technical Consulting': 'TECHNICAL_CONSULTING',
  'Idea Validation': 'IDEA_VALIDATION',
  'Other': 'NOT_SURE',
};

export const ContactSection: React.FC<ContactSectionProps> = ({
  title = "We turn real-world problems into practical digital solutions",
  mainMessage = "Let's talk! 👋",
  contactEmail = siteConfig.contact.email,
  socialLinks = defaultSocialLinks,
  backgroundImageSrc = "https://cdn.21st.dev/assets/mirror/96/96fdf2b6baa37ce1a93e8bbc4f9af1ad007f689c5df9b1b78d2f7a8df47a450b.jpg",
  projectTypeOptions = defaultProjectTypes,
  showNav = false,
  onSubmit,
  className,
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Zod-validated react-hook-form integration
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
      const updated = prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type];
      
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
        await onSubmit({
          ...data,
          projectType: selectedTypes,
        });
      } else {
        await api.leads.create({
          ...data,
          additionalInfo:
            selectedTypes.length > 0
              ? `Interested in: ${selectedTypes.join(', ')}`
              : undefined,
        });
      }
      setSubmitted(true);
      reset();
      setSelectedTypes([]);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    }
  };

  return (
    <section className={cn("relative min-h-[90vh] w-full overflow-hidden bg-white text-palnadu-dark", className)}>
      {/* Background Image with Palnadu Primary Dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 ease-in-out"
        style={{ backgroundImage: `url(${backgroundImageSrc})` }}
      >
        {/* Palnadu Primary Dark tint overlay (#042C53) */}
        <div className="absolute inset-0 bg-palnadu-dark/70 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-palnadu-dark/95 via-palnadu-dark/75 to-palnadu-dark/50" />

        {/* Animated Bubbles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/20 rounded-full animate-bubble opacity-0"
              style={{
                width: `${(i % 4) * 6 + 10}px`,
                height: `${(i % 4) * 6 + 10}px`,
                left: `${(i * 7) % 100}%`,
                animationDelay: `${(i * 1.3) % 8}s`,
                animationDuration: `${14 + (i % 6) * 2}s`,
                top: `${(i * 9) % 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content Container — Top-aligned, responsive padding */}
      <div className="relative z-10 flex flex-col items-center justify-start w-full h-full px-3 py-3 sm:px-6 sm:py-6 md:px-8 lg:px-12">
        {/* Optional Sub-Navigation Bar */}
        {showNav && (
          <nav className="w-full max-w-6xl flex items-center justify-between p-3.5 bg-white/90 backdrop-blur-md rounded-xl border border-palnadu-border shadow-md mb-4">
            <span className="font-extrabold text-lg text-palnadu-dark">Palnadu<span className="text-palnadu-blue">.dev</span></span>
            <Button asChild size="sm" className="bg-palnadu-blue text-white hover:bg-[#12487e]">
              <a href="#contact-card">Get in touch</a>
            </Button>
          </nav>
        )}

        {/* Mobile Header (Concise & Compact — does NOT occupy the whole page) */}
        <div className="lg:hidden text-center space-y-1 my-2 max-w-sm">
          <p className="text-[10px] font-mono uppercase tracking-widest text-palnadu-light-blue font-bold">
            Start With The Problem
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-sm">
            {title}
          </h1>
        </div>

        {/* Main Grid: Desktop 2-Column (Left Headline, Right Form) | Mobile Form-First */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 w-full max-w-6xl pb-8" id="contact-card">
          {/* Desktop Left Side: Headline & Brand Statement (Hidden on small mobile to avoid occupying whole screen) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center p-4 lg:p-6 space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-palnadu-light-blue font-bold">
              Start With The Problem
            </p>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight drop-shadow-md">
              {title}
            </h1>
            <p className="text-sm text-palnadu-light-blue/90 leading-relaxed max-w-md">
              Have an idea, or need to automate a manual process? Talk directly with the software engineers building your solution.
            </p>
          </div>

          {/* Right Side: Contact Form Card (Compact & Streamlined) */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md p-4 sm:p-6 lg:p-7 rounded-xl sm:rounded-2xl shadow-xl border border-palnadu-border">
            {submitted ? (
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
            ) : (
              <>
                {/* Compact Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-palnadu-border/60">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-palnadu-dark">{mainMessage}</h2>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-xs font-semibold text-palnadu-blue hover:underline"
                    >
                      {contactEmail}
                    </a>
                  </div>

                  {/* Social Channel Links */}
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
                          <img src={link.iconSrc} alt={link.name} className="h-3 w-3" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Form with Zod Validation */}
                <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Name Field */}
                    <div className="space-y-0.5">
                      <Label htmlFor="name" className="text-xs font-semibold text-palnadu-dark">
                        Your Name <span className="text-palnadu-error">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g. John Doe"
                        aria-invalid={!!errors.name}
                        className={cn(
                          "bg-white text-palnadu-body text-xs h-8 rounded-md transition-colors",
                          errors.name
                            ? "border-palnadu-error focus-visible:ring-palnadu-error"
                            : "border-palnadu-border focus-visible:ring-palnadu-blue"
                        )}
                        {...register('name')}
                      />
                      {errors.name && (
                        <p className="text-[11px] text-palnadu-error font-medium">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-0.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-palnadu-dark">
                        Email Address <span className="text-palnadu-error">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        aria-invalid={!!errors.email}
                        className={cn(
                          "bg-white text-palnadu-body text-xs h-8 rounded-md transition-colors",
                          errors.email
                            ? "border-palnadu-error focus-visible:ring-palnadu-error"
                            : "border-palnadu-border focus-visible:ring-palnadu-blue"
                        )}
                        {...register('email')}
                      />
                      {errors.email && (
                        <p className="text-[11px] text-palnadu-error font-medium">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Phone Field */}
                    <div className="space-y-0.5">
                      <Label htmlFor="phone" className="text-xs font-semibold text-palnadu-dark">
                        Phone or WhatsApp
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        aria-invalid={!!errors.phone}
                        className={cn(
                          "bg-white text-palnadu-body text-xs h-8 rounded-md transition-colors",
                          errors.phone
                            ? "border-palnadu-error focus-visible:ring-palnadu-error"
                            : "border-palnadu-border focus-visible:ring-palnadu-blue"
                        )}
                        {...register('phone')}
                      />
                      {errors.phone && (
                        <p className="text-[11px] text-palnadu-error font-medium">{errors.phone.message}</p>
                      )}
                    </div>

                    {/* Company Field */}
                    <div className="space-y-0.5">
                      <Label htmlFor="company" className="text-xs font-semibold text-palnadu-dark">
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
                    {/* Project Stage */}
                    <div className="space-y-0.5">
                      <Label htmlFor="projectStage" className="text-xs font-semibold text-palnadu-dark">
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

                    {/* Budget Range */}
                    <div className="space-y-0.5">
                      <Label htmlFor="budget" className="text-xs font-semibold text-palnadu-dark">
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

                  {/* Message Field */}
                  <div className="space-y-0.5">
                    <Label htmlFor="problemDescription" className="text-xs font-semibold text-palnadu-dark">
                      What problem are you trying to solve? <span className="text-palnadu-error">*</span>
                    </Label>
                    <Textarea
                      id="problemDescription"
                      placeholder="Briefly describe your idea, manual process, or technical challenge..."
                      rows={3}
                      aria-invalid={!!errors.problemDescription}
                      className={cn(
                        "bg-white text-palnadu-body text-xs py-1.5 rounded-md transition-colors",
                        errors.problemDescription
                          ? "border-palnadu-error focus-visible:ring-palnadu-error"
                          : "border-palnadu-border focus-visible:ring-palnadu-blue"
                      )}
                      {...register('problemDescription')}
                    />
                    {errors.problemDescription && (
                      <p className="text-[11px] text-palnadu-error font-medium">{errors.problemDescription.message}</p>
                    )}
                  </div>

                  {/* Project Type Multi-select Checkboxes */}
                  <div className="space-y-1.5 pt-0.5">
                    <p className="text-xs font-semibold text-palnadu-dark">
                      Help needed with:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {projectTypeOptions.map((option) => {
                        const id = option.replace(/\s+/g, '-').toLowerCase();
                        const isChecked = selectedTypes.includes(option);
                        return (
                          <div
                            key={option}
                            className={cn(
                              "flex items-center space-x-1.5 p-1.5 rounded-md border transition-colors cursor-pointer",
                              isChecked
                                ? "border-palnadu-blue bg-palnadu-light-blue/60"
                                : "border-palnadu-border/70 bg-palnadu-off-white/40 hover:bg-palnadu-light-blue/30"
                            )}
                            onClick={() => handleCheckboxToggle(option)}
                          >
                            <Checkbox
                              id={id}
                              checked={isChecked}
                              onCheckedChange={() => handleCheckboxToggle(option)}
                            />
                            <Label
                              htmlFor={id}
                              className="text-[10px] font-medium text-palnadu-dark cursor-pointer select-none leading-none truncate"
                            >
                              {option}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {errorMessage && (
                    <div role="alert" className="p-2 rounded-md bg-red-50 border border-palnadu-error/40 text-xs text-palnadu-error font-medium">
                      {errorMessage}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-palnadu-blue hover:bg-[#12487e] text-white font-semibold text-xs h-9 rounded-md transition-colors shadow-xs mt-1 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message →'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bubble Animation Keyframes */}
      <style jsx global>{`
        @keyframes bubble {
          0% {
            transform: translateY(0) translateX(0) scale(0.6);
            opacity: 0;
          }
          30% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-90vh) translateX(40px) scale(1.15);
            opacity: 0;
          }
        }
        .animate-bubble {
          animation: bubble var(--animation-duration, 16s) ease-in-out infinite;
          animation-fill-mode: forwards;
        }
      `}</style>
    </section>
  );
};

export default ContactSection;
