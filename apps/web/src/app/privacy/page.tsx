import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Palnadu.dev.',
};

export default function PrivacyPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl prose prose-neutral dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h2>Information We Collect</h2>
          <p>
            When you contact us through our website, we collect the information you provide
            including your name, email address, phone number, company name, and project details.
          </p>

          <h2>How We Use Your Information</h2>
          <p>We use the information you provide to:</p>
          <ul>
            <li>Respond to your inquiry</li>
            <li>Understand your project requirements</li>
            <li>Provide relevant services</li>
            <li>Communicate about your project</li>
          </ul>

          <h2>Data Protection</h2>
          <p>
            We take reasonable measures to protect your personal information. We do not sell,
            trade, or rent your personal information to third parties.
          </p>

          <h2>Cookies</h2>
          <p>
            Our website may use cookies to improve user experience and for analytics purposes. You
            can control cookies through your browser settings.
          </p>

          <h2>Contact</h2>
          <p>
            If you have questions about this privacy policy, please contact us at{' '}
            <a href="mailto:hello@palnadu.dev">hello@palnadu.dev</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
