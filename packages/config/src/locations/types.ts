// ─── Location & Administrative Types (SSOT) ──────────────────────────

export interface RevenueDivision {
  name: string;
  district: string;
  mandals: string[];
}

export interface LocationData {
  slug: string;
  name: string;
  district: string;
  revenueDivision?: string;
  surroundingMandals?: string[];
  tagline: string;
  economicProfile: string;
  keyIndustries: string[];
  commonPainPoints: string[];
  popularServices: string[];
  geo?: { latitude: number; longitude: number };
  serviceOffice?: string;
  postalCode?: string;
  faq: { q: string; a: string }[];
}
