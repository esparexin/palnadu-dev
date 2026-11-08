export interface CrawlIssue {
  severity: 'CRITICAL' | 'WARNING' | 'OPPORTUNITY';
  category: string;
  url: string;
  message: string;
  recommendation: string;
}

export interface AuditData {
  id?: string;
  crawlUrl: string;
  status: string;
  seoScore: number;
  performanceScore: number;
  pagesCrawled: number;
  summary: string;
  durationMs: number;
  issues: CrawlIssue[];
  createdAt?: string;
}

export interface LocalTarget {
  keyword: string;
  location: string;
  intent: string;
  targetUrl: string;
  priority: 'HIGH' | 'CORE';
}

export const LOCAL_TARGETS: LocalTarget[] = [
  {
    keyword: 'Software company in Macherla',
    location: 'Macherla',
    intent: 'Transactional',
    targetUrl: '/locations/macherla',
    priority: 'HIGH',
  },
  {
    keyword: 'Weighbridge software Macherla Palnadu',
    location: 'Macherla & Piduguralla',
    intent: 'Commercial',
    targetUrl: '/locations/macherla',
    priority: 'HIGH',
  },
  {
    keyword: 'Billing software for shops Macherla',
    location: 'Macherla',
    intent: 'Commercial',
    targetUrl: '/locations/macherla',
    priority: 'CORE',
  },
  {
    keyword: 'Cement factory gate pass management software',
    location: 'Macherla & Gurazala',
    intent: 'Commercial',
    targetUrl: '/locations/macherla',
    priority: 'HIGH',
  },
  {
    keyword: 'Digital marketing services Macherla',
    location: 'Macherla',
    intent: 'Commercial',
    targetUrl: '/locations/macherla',
    priority: 'CORE',
  },
  {
    keyword: 'Web development in Palnadu district',
    location: 'Palnadu',
    intent: 'Transactional',
    targetUrl: '/locations/palnadu',
    priority: 'CORE',
  },
];

export const LOCAL_CITATIONS = [
  {
    directory: 'Google Business Profile',
    status: 'Active & Verified',
    napStatus: 'Consistent',
    location: 'Macherla Hub',
    target: 'Main Road, Macherla, 522426',
  },
  {
    directory: 'JustDial Commercial Registry',
    status: 'Synced',
    napStatus: 'Consistent',
    location: 'Palnadu & Macherla',
    target: 'IT & Software Services',
  },
  {
    directory: 'IndiaMART B2B Portal',
    status: 'Synced',
    napStatus: 'Consistent',
    location: 'Andhra Pradesh Region',
    target: 'Custom ERP & Weighbridge Software',
  },
  {
    directory: 'TradeIndia Industrial Suppliers',
    status: 'Verified',
    napStatus: 'Consistent',
    location: 'Guntur & Palnadu Industrial Belt',
    target: 'Enterprise Solutions',
  },
];
