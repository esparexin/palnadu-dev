import type { Metadata } from 'next';
import { siteConfig } from '@palnadu/config';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy and data protection standards for Palnadu.dev software engineering studio.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <section className="py-14 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl prose prose-slate prose-headings:text-palnadu-dark prose-p:text-palnadu-body prose-a:text-palnadu-blue">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-palnadu-dark">Privacy Policy</h1>
            <p className="text-xs font-mono text-palnadu-secondary">
              Effective Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <p className="lead">
              At Palnadu.dev (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we respect your privacy and are committed to protecting the confidential business information and personal data you share with us. This Privacy Policy outlines our transparent practices regarding data collection, usage, storage, and customer rights under the Information Technology Act, 2000 (India) and international privacy frameworks.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              When you interact with our website, request technical consultations, or partner with us for software engineering, we may collect the following categories of information:
            </p>
            <ul>
              <li>
                <strong>Contact Information:</strong> Your full name, corporate email address, telephone/WhatsApp contact number, and company or startup name.
              </li>
              <li>
                <strong>Project & Technical Requirements:</strong> Problem statements, operational workflows, system architecture requirements, budget estimates, and stage of development shared through our contact forms or discovery sessions.
              </li>
              <li>
                <strong>Technical & Diagnostic Data:</strong> IP addresses, browser types, operating systems, referring URLs, and page navigation patterns collected automatically to monitor application performance and ensure server security.
              </li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We utilize the collected information strictly for operational and technical service delivery:</p>
            <ul>
              <li>Conducting technical feasibility assessments and preparing custom software architecture proposals.</li>
              <li>Directly communicating engineering recommendations, milestone updates, and support notices without commission sales intermediaries.</li>
              <li>Ensuring the performance, security, and integrity of our web applications and cloud APIs.</li>
              <li>Complying with applicable Indian commercial, taxation, and statutory legal obligations.</li>
            </ul>

            <h2>3. Protection of Business Ideas & Non-Disclosure (NDA)</h2>
            <p>
              We understand that early-stage startup ideas, operational bottlenecks, and proprietary business workflows represent valuable intellectual capital. We do not sell, rent, monetize, or disclose your project data or personal details to third-party marketing brokers. We routinely sign binding Non-Disclosure Agreements (NDAs) prior to formal discovery sessions upon request.
            </p>

            <h2>4. Data Storage, Hosting & Security</h2>
            <p>
              We implement industry-standard encryption protocols (TLS 1.3 in transit and AES-256 at rest). Client records and database communications are hosted on secured cloud infrastructure with restricted role-based administrative access. While no internet transmission is 100% invulnerable, we regularly review our code, dependencies, and deployment pipelines to prevent unauthorized data exposure.
            </p>

            <h2>5. Cookies & Tracking Technologies</h2>
            <p>
              Our website uses essential session cookies to support interface navigation, maintain security tokens, and analyze aggregated, anonymized web traffic via server metrics. You may configure your web browser to reject cookies; however, some interactive platform features may function with reduced performance.
            </p>

            <h2>6. Client Rights & Data Management</h2>
            <p>
              You maintain full authority over your personal information. You have the right to request access to the data we maintain about you, request corrections to inaccurate records, or request complete deletion of your contact dossier upon conclusion of our technical consultation or service engagement.
            </p>

            <h2>7. Contact & Grievance Officer</h2>
            <p>
              For privacy inquiries, data deletion requests, or formal grievance correspondence, please reach out directly to our engineering administration team:
            </p>
            <p>
              <strong>Palnadu.dev Engineering Administration</strong><br />
              Email:{' '}
              <a href={`mailto:${siteConfig.contact.email}`} className="font-semibold">
                {siteConfig.contact.email}
              </a>
              <br />
              Telephone:{' '}
              <a href={`tel:${siteConfig.contact.phone}`} className="font-semibold">
                {siteConfig.contact.phone}
              </a>
              <br />
              Headquarters: Palnadu District, Andhra Pradesh, India.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
