import { Mail } from 'lucide-react';

const MAILTO_URL =
  'mailto:hello@palnadu.dev?subject=Personal%20Data%20Deletion%20Request';

export function DataDeletionIntro() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-mono font-bold uppercase tracking-widest text-palnadu-blue">
        Data Protection &amp; Privacy Compliance
      </p>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-palnadu-dark tracking-tight">
        User Data Deletion Request
      </h1>
      <p className="text-xs font-mono text-palnadu-secondary">
        Effective Date: November 1, 2026
      </p>
      <p className="text-sm sm:text-base text-palnadu-body leading-relaxed pt-2">
        At Palnadu.dev, we respect your privacy and provide a transparent, accessible process to request the deletion of any personal information shared with us. This page provides clear instructions for website visitors, prospective clients, and users interacting with our services, including integrations operating via Meta Developer Platform applications (such as our Meta WhatsApp Cloud API integration).
      </p>
      <div className="p-4 rounded-xl border border-palnadu-border bg-palnadu-off-white/40 text-xs sm:text-sm text-palnadu-body space-y-1">
        <p className="font-semibold text-palnadu-dark">
          Public Access &amp; Meta Compliance Notice
        </p>
        <p>
          This page serves as Palnadu.dev&apos;s public User Data Deletion Instructions URL. Submitting a data deletion request does not require creating an account, authenticating, or logging in.
        </p>
      </div>
    </div>
  );
}

export function DataDeletionScope() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold text-palnadu-dark tracking-tight">
        1. Information Covered
      </h2>
      <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
        Based on verified application workflows across Palnadu.dev, a data deletion request covers the following categories of personal information collected through our website, contact forms, or direct technical communications:
      </p>
      <ul className="space-y-2 text-sm text-palnadu-body list-disc pl-5">
        <li>
          <strong className="text-palnadu-dark">Name &amp; Contact Details:</strong> Full name and associated company or startup name.
        </li>
        <li>
          <strong className="text-palnadu-dark">Direct Communication Addresses:</strong> Email address and telephone or WhatsApp contact number.
        </li>
        <li>
          <strong className="text-palnadu-dark">Project &amp; Enquiry Information:</strong> Problem descriptions, project stages, estimated budget ranges, and technical assistance selections submitted through our contact forms.
        </li>
        <li>
          <strong className="text-palnadu-dark">Communication Records:</strong> Message history, delivery receipts, and inbound inquiries exchanged with our official WhatsApp contact (<span className="font-mono text-xs text-palnadu-dark">+91-9030787819</span>) through our Meta WhatsApp Cloud API webhook integration, as well as direct email correspondence.
        </li>
        <li>
          <strong className="text-palnadu-dark">Technical &amp; Diagnostic Data:</strong> IP addresses, browser user-agent headers, and webhook audit records logged during website requests or form submissions.
        </li>
      </ul>
    </div>
  );
}

export function DataDeletionSteps() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold text-palnadu-dark tracking-tight">
        2. How to Request Data Deletion
      </h2>
      <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
        To request the permanent deletion of your personal data, submit your request through our administrative channel following these steps:
      </p>
      <div className="p-5 sm:p-6 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-4">
        <ol className="space-y-3 text-sm text-palnadu-body list-decimal pl-5">
          <li>
            Send an email to{' '}
            <a href={MAILTO_URL} className="font-semibold text-palnadu-blue underline hover:text-palnadu-dark">
              hello@palnadu.dev
            </a>.
          </li>
          <li>
            Set the email subject line to:{' '}
            <span className="font-mono text-xs font-semibold text-palnadu-dark bg-palnadu-light-blue px-2 py-0.5 rounded">
              Personal Data Deletion Request
            </span>
          </li>
          <li>
            Specify the email address and telephone or WhatsApp number associated with your previous interactions.
          </li>
          <li>
            Briefly describe the relevant inquiry, service consultation, or communication you wish to have removed. Do not include sensitive information such as passwords, banking details, or government identity numbers.
          </li>
          <li>
            Palnadu.dev may request reasonable confirmation from the associated email or telephone number to verify the authenticity of the requester before executing deletion.
          </li>
        </ol>
        <div className="pt-2">
          <a
            href={MAILTO_URL}
            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-palnadu-blue text-white hover:bg-palnadu-dark-hover px-4 py-2 transition-colors cursor-pointer shadow-sm"
          >
            <Mail className="h-4 w-4" />
            Email hello@palnadu.dev
          </a>
        </div>
      </div>
    </div>
  );
}
