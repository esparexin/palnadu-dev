import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for Palnadu.dev.',
};

export default function TermsPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl prose prose-neutral dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h2>Services</h2>
          <p>
            Palnadu.dev provides technology consulting, software development, and related services.
            Specific terms for each project are agreed upon separately before work begins.
          </p>

          <h2>Project Agreements</h2>
          <p>
            All project work is governed by specific agreements that outline scope, timeline,
            deliverables, and payment terms. These are agreed upon before development begins.
          </p>

          <h2>Intellectual Property</h2>
          <p>
            Upon full payment, clients receive ownership of custom code developed for their
            projects. Third-party tools, frameworks, and libraries remain under their respective
            licenses.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            Palnadu.dev provides services on a best-effort basis. We are not liable for indirect,
            incidental, or consequential damages arising from the use of our services.
          </p>

          <h2>Contact</h2>
          <p>
            For questions about these terms, contact us at{' '}
            <a href="mailto:hello@palnadu.dev">hello@palnadu.dev</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
