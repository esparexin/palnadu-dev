import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for Palnadu.dev.',
};

export default function TermsPage() {
  return (
    <div className="bg-white">
      <section className="py-12 sm:py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl prose prose-slate prose-headings:text-palnadu-dark prose-p:text-palnadu-body prose-a:text-palnadu-blue">
            <h1>Terms of Service</h1>
            <p className="text-xs text-palnadu-secondary">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <h2>Services</h2>
            <p>
              Palnadu.dev provides software development, consulting, and related technology
              services. The specific scope, deliverables, timeline, and pricing for each project are
              defined in separate written agreements or proposals.
            </p>

            <h2>Intellectual Property</h2>
            <p>
              Unless otherwise agreed in writing, upon full payment, clients own all custom code and
              deliverables created specifically for their project. Palnadu.dev retains ownership of
              pre-existing code, libraries, and general knowledge.
            </p>

            <h2>Confidentiality</h2>
            <p>
              We treat all client information, project details, and business data with strict
              confidentiality. We will execute a non-disclosure agreement (NDA) upon request.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Palnadu.dev is not liable for indirect,
              incidental, special, or consequential damages arising from the use of our services or
              software.
            </p>

            <h2>Contact</h2>
            <p>
              If you have questions about these terms, please contact us at{' '}
              <a href="mailto:hello@palnadu.dev">hello@palnadu.dev</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
