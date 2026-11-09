import { Search, Users, MessageSquare, TrendingUp } from "lucide-react";

export const growthStages = [
  {
    id: "visibility",
    tag: "Stage 01",
    shortTitle: "Visibility",
    title: "More Visibility",
    tagline: "Be Found When People Look",
    description:
      "Help your business get discovered by the people searching for what you offer across search engines, Google Maps, and local directories.",
    metrics: "First-Page Regional Search Visibility",
    color: "from-palnadu-blue/20 to-palnadu-teal/10",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Search,
    previewContent: {
      type: "search",
      headline: "Google Search & Regional Discovery",
      details: [
        { label: "Target Search Category", val: "Custom Business Software in Palnadu" },
        { label: "Organic Search Visibility", val: "High-Intent Regional Discovery" },
        { label: "Google Business Profile", val: "Verified local business entity" },
      ],
    },
  },
  {
    id: "engagement",
    tag: "Stage 02",
    shortTitle: "Engagement",
    title: "More Engagement",
    tagline: "Connect With Clarity",
    description:
      "Build meaningful connections with your customers through the right digital channels, high-speed mobile pages, and clear, authoritative content.",
    metrics: "< 1s Mobile Page Load & Clean UI",
    color: "from-palnadu-teal/20 to-palnadu-teal/10",
    badgeColor: "bg-palnadu-light-blue text-palnadu-teal-dark border-palnadu-border",
    icon: Users,
    previewContent: {
      type: "engagement",
      headline: "Customer Engagement & Experience",
      details: [
        { label: "Mobile Experience", val: "Fully responsive and sub-second loading" },
        { label: "Credibility Signals", val: "Verified project portfolio and credentials" },
        { label: "Performance Metric", val: "Sub-1-second mobile page loads" },
      ],
    },
  },
  {
    id: "enquiries",
    tag: "Stage 03",
    shortTitle: "Enquiries",
    title: "More Enquiries",
    tagline: "Attention That Converts",
    description:
      "Turn online visitors into genuine telephone calls, direct WhatsApp messages, and verified inquiries without broken contact forms.",
    metrics: "Direct WhatsApp & Phone Pipelines",
    color: "from-amber-600/20 to-orange-500/10",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: MessageSquare,
    previewContent: {
      type: "enquiries",
      headline: "Qualified Inflow of Inquiries",
      details: [
        { label: "Direct Inquiries", val: "One-tap WhatsApp and phone contact" },
        { label: "Inquiry Quality", val: "Verified commercial intent" },
        { label: "Response Window", val: "Targeted under 15 minutes" },
      ],
    },
  },
  {
    id: "growth",
    tag: "Stage 04",
    shortTitle: "Growth",
    title: "More Growth",
    tagline: "Compound Over Time",
    description:
      "Continuously improve your digital presence based on real performance data, refining marketing campaigns with verifiable business outcomes.",
    metrics: "Measurable Commercial Returns",
    color: "from-indigo-600/20 to-palnadu-blue/20",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: TrendingUp,
    previewContent: {
      type: "growth",
      headline: "Long-Term Commercial Presence",
      details: [
        { label: "Regional Visibility", val: "Leading share in target categories" },
        { label: "Customer Acquisition", val: "Consistent month-over-month leads" },
        { label: "Asset Ownership", val: "100% client-owned code and domains" },
      ],
    },
  },
];
