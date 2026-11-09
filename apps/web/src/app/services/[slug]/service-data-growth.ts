import type { ServiceDetailData } from './service-data-core';

export const growthServiceContent: Record<string, ServiceDetailData> = {
  'seo-aeo-geo': {
    content: [
      'Search behavior has fundamentally evolved. Today, prospective clients discover solutions not only through standard Google results, but also via AI answers from ChatGPT, Perplexity, Google AI Overviews, Apple Intelligence, and voice-assisted answer engines.',
      'Palnadu.dev engineers unified search visibility spanning Technical SEO, Answer Engine Optimization (AEO), and Generative Engine Optimization (GEO). We establish factual, crawlable, and machine-readable digital entity architecture so your brand is cited and trusted by both search engines and modern Large Language Models.',
      'For regional enterprises across Palnadu, Guntur, and Andhra Pradesh, local discoverability is paramount. We synchronize Name, Address, and Phone (NAP) citations, optimize Google Business Profiles (GBP), and embed granular Schema.org JSON-LD Knowledge Graph entities into every page.',
      'We strictly reject black-hat tricks, automated keyword stuffing, and fake reviews. We build genuine topical authority through verified case studies, structured FAQs, accurate entity relationships, and sub-second Core Web Vitals.',
    ],
    deliverables: [
      'Technical SEO & Crawlability Audits: Automated XML sitemaps, robots.txt directives, canonical validation, and Core Web Vitals.',
      'Answer Engine Optimization (AEO): Direct answer formatting, question-intent mapping, and structured FAQ JSON-LD schemas.',
      'Generative Engine Optimization (GEO): Entity relationship building, llms.txt declarations, and machine-readable data graphs for AI systems.',
      'Google Business Profile & Local 3-Pack: Regional maps optimization, category refinement, and local citation consistency.',
      'Digital Entity Building & Brand Authority: Organization and local business schemas interconnected with verified corporate profiles.',
      'High-Intent Keyword & SERP Analysis: Targeting commercial buying queries across Palnadu and coastal Andhra Pradesh.',
    ],
    architecture: [
      'Schema.org JSON-LD Knowledge Graph architecture',
      'Next.js pre-rendered semantic HTML5 with microdata',
      'Automated XML sitemaps, robots.txt, and llms.txt manifests',
      'Google Search Console & Google Analytics 4 (GA4) telemetry',
    ],
    faq: [
      {
        q: 'How does Generative Engine Optimization (GEO) differ from traditional SEO?',
        a: 'Traditional SEO focuses on page rank and keywords for search engine result pages. GEO structures factual information, entity relationships, and machine-readable summaries so AI models like ChatGPT, Perplexity, and Google AI Overviews can accurately extract and cite your business as an authoritative source.',
      },
      {
        q: 'What is Answer Engine Optimization (AEO)?',
        a: 'AEO structures content to directly answer specific questions asked by searchers and voice assistants. By utilizing question-based headings, concise answer paragraphs, and Schema.org FAQ markup, your content is favored for featured snippets and instant AI answers.',
      },
      {
        q: 'How quickly do technical SEO and local optimization show results in our district?',
        a: 'Google Business Profile and local map listings typically see measurable improvements in call inquiries within 30 to 45 days. Broader organic search rankings and AI citations compound steadily over 3 to 6 months as domain authority builds.',
      },
    ],
  },
  'software-testing-qa': {
    content: [
      'Software bugs, broken payment flows, and sluggish load times destroy customer trust and revenue. In mission-critical web applications, e-commerce stores, and enterprise portals, quality cannot be an afterthought.',
      'Palnadu.dev provides rigorous web application and website testing, automated end-to-end (E2E) verification, and systematic Quality Assurance (QA). We inspect frontend UI/UX responsiveness across devices, stress-test backend APIs, and validate database transactions under peak concurrency.',
      'Our QA engineering covers functionality, security, accessibility (WCAG), and performance. We ensure your platforms comply with Core Web Vitals (sub-second LCP, zero CLS), sanitize user inputs to prevent injection vulnerabilities, and verify that mission-critical business logic functions flawlessly.',
      'We deliver detailed test execution reports, defect severity matrices, and automated regression test suites that run on continuous integration (CI) pipelines, preventing bugs from ever reaching production.',
    ],
    deliverables: [
      'Automated Regression Testing: End-to-end browser and API test suites that execute on every code commit.',
      'Cross-Device & Mobile Responsiveness QA: Systematic verification across popular Indian Android and iOS screen resolutions.',
      'API & Database Concurrency Testing: Validating payment webhooks, order locks, and high-volume transaction integrity.',
      'Security & Vulnerability Audits: Input sanitization, authentication security, role authorization checks, and OWASP compliance.',
      'Core Web Vitals & Performance Benchmarking: Load time profiling, memory leak detection, and network payload reduction.',
      'Accessibility (WCAG 2.1) Audits: Keyboard navigation, screen-reader semantics, and color contrast compliance.',
    ],
    architecture: [
      'Node.js native test runner & Jest for unit and integration testing',
      'Playwright for headless browser cross-platform automation',
      'Lighthouse CI for Core Web Vitals performance gates',
      'Postman / Newman for automated REST API verification',
    ],
    faq: [
      {
        q: 'Can you test an existing web application or website built by another company?',
        a: 'Yes. We conduct independent third-party quality audits. We run security scans, test checkout and lead forms, profile database query speeds, and deliver a prioritized bug remediation report.',
      },
      {
        q: 'What is the difference between manual testing and automated QA?',
        a: 'Manual testing verifies human usability, visual design fidelity, and real-world edge cases. Automated testing writes code to simulate thousands of user interactions in seconds, ensuring new updates never break existing checkout or login flows. We employ both.',
      },
      {
        q: 'Do you test mobile responsiveness on actual devices?',
        a: 'Yes. We test across common Android smartphone models, iPhones, tablets, and desktop browsers to verify touch targets, keyboard popups, and fluid responsiveness.',
      },
    ],
  },
  'practical-training': {
    content: [
      'College curriculums and generic training institutes teach outdated theory without exposing students to actual production software engineering. Graduates often know syntax but struggle to build a real full-stack web application, configure a database, or debug a production deployment.',
      'Palnadu.dev provides real-time practical training mentored directly by senior software engineers. Our training is grounded in production realities: participants work on genuine web applications, build real-world UI components, write backend APIs, and deploy projects to cloud infrastructure.',
      'Our curriculum spans five core engineering tracks: Modern Website Design & UI/UX, Full-Stack Web Application Development (Next.js, TypeScript, PostgreSQL), Mobile App Development, Software Testing & Quality Assurance, and Advanced Digital Marketing with Technical SEO.',
      'We maintain small, focused cohorts with hands-on code reviews, real Git workflows, and direct mentorship. We only teach what we actually build in our day-to-day studio engineering.',
    ],
    deliverables: [
      'Real-Time Production Projects: Build and deploy genuine web applications rather than toy clones.',
      'Full-Stack TypeScript Curriculum: Next.js App Router, Tailwind CSS, REST APIs, and PostgreSQL.',
      'Software Testing & QA Practice: Writing unit tests, integration tests, and debugging production errors.',
      'Technical SEO & Growth Engineering: Core Web Vitals optimization, Schema markup, and Google Search Console mastery.',
      'Git & Modern CI/CD Workflows: Pull requests, branch management, automated linting, and cloud deployments.',
      'Career Mentorship & Portfolio Building: Genuine Git repositories showcasing production-ready code.',
    ],
    architecture: [
      'Production Next.js 15+ and TypeScript development environments',
      'Git version control with GitHub pull-request workflows',
      'Relational database schema design with Prisma and PostgreSQL',
      'Real cloud hosting on Vercel, Cloudflare, and Docker',
    ],
    faq: [
      {
        q: 'Who is eligible for the practical training program?',
        a: 'Students, engineering graduates, and working professionals who want practical, production-level coding experience. Basic programming familiarity is helpful, but dedication and logical problem-solving are most important.',
      },
      {
        q: 'How is Palnadu.dev training different from typical computer coaching centers?',
        a: 'Coaching centers use slideshows and 10-year-old syllabus material. At Palnadu.dev, you sit alongside active software engineers building real web applications, learning modern TypeScript, cloud deployment, and real-world debugging.',
      },
      {
        q: 'Do participants build real portfolio projects?',
        a: 'Yes. Every participant builds, tests, and deploys fully functional projects to live cloud domains with public GitHub repositories demonstrating authentic code ownership.',
      },
    ],
  },
};
