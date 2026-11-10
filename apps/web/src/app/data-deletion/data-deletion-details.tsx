import Link from 'next/link';
import { siteConfig } from '@palnadu/config';
import { ShieldCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const MAILTO_URL =
  'mailto:hello@palnadu.dev?subject=Personal%20Data%20Deletion%20Request';

export function DataDeletionProcess() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold text-palnadu-dark tracking-tight">
        3. What Happens After a Request?
      </h2>
      <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
        Data deletion requests are processed manually by our engineering administration team under strict internal controls. We do not use unmonitored automated deletion bots. The verified handling procedure includes:
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="p-4 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-palnadu-blue">
            <Clock className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">1. Acknowledgment</h3>
          </div>
          <p className="text-xs text-palnadu-body leading-relaxed">
            We acknowledge receipt of your deletion request within 48 business hours via reply email.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-palnadu-blue">
            <ShieldCheck className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">2. Verification</h3>
          </div>
          <p className="text-xs text-palnadu-body leading-relaxed">
            We verify that the request originates from the verified owner of the email or phone number to prevent unauthorized removal.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-palnadu-blue">
            <CheckCircle2 className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">3. Record Deletion</h3>
          </div>
          <p className="text-xs text-palnadu-body leading-relaxed">
            Verified records across our lead database, WhatsApp messaging tables, and contact dossiers are permanently purged.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-palnadu-blue">
            <AlertCircle className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">4. Third-Party Scope</h3>
          </div>
          <p className="text-xs text-palnadu-body leading-relaxed">
            We delete data stored on our servers. Upstream infrastructure (such as Meta&apos;s WhatsApp network) processes logs under Meta&apos;s privacy framework.
          </p>
        </div>
      </div>
      <p className="text-xs text-palnadu-secondary leading-relaxed pt-1">
        Upon completion of the deletion process, we issue a written confirmation to your email address confirming that all eligible personal data has been erased.
      </p>
    </div>
  );
}

export function DataDeletionExceptions() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold text-palnadu-dark tracking-tight">
        4. Data Retention and Legal Exceptions
      </h2>
      <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
        While we honor all legitimate data deletion requests, certain categories of records may be retained where legally required or strictly necessary to satisfy statutory obligations under applicable Indian law:
      </p>
      <ul className="space-y-2 text-sm text-palnadu-body list-disc pl-5">
        <li>
          <strong className="text-palnadu-dark">Statutory Accounting &amp; Taxation:</strong> Formal invoices, payment vouchers, and commercial contracts for paid software engineering engagements must be retained to satisfy statutory audit requirements.
        </li>
        <li>
          <strong className="text-palnadu-dark">Security &amp; Abuse Prevention:</strong> Diagnostic and server security logs required to protect application infrastructure against unauthorized access or malicious activities.
        </li>
        <li>
          <strong className="text-palnadu-dark">Dispute Resolution:</strong> Documentation necessary to establish, exercise, or defend existing legal claims or contractual rights.
        </li>
      </ul>
    </div>
  );
}

export function DataDeletionContact() {
  return (
    <div className="p-5 sm:p-6 rounded-xl border border-palnadu-border bg-palnadu-off-white/40 space-y-3">
      <h2 className="text-lg font-bold text-palnadu-dark">
        5. Contact Information
      </h2>
      <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed">
        For privacy inquiries, technical grievance correspondence, or assistance with personal data deletion:
      </p>
      <div className="text-xs text-palnadu-body space-y-1 font-mono">
        <p>
          <strong className="font-sans text-palnadu-dark font-semibold">Entity:</strong>{' '}
          Palnadu.dev Engineering Administration
        </p>
        <p>
          <strong className="font-sans text-palnadu-dark font-semibold">Email:</strong>{' '}
          <a href={MAILTO_URL} className="text-palnadu-blue underline hover:text-palnadu-dark font-sans">
            {siteConfig.contact.email}
          </a>
        </p>
        <p>
          <strong className="font-sans text-palnadu-dark font-semibold">Phone / WhatsApp:</strong>{' '}
          <a href={`tel:${siteConfig.contact.phone}`} className="text-palnadu-blue underline hover:text-palnadu-dark font-sans">
            {siteConfig.contact.phone}
          </a>
        </p>
        <p>
          <strong className="font-sans text-palnadu-dark font-semibold">Website:</strong>{' '}
          <a href={siteConfig.url} className="text-palnadu-blue underline hover:text-palnadu-dark font-sans">
            {siteConfig.url}
          </a>
        </p>
        <p>
          <strong className="font-sans text-palnadu-dark font-semibold">Headquarters:</strong>{' '}
          <span className="font-sans">Palnadu District, Andhra Pradesh, India</span>
        </p>
      </div>
      <div className="pt-2 flex flex-wrap gap-4 text-xs">
        <Link href="/privacy" className="text-palnadu-blue font-semibold hover:underline">
          &larr; Privacy Policy
        </Link>
        <Link href="/terms" className="text-palnadu-blue font-semibold hover:underline">
          Terms of Service &rarr;
        </Link>
        <Link href="/contact" className="text-palnadu-blue font-semibold hover:underline">
          Contact Us &rarr;
        </Link>
      </div>
    </div>
  );
}
