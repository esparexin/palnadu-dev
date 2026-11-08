import { BacklinkOpportunity } from './seo-strategy';

export function getRegionalBacklinkOpportunities(
  topic: string,
  location?: string,
): BacklinkOpportunity[] {
  const loc = location || 'Palnadu and Guntur, Andhra Pradesh';
  return [
    {
      sourceName: 'Andhra Pradesh MSME & Industry Directory',
      category: 'business_directory',
      urlHint: 'https://msme.ap.gov.in',
      outreachAngle: `Listing Palnadu.dev as a verified technology and ${topic} service provider in ${loc}`,
      confidence: 'ai_suggestion',
    },
    {
      sourceName: 'Guntur District Chamber of Commerce and Industry',
      category: 'regional_chamber',
      outreachAngle: `Co-authoring regional digital transformation guide for business owners regarding ${topic}`,
      confidence: 'ai_suggestion',
    },
    {
      sourceName: 'Andhra Chamber of Commerce & Trade Associations',
      category: 'industry_association',
      outreachAngle: `Vendor case study on cost-effective regional software modernization and ${topic}`,
      confidence: 'ai_suggestion',
    },
    {
      sourceName: 'IndiaMart & TradeIndia Regional Tech Profiles',
      category: 'business_directory',
      outreachAngle: `Verified local engineering supplier registration for enterprises in ${loc}`,
      confidence: 'ai_suggestion',
    },
    {
      sourceName: 'Regional Business & Tech Resource Guides',
      category: 'resource_page',
      outreachAngle: `Educational resource citations explaining ${topic} implementation architectures`,
      confidence: 'ai_suggestion',
    },
  ];
}
