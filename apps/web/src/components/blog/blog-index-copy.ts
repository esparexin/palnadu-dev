import type { BlogLocale } from '@palnadu/config';

export interface BlogIndexMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BlogIndexViewProps {
  locale: BlogLocale;
  posts: any[];
  categories: any[];
  meta: BlogIndexMeta;
  search?: string;
  category?: string;
  currentPage: number;
  isArchiveView: boolean;
}

export const INDEX_COPY = {
  en: {
    kicker: 'Knowledge Base & Publication Archive',
    title: 'Engineering Insights & Software Truths',
    titleArchive: 'Archived Engineering Articles',
    subtitle:
      'Practical guides on startup MVPs, web application development, school platforms, and local SEO in Palnadu and Guntur.',
    subtitleArchive:
      'Historical publications, foundational tech guides, and architectural notes preserved for reference.',
    searchPlaceholder: 'Search articles by topic, school, MVP, or SEO...',
    searchButton: 'Search',
    allPubs: 'All Publications',
    archived: 'Archived Blogs',
    emptyTitle: 'No Articles Found',
    emptyFiltered:
      'No articles match your current search, category, or archive filter. Try clearing your filters.',
    emptyDefault:
      'We are preparing practical engineering breakdowns and startup validation guides.',
    clearFilters: 'Clear all filters →',
    showing: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total} articles`,
    previous: 'Previous',
    next: 'Next',
    read: 'Read',
    archivedBadge: 'Archived',
    guideFallback: 'Guide',
    minRead: (n: number) => `${n} min read`,
    jsonLdName: 'Palnadu.dev Engineering Blog & Archive',
    jsonLdDescription:
      'Practical software engineering guides, startup MVP breakdowns, school websites, and local SEO insights by Palnadu.dev.',
    blogCrumb: 'Blog',
    blogArchiveCrumb: 'Blog Archive',
  },
  te: {
    kicker: 'నాలెడ్జ్ బేస్ & ప్రచురణ ఆర్కైవ్',
    title: 'ఇంజనీరింగ్ అంతర్దృష్టులు & సాఫ్ట్‌వేర్ సత్యాలు',
    titleArchive: 'ఆర్కైవ్ చేయబడిన ఇంజనీరింగ్ వ్యాసాలు',
    subtitle:
      'స్టార్టప్ MVPలు, వెబ్ అప్లికేషన్ అభివృద్ధి, పాఠశాల వేదికలు మరియు పల్నాడు, గుంటూరులో స్థానిక SEO పై ఆచరణాత్మక మార్గదర్శకాలు.',
    subtitleArchive:
      'సూచన కోసం భద్రపరచబడిన చారిత్రక ప్రచురణలు, ప్రాథమిక సాంకేతిక మార్గదర్శకాలు మరియు నిర్మాణ గమనికలు.',
    searchPlaceholder: 'అంశం, పాఠశాల, MVP లేదా SEO ద్వారా వ్యాసాలను శోధించండి...',
    searchButton: 'శోధించండి',
    allPubs: 'అన్ని ప్రచురణలు',
    archived: 'ఆర్కైవ్ చేయబడిన బ్లాగులు',
    emptyTitle: 'వ్యాసాలు కనుగొనబడలేదు',
    emptyFiltered:
      'మీ ప్రస్తుత శోధన, వర్గం లేదా ఆర్కైవ్ ఫిల్టర్‌కు సరిపోయే వ్యాసాలు లేవు. ఫిల్టర్‌లను క్లియర్ చేయడానికి ప్రయత్నించండి.',
    emptyDefault:
      'మేము ఆచరణాత్మక ఇంజనీరింగ్ విశ్లేషణలు మరియు స్టార్టప్ ధృవీకరణ మార్గదర్శకాలను సిద్ధం చేస్తున్నాము.',
    clearFilters: 'అన్ని ఫిల్టర్‌లను క్లియర్ చేయండి →',
    showing: (from: number, to: number, total: number) => `మొత్తం ${total} వ్యాసాలలో ${from}–${to} చూపుతోంది`,
    previous: 'వెనుకకు',
    next: 'తర్వాత',
    read: 'చదవండి',
    archivedBadge: 'ఆర్కైవ్',
    guideFallback: 'గైడ్',
    minRead: (n: number) => `${n} నిమి పఠనం`,
    jsonLdName: 'Palnadu.dev ఇంజనీరింగ్ బ్లాగ్ & ఆర్కైవ్',
    jsonLdDescription:
      'Palnadu.dev ద్వారా ఆచరణాత్మక సాఫ్ట్‌వేర్ ఇంజనీరింగ్ మార్గదర్శకాలు, స్టార్టప్ MVP విశ్లేషణలు, పాఠశాల వెబ్‌సైట్‌లు మరియు స్థానిక SEO అంతర్దృష్టులు.',
    blogCrumb: 'బ్లాగ్',
    blogArchiveCrumb: 'బ్లాగ్ ఆర్కైవ్',
  },
} as const;
