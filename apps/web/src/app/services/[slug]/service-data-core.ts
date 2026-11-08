export interface ServiceDetailData {
  content: string[];
  deliverables: string[];
  architecture: string[];
  faq: { q: string; a: string }[];
}

export const coreServiceContent: Record<string, ServiceDetailData> = {
  'website-development': {
    content: [
      'In modern commerce, your website is the digital front door to your business. When prospective customers, corporate partners, or parents search for your enterprise in Palnadu and Guntur, an outdated, slow-loading website with broken mobile layouts immediately destroys trust.',
      'Palnadu.dev engineers modern, high-converting corporate websites, institutional portals, and business platforms built with Next.js, React, and Tailwind CSS. We completely bypass sluggish WordPress templates and bloated site builders that get hacked and drag down Google rankings.',
      'Every website we construct is pre-rendered into clean, static HTML delivered across edge CDN nodes. This guarantees sub-second First Contentful Paint (FCP) and Largest Contentful Paint (LCP) even over spotty 4G mobile connectivity in regional towns.',
      'We integrate intuitive administrative content management tools, enabling your internal team to publish news announcements, upload gallery photos, and update pricing schedules without writing a single line of code.',
    ],
    deliverables: [
      'Custom Corporate Web Design: Clean typographic branding engineered for regional and global credibility.',
      'School & College Portals: Admission inquiry forms, exam circulars, and institutional portfolios.',
      'Core Web Vitals Optimization: 95+ Google Lighthouse scores with sub-1-second mobile load speeds.',
      'Full SEO & Schema.org Graph: Automatic XML sitemaps, OpenGraph metadata, and structured Knowledge Graph tags.',
      'Responsive Mobile-First UI: Flawless experience across Indian smartphones, tablets, and desktops.',
      'Admin Content Management Panel: Easy post, notice, and banner editing for non-technical team members.',
    ],
    architecture: [
      'Next.js 15+ App Router for static pre-rendering',
      'Tailwind CSS for ultra-lightweight styling',
      'Edge CDN caching via Vercel / Cloudflare',
      'Semantic HTML5 with Schema.org JSON-LD microdata',
    ],
    faq: [
      {
        q: 'Why should our company invest in a custom Next.js website instead of WordPress?',
        a: 'WordPress relies on dozens of third-party plugins that bloat page size, create critical security vulnerabilities, and take 5 to 8 seconds to load. Next.js produces static HTML that loads instantly, never gets hacked through vulnerable plugins, and significantly outperforms templates on Google Search rankings.',
      },
      {
        q: 'Can our staff update announcements and images without coding knowledge?',
        a: 'Yes. We build clean, password-protected admin dashboards allowing your office staff to easily upload photos, edit text, publish circulars, and manage lead inquiries.',
      },
      {
        q: 'Will our website be mobile friendly?',
        a: 'Every single website is designed mobile-first. Over 85% of regional web visits come from Android and iOS smartphones, and we test across popular regional screen resolutions.',
      },
    ],
  },
  'android-app-development': {
    content: [
      'Android powers over 95% of smartphones across Andhra Pradesh. From mandi brokers and commission agents in Narasaraopet to field sales teams in Guntur and delivery drivers navigating rural corridors, Android is the indispensable operating system for regional enterprise.',
      'Palnadu.dev builds robust, high-performance Android mobile applications tailored around real-world commercial workflows. We design lightweight, intuitive interfaces that regional staff and everyday consumers can operate without training.',
      'A primary failure mode of commercial Android apps in regional areas is poor handling of weak network connectivity. We architect offline-first data synchronization, allowing field reps to create orders, log customer visits, or record godown stock even in zero-reception areas. The app automatically syncs all changes the moment a cell signal is recovered.',
      'We handle the full lifecycle from UI/UX design and backend API integration to Google Play Console compliance, target API level updates, and production deployment.',
    ],
    deliverables: [
      'Custom Android Business Applications: Built for field sales, inventory tracking, and consumer ordering.',
      'Offline-First Data Architecture: Zero data loss with local SQLite caching and automated cloud sync.',
      'Hardware & Peripheral Integration: Camera barcode/QR scanning, Bluetooth thermal printers, and GPS geofencing.',
      'Push Notifications via Firebase: Instant transactional notifications, dispatch alerts, and promotional broadcasts.',
      'Google Play Store Release: Complete handling of app bundles, Play Store listing, and privacy disclosures.',
      '100% Source Code Ownership: Full Git repository transfer with complete technical documentation.',
    ],
    architecture: [
      'React Native & Expo / Kotlin runtime',
      'SQLite & WatermelonDB for local offline-first storage',
      'Firebase Cloud Messaging (FCM) for push notifications',
      'RESTful JSON APIs with end-to-end TLS encryption',
    ],
    faq: [
      {
        q: 'Can the Android app operate without an internet connection?',
        a: 'Yes. We engineer offline-first data stores. Staff can create invoices, log entries, or scan inventory offline; the app stores records locally and synchronizes with your cloud server as soon as connectivity resumes.',
      },
      {
        q: 'Do you publish the application to the Google Play Store?',
        a: 'Yes. We manage app signing, target SDK compliance, privacy policy requirements, and submission to the Google Play Console for public or internal track distribution.',
      },
      {
        q: 'Can our Android app connect with our existing desktop billing or accounting software?',
        a: 'Yes. We build custom API connectors and data export bridges that sync customer orders and payment records directly with your central database or Tally.',
      },
    ],
  },
  'ios-app-development': {
    content: [
      'While Android leads in volume, iOS leads in commercial purchasing power. Business executives, medical specialists, corporate directors, and high-value consumers overwhelmingly rely on iPhones and iPads for their daily productivity and purchasing decisions.',
      'Palnadu.dev designs and develops premium iOS applications that adhere rigorously to Apple’s Human Interface Guidelines (HIG). We create fluid, 60fps and 120fps native interactions with refined micro-animations and intuitive gesture navigation.',
      'Apple maintains the strictest App Store review standards in the technology industry. We take complete ownership of Apple Developer Program configuration, privacy manifest requirements, entitlements, TestFlight beta distribution, and App Store review compliance.',
      'Whether you require an executive business dashboard, a customer-facing portal, or an iPad kiosk system for clinics and showrooms, our iOS applications combine aesthetic excellence with enterprise reliability.',
    ],
    deliverables: [
      'Native & Cross-Platform iOS Apps: Engineered with Swift and React Native for fluid, responsive execution.',
      'iPad Business & Showroom Kiosks: Customized tablet layouts for retail displays, clinics, and billing desks.',
      'Apple Human Interface Guidelines: Polished visual hierarchy, typography, dark mode, and dynamic type support.',
      'Apple App Store Approval: End-to-end guidance through Apple Review Guidelines, entitlements, and privacy policies.',
      'Biometric & Secure Enclave Auth: Instant, secure login using Face ID and Touch ID.',
      'Real-Time Cloud Synchronization: Secure backend communication with zero data leakage.',
    ],
    architecture: [
      'React Native with Swift native bridges',
      'Apple Push Notification service (APNs)',
      'TestFlight automated build pipelines',
      'Secure Enclave & Biometric Authentication',
    ],
    faq: [
      {
        q: 'Why should our business build an iOS app if most local customers use Android?',
        a: 'Doctors, institutional directors, business owners, and affluent consumers disproportionately use iPhones. Offering a first-class iOS app establishes brand prestige and captures high-average-order-value transactions.',
      },
      {
        q: 'How difficult is it to get an app approved on the Apple App Store?',
        a: 'Apple rejects apps that do not meet strict usability, privacy, and design standards. Our team designs strictly to Apple guidelines, handles all privacy manifests, and guides your app through review to approval.',
      },
    ],
  },
  'web-development': {
    content: [
      'In modern commerce, your web platform is often the first interaction prospective clients, partners, and parents have with your brand. Legacy websites built with bloated PHP templates or slow drag-and-drop page builders take 6 to 9 seconds to load, fail Google Core Web Vitals, and leak potential leads every single day.',
      'Palnadu.dev engineers high-performance web applications and digital platforms using Next.js (App Router), TypeScript, and Tailwind CSS, deploying directly to global cloud edge networks. Our platforms consistently achieve 90–100 Google Lighthouse scores with sub-second page loads across regional mobile 4G and 5G connections.',
      'We build across the spectrum of commercial requirements: from high-converting institutional portals for junior colleges and healthcare facilities, to complex multi-tenant SaaS applications and internal operations dashboards for wholesale distributors in Palnadu and Guntur.',
      'Every web application is engineered with type-safe backend integrations, robust security headers, automated sitemaps, semantic Schema.org structured data, and responsive interfaces optimized for common Indian smartphones.',
    ],
    deliverables: [
      'High-Speed Next.js & React Applications: Pre-rendered HTML for instant loading.',
      'Custom Corporate & Institutional Portals: Mobile-first web platforms for regional enterprises.',
      'SaaS Application Engineering: Multi-tenant dashboards with role-based access control.',
      'Core Web Vitals Optimization: Sub-1-second LCP and zero layout shifts for higher SEO rank.',
      'REST & tRPC API Architecture: Secure communication between clients and databases.',
      '100% Source Code Ownership: Full Git repository transfer with zero agency lock-in.',
    ],
    architecture: [
      'Next.js 15+ with React Server Components',
      'TypeScript for complete end-to-end type safety',
      'Tailwind CSS for streamlined, zero-bloat styling',
      'Edge CDN deployment via Cloudflare & Vercel',
    ],
    faq: [
      {
        q: 'Why does Palnadu.dev recommend Next.js over WordPress?',
        a: 'Next.js delivers sub-second page loads, eliminates vulnerable third-party plugins that get hacked, provides 100% custom UI control, and directly improves your Google search rankings through superior Core Web Vitals.',
      },
      {
        q: 'Can our staff easily update text and blog posts without coding?',
        a: 'Yes. We integrate lightweight, intuitive administrative portals allowing non-technical team members to publish articles, update announcements, and modify content easily.',
      },
      {
        q: 'Are your websites mobile-friendly?',
        a: 'All our platforms are mobile-first. Over 85% of regional web traffic comes from smartphones, so we rigorously test on common Android and iOS screens.',
      },
    ],
  },
  'mobile-app-development': {
    content: [
      'Mobile devices are the central nervous system of everyday business in Andhra Pradesh. Whether it is field sales agents booking orders in rural mandis, delivery drivers updating transport milestones on NH-16, or patients booking doctor consultations, a seamless mobile experience is essential.',
      'Palnadu.dev designs and develops iOS, Android, and cross-platform mobile applications that solve tangible operational problems without unnecessary complexity or bloated file sizes.',
      'We help you determine whether your business genuinely requires a standalone native mobile application, a cross-platform solution (React Native), or an ultra-fast Progressive Web App (PWA). We evaluate factors like offline data synchronization, camera barcode scanning, push notifications, and development budget before recommending an architectural path.',
      'Our mobile applications emphasize intuitive usability, fast startup times, offline resilience under spotty connectivity, and reliable background synchronization with your centralized cloud database.',
    ],
    deliverables: [
      'Cross-Platform iOS & Android Apps: Single codebase reducing development cost.',
      'Progressive Web Applications (PWA): App-like experience without app store downloads.',
      'Offline-First Data Synchronization: Work reliably in areas with low cell coverage.',
      'Push Notifications & Alerts: Keep customers and staff informed automatically.',
      'Hardware Integrations: Camera barcode/QR scanning, GPS location tracking, and camera uploads.',
      'App Store & Play Store Deployment: Complete handling of publishing and store guidelines.',
    ],
    architecture: [
      'React Native & Expo for cross-platform delivery',
      'SQLite / WatermelonDB for local offline caching',
      'Secure JWT authentication & biometric logins',
      'Background workers for seamless cloud synchronization',
    ],
    faq: [
      {
        q: 'Should our business build a native app or a Progressive Web App (PWA)?',
        a: 'If you need deep hardware integration (Bluetooth printers, background GPS) or public app store presence, a cross-platform mobile app is best. For internal workflows and fast customer portals, a PWA often saves 50% in development costs while offering app-like speed.',
      },
      {
        q: 'How do you handle poor internet connectivity in rural areas?',
        a: 'We architect offline-first data stores. Staff can enter orders or update stock without signal; the app automatically queues and syncs transactions the moment connectivity is restored.',
      },
    ],
  },
};
