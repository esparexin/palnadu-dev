// ─── Navigation Definitions (SSOT) ───────────────────────────────

export interface NavItem {
  title: string;
  href: string;
  description?: string;
  children?: NavItem[];
}

export const mainNavItems: NavItem[] = [
  { title: 'Home', href: '/' },
  { title: 'Grow', href: '/grow' },
  { title: 'About', href: '/about' },
  { title: 'Services', href: '/services' },
  { title: 'Work', href: '/work' },
  { title: 'Blog', href: '/blog' },
  { title: 'Contact', href: '/contact' },
];

export const footerNavItems = {
  services: [
    { title: 'Website Development & UI/UX', href: '/services/website-development' },
    { title: 'Web Applications', href: '/services/web-development' },
    { title: 'Custom Software Engineering', href: '/services/custom-software' },
    { title: 'Android App Development', href: '/services/android-app-development' },
    { title: 'iOS App Development', href: '/services/ios-app-development' },
    { title: 'Digital Marketing & Content', href: '/services/digital-marketing' },
    { title: 'Technical SEO, AEO & GEO', href: '/services/seo-aeo-geo' },
    { title: 'Software Testing & QA', href: '/services/software-testing-qa' },
    { title: 'Practical Software Training', href: '/services/practical-training' },
    { title: 'Business Automation', href: '/services/business-automation' },
    { title: 'MVP Development', href: '/services/mvp-development' },
    { title: 'Technical Consulting', href: '/services/technical-consulting' },
  ],
  company: [
    { title: 'About', href: '/about' },
    { title: 'Work', href: '/work' },
    { title: 'Blog', href: '/blog' },
    { title: 'Locations', href: '/locations' },
    { title: 'Contact', href: '/contact' },
  ],
  locations: [
    { title: 'Guntur', href: '/locations/guntur' },
    { title: 'Palnadu', href: '/locations/palnadu' },
    { title: 'Narasaraopet', href: '/locations/narasaraopet' },
    { title: 'Chilakaluripet', href: '/locations/chilakaluripet' },
    { title: 'Sattenapalle', href: '/locations/sattenapalle' },
    { title: 'Vinukonda', href: '/locations/vinukonda' },
    { title: 'Macherla', href: '/locations/macherla' },
  ],
  legal: [
    { title: 'Privacy Policy', href: '/privacy' },
    { title: 'Terms of Service', href: '/terms' },
  ],
};

export const adminNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard' },
  { title: 'Leads', href: '/admin/leads' },
  { title: 'Clients', href: '/admin/clients' },
  { title: 'Projects', href: '/admin/projects' },
  { title: 'Services', href: '/admin/services' },
  { title: 'Case Studies', href: '/admin/case-studies' },
  { title: 'Blog', href: '/admin/blog' },
  { title: 'Media', href: '/admin/media' },
  { title: 'Users', href: '/admin/users' },
  { title: 'Settings', href: '/admin/settings' },
];
