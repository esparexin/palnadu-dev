import type { Metadata } from 'next';
import { siteConfig } from '@palnadu/config';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service, engineering standards, and intellectual property terms for Palnadu.dev software engineering studio.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="bg-white">
      <section className="py-14 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl prose prose-slate prose-headings:text-palnadu-dark prose-p:text-palnadu-body prose-a:text-palnadu-blue">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-palnadu-dark">Terms of Service</h1>
            <p className="text-xs font-mono text-palnadu-secondary">
              Effective Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <p className="lead">
              These Terms of Service (&quot;Terms&quot;) govern the access, utilization, and contractual engagement of software engineering, web application development, and technical consulting services provided by Palnadu.dev (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing our website or engaging us for software services, you agree to be bound by these Terms.
            </p>

            <h2>1. Scope of Services & Development Agreements</h2>
            <p>
              Palnadu.dev provides custom software engineering, fullstack web application development, mobile applications, startup MVP prototyping, business workflow automation, and technical architecture consulting. Detailed deliverables, milestone schedules, technical specifications, and compensation terms for specific client engagements are governed by individual project Statements of Work (SOW) or written service contracts executed between the parties.
            </p>

            <h2>2. 100% Intellectual Property & Code Ownership</h2>
            <p>
              We operate under a transparent, client-first ownership model. Upon receipt of full and final contractual payment for agreed deliverables:
            </p>
            <ul>
              <li>
                <strong>Client Ownership:</strong> The client retains 100% exclusive intellectual property ownership of all custom software code, bespoke algorithms, database schemas, graphic designs, and digital assets engineered specifically for their project.
              </li>
              <li>
                <strong>Repository & Credentials:</strong> We provide full administrative access and transfer of the primary Git source code repository and associated cloud deployment accounts with zero vendor lock-in.
              </li>
              <li>
                <strong>Open-Source Frameworks:</strong> Pre-existing open-source libraries, runtime frameworks (e.g., Next.js, React, Node.js), and third-party tools remain governed by their respective permissive licenses (such as MIT, Apache 2.0).
              </li>
            </ul>

            <h2>3. Client Responsibilities & Data Accuracy</h2>
            <p>
              To ensure timely milestone delivery and accurate software engineering, clients agree to provide necessary operational context, feedback on sprint reviews within agreed turnaround windows, and ensure that all content, logos, third-party API credentials, and materials provided to Palnadu.dev do not infringe upon any third-party intellectual property rights.
            </p>

            <h2>4. Payment Terms & Commercial Standards</h2>
            <p>
              Project billing schedules are typically structured around verified sprint milestones (e.g., Discovery & Architecture, Core MVP Build, QA & Deployment). Invoices are payable via approved banking, NEFT/RTGS, UPI, or international wire transfer protocols. Delays in milestone sign-offs or required third-party API access may adjust dependent delivery timelines accordingly.
            </p>

            <h2>5. Warranties & Bug Remediation</h2>
            <p>
              We engineer software to modern production standards, utilizing TypeScript type-safety, comprehensive integration validation, and clean architectural principles. Each deployed milestone includes an agreed post-delivery warranty period during which any technical defects or software bugs departing from written specifications are remediated at no additional cost.
            </p>

            <h2>6. Limitation of Liability</h2>
            <p>
              To the maximum extent permissible under applicable Indian law, Palnadu.dev shall not be liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, data corruption, or business interruption arising from the use of delivered software or third-party cloud hosting disruptions (AWS, Vercel, Cloudflare, Google Cloud). Our cumulative liability under any engagement shall not exceed the total fees paid by the client under the specific Statement of Work giving rise to liability.
            </p>

            <h2>7. Governing Law & Jurisdiction</h2>
            <p>
              These Terms and all contractual agreements shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in the State of Andhra Pradesh, India.
            </p>

            <h2>8. Contact Information</h2>
            <p>
              If you have any questions, clarifications, or contractual queries regarding these Terms of Service, please contact our legal and engineering administration:
            </p>
            <p>
              <strong>Palnadu.dev Administration</strong><br />
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
              Location: Palnadu District, Andhra Pradesh, India.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
