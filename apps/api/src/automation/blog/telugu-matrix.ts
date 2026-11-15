import type { BlogLanguage } from '@prisma/client';
import type { QueueCandidate } from './types';
import { toTopicKey } from '../topic-identity';
import { TELUGU_CURATED_TOPIC_QUEUE } from './telugu-seeds';

type CuratedSeedEntry = Omit<QueueCandidate, 'source'>;

const TE_LANG = 'te' as BlogLanguage;

/**
 * Extended regional Telugu seeds across Palnadu, Guntur, and Andhra Pradesh
 * providing sustainable topic supply beyond the initial 17 seeds across all 5 categories.
 */
export const EXTENDED_TELUGU_SEEDS: readonly CuratedSeedEntry[] = [
  // Website Development
  {
    categorySlug: 'website-development',
    language: TE_LANG,
    topic: 'చిలకలూరిపేట వ్యాపారాలకు క్లౌడ్ ఆధారిత బిల్లింగ్ మరియు ఇన్వెంటరీ పోర్టల్',
    targetLocation: 'చిలకలూరిపేట, పల్నాడు',
    primaryKeyword: 'చిలకలూరిపేట బిల్లింగ్ ఇన్వెంటరీ పోర్టల్',
  },
  {
    categorySlug: 'website-development',
    language: TE_LANG,
    topic: 'వినుకొండ రిటైల్ దుకాణాలకు ఆటోమేటెడ్ బిల్లింగ్ సాఫ్ట్‌వేర్ ప్రయోజనాలు',
    targetLocation: 'వినుకొండ, పల్నాడు',
    primaryKeyword: 'వినుకొండ ఆటోమేటెడ్ బిల్లింగ్ సాఫ్ట్‌వేర్',
  },
  {
    categorySlug: 'website-development',
    language: TE_LANG,
    topic: 'సత్తెనపల్లి వ్యాపారాలకు వేగవంతమైన మొబైల్ రెస్పాన్సివ్ వెబ్‌సైట్ డిజైన్',
    targetLocation: 'సత్తెనపల్లి, పల్నాడు',
    primaryKeyword: 'సత్తెనపల్లి రెస్పాన్సివ్ వెబ్‌సైట్ డిజైన్',
  },
  {
    categorySlug: 'website-development',
    language: TE_LANG,
    topic: 'బాపట్ల హోటళ్లు మరియు రిసార్టులకు ఆన్‌లైన్ రూమ్ బుకింగ్ వెబ్‌సైట్ గైడ్',
    targetLocation: 'బాపట్ల, ఆంధ్రప్రదేశ్',
    primaryKeyword: 'బాపట్ల హోటల్ బుకింగ్ వెబ్‌సైట్',
  },
  {
    categorySlug: 'website-development',
    language: TE_LANG,
    topic: 'అమరావతి రియల్ ఎస్టేట్ ప్రాపర్టీ పోర్టల్ వెబ్‌సైట్ డెవలప్‌మెంట్ ఫీచర్లు',
    targetLocation: 'అమరావతి మరియు విజయవాడ',
    primaryKeyword: 'అమరావతి రియల్ ఎస్టేట్ పోర్టల్',
  },
  {
    categorySlug: 'website-development',
    language: TE_LANG,
    topic: 'విజయవాడ హోల్‌సేల్ డిస్ట్రిబ్యూటర్లకు క్లౌడ్ ఆర్డరింగ్ వెబ్ పోర్టల్',
    targetLocation: 'విజయవాడ, ఆంధ్రప్రదేశ్',
    primaryKeyword: 'విజయవాడ క్లౌడ్ ఆర్డరింగ్ వెబ్ పోర్టల్',
  },
  // App Development
  {
    categorySlug: 'app-development',
    language: TE_LANG,
    topic: 'నరసారావుపేటలో ఫీల్డ్ సేల్స్ మరియు డెలివరీ ఏజెంట్ ట్రాకింగ్ యాప్ గైడ్',
    targetLocation: 'నరసారావుపేట, పల్నాడు',
    primaryKeyword: 'నరసారావుపేట ఫీల్డ్ సేల్స్ డెలివరీ యాప్',
  },
  {
    categorySlug: 'app-development',
    language: TE_LANG,
    topic: 'చిలకలూరిపేట పత్తి మరియు మిర్చి వ్యాపారులకు ట్రేడింగ్ మొబైల్ యాప్',
    targetLocation: 'చిలకలూరిపేట మరియు గుంటూరు',
    primaryKeyword: 'చిలకలూరిపేట అగ్రి ట్రేడింగ్ యాప్',
  },
  {
    categorySlug: 'app-development',
    language: TE_LANG,
    topic: 'తెనాలి స్థానిక రెస్టారెంట్లకు ఆన్‌లైన్ ఫుడ్ డెలివరీ మొబైల్ యాప్ ఖర్చు',
    targetLocation: 'తెనాలి, గుంటూరు',
    primaryKeyword: 'తెనాలి ఫుడ్ డెలివరీ మొబైల్ యాప్',
  },
  {
    categorySlug: 'app-development',
    language: TE_LANG,
    topic: 'మంగళగిరి వీవర్స్ మరియు టెక్స్‌టైల్స్ కోసం కస్టమర్ ఆర్డరింగ్ ఆండ్రాయిడ్ యాప్',
    targetLocation: 'మంగళగిరి, గుంటూరు',
    primaryKeyword: 'మంగళగిరి టెక్స్‌టైల్స్ ఆండ్రాయిడ్ యాప్',
  },
  {
    categorySlug: 'app-development',
    language: TE_LANG,
    topic: 'పిడుగురాళ్ల లాజిస్టిక్స్ మరియు ట్రాన్స్‌పోర్ట్ వ్యాపారాలకు ఫ్లీట్ ట్రాకింగ్ యాప్',
    targetLocation: 'పిడుగురాళ్ల, పల్నాడు',
    primaryKeyword: 'పిడుగురాళ్ల ఫ్లీట్ ట్రాకింగ్ యాప్',
  },
  {
    categorySlug: 'app-development',
    language: TE_LANG,
    topic: 'సత్తెనపల్లి రైస్ మిల్లులు మరియు ధాన్యం వ్యాపారాలకు మొబైల్ ఆర్డర్ సిస్టమ్',
    targetLocation: 'సత్తెనపల్లి, పల్నాడు',
    primaryKeyword: 'సత్తెనపల్లి రైస్ మిల్ మొబైల్ ఆర్డర్ సిస్టమ్',
  },
  // School Websites
  {
    categorySlug: 'school-websites',
    language: TE_LANG,
    topic: 'గుంటూరు ప్రైవేట్ పాఠశాలలకు ఆన్‌లైన్ ఫీజు చెల్లింపు మరియు యూపీఐ రసీదుల పోర్టల్',
    targetLocation: 'గుంటూరు, ఆంధ్రప్రదేశ్',
    primaryKeyword: 'గుంటూరు పాఠశాల ఆన్‌లైన్ ఫీజు పోర్టల్',
  },
  {
    categorySlug: 'school-websites',
    language: TE_LANG,
    topic: 'చిలకలూరిపేట విద్యా సంస్థలకు స్టూడెంట్ అటెండెన్స్ మరియు ఎస్ఎంఎస్ పోర్టల్',
    targetLocation: 'చిలకలూరిపేట, పల్నాడు',
    primaryKeyword: 'చిలకలూరిపేట స్కూల్ అటెండెన్స్ పోర్టల్',
  },
  {
    categorySlug: 'school-websites',
    language: TE_LANG,
    topic: 'తెనాలి పాఠశాలలకు మొబైల్ ఫ్రెండ్లీ అడ్మిషన్ వెబ్‌సైట్ ఎందుకు అవసరం?',
    targetLocation: 'తెనాలి, గుంటూరు',
    primaryKeyword: 'తెనాలి స్కూల్ అడ్మిషన్ వెబ్‌సైట్',
  },
  {
    categorySlug: 'school-websites',
    language: TE_LANG,
    topic: 'వినుకొండ స్కూల్స్ మరియు జూనియర్ కాలేజీలకు డిజిటల్ రిపోర్ట్ కార్డ్ సాఫ్ట్‌వేర్',
    targetLocation: 'వినుకొండ, పల్నాడు',
    primaryKeyword: 'వినుకొండ డిజిటల్ రిపోర్ట్ కార్డ్ సాఫ్ట్‌వేర్',
  },
  {
    categorySlug: 'school-websites',
    language: TE_LANG,
    topic: 'మాచేర్ల విద్యా సంస్థలకు ఆటోమేటెడ్ ఫీజు రికన్సిలియేషన్ సాఫ్ట్‌వేర్ ప్రయోజనాలు',
    targetLocation: 'మాచేర్ల, పల్నాడు',
    primaryKeyword: 'మాచేర్ల స్కూల్ ఫీజు రికన్సిలియేషన్',
  },
  // Startups & MVPs
  {
    categorySlug: 'startups',
    language: TE_LANG,
    topic: 'గుంటూరులో టెక్ స్టార్టప్ ప్రారంభించడానికి ఆధునిక టెక్ స్టాక్ గైడ్',
    targetLocation: 'గుంటూరు, ఆంధ్రప్రదేశ్',
    primaryKeyword: 'గుంటూరు టెక్ స్టార్టప్ టెక్ స్టాక్',
  },
  {
    categorySlug: 'startups',
    language: TE_LANG,
    topic: 'అమరావతి నవ వ్యాపారాలకు తక్కువ బడ్జెట్‌లో ఎంవీపీ ప్రోటోటైప్ డెవలప్‌మెంట్',
    targetLocation: 'అమరావతి, ఆంధ్రప్రదేశ్',
    primaryKeyword: 'అమరావతి ఎంవీపీ ప్రోటోటైప్ డెవలప్‌మెంట్',
  },
  {
    categorySlug: 'startups',
    language: TE_LANG,
    topic: 'మంగళగిరి మరియు తెనాలి పారిశ్రామికవేత్తలకు డిజిటల్ ప్రొడక్ట్ ఆర్కిటెక్చర్ గైడ్',
    targetLocation: 'మంగళగిరి మరియు తెనాలి',
    primaryKeyword: 'మంగళగిరి డిజిటల్ ప్రొడక్ట్ ఆర్కిటెక్చర్',
  },
  {
    categorySlug: 'startups',
    language: TE_LANG,
    topic: 'పల్నాడు యువ పారిశ్రామికవేత్తలకు సాఫ్ట్‌వేర్ ప్రాడక్ట్ డెవలప్‌మెంట్ వ్యూహాలు',
    targetLocation: 'పల్నాడు జిల్లా',
    primaryKeyword: 'పల్నాడు సాఫ్ట్‌వేర్ ప్రాడక్ట్ డెవలప్‌మెంట్',
  },
  // Local SEO & Business
  {
    categorySlug: 'local-seo-business',
    language: TE_LANG,
    topic: 'గుంటూరు వ్యాపారాలు గూగుల్ మ్యాప్స్‌లో టాప్ ర్యాంక్ సాధించడానికి లోకల్ ఎస్‌ఇ‌ఓ ప్లేబుక్',
    targetLocation: 'గుంటూరు, ఆంధ్రప్రదేశ్',
    primaryKeyword: 'గుంటూరు గూగుల్ మ్యాప్స్ లోకల్ ఎస్‌ఇ‌ఓ',
  },
  {
    categorySlug: 'local-seo-business',
    language: TE_LANG,
    topic: 'నరసారావుపేటలో వ్యాపార సంస్థలకు గూగుల్ బిజినెస్ ప్రొఫైల్ ఆప్టిమైజేషన్ గైడ్',
    targetLocation: 'నరసారావుపేట, పల్నాడు',
    primaryKeyword: 'నరసారావుపేట గూగుల్ బిజినెస్ ప్రొఫైల్',
  },
  {
    categorySlug: 'local-seo-business',
    language: TE_LANG,
    topic: 'చిలకలూరిపేట స్థానిక వ్యాపారులకు డిజిటల్ మార్కెటింగ్ మరియు కస్టమర్ లీడ్స్ గైడ్',
    targetLocation: 'చిలకలూరిపేట, పల్నాడు',
    primaryKeyword: 'చిలకలూరిపేట డిజిటల్ మార్కెటింగ్ లీడ్స్',
  },
  {
    categorySlug: 'local-seo-business',
    language: TE_LANG,
    topic: 'తెనాలి వ్యాపారాలకు గూగుల్ సెర్చ్ మరియు లోకల్ మ్యాప్స్ ద్వారా కస్టమర్లను ఎలా పొందాలి?',
    targetLocation: 'తెనాలి, గుంటూరు',
    primaryKeyword: 'తెనాలి గూగుల్ సెర్చ్ లోకల్ కస్టమర్లు',
  },
  {
    categorySlug: 'local-seo-business',
    language: TE_LANG,
    topic: 'పిడుగురాళ్ల వ్యాపారాలకు స్థానిక మార్కెటింగ్ మరియు ఆర్గానిక్ సెర్చ్ వ్యూహాలు',
    targetLocation: 'పిడుగురాళ్ల, పల్నాడు',
    primaryKeyword: 'పిడుగురాళ్ల స్థానిక మార్కెటింగ్ వ్యూహాలు',
  },
  {
    categorySlug: 'local-seo-business',
    language: TE_LANG,
    topic: 'సత్తెనపల్లి వ్యాపారస్తులకు లోకల్ ఎస్‌ఇ‌ఓ ద్వారా ఆన్‌లైన్ విజిబిలిటీ పెంచే విధానం',
    targetLocation: 'సత్తెనపల్లి, పల్నాడు',
    primaryKeyword: 'సత్తెనపల్లి లోకల్ ఎస్‌ఇ‌ఓ విజిబిలిటీ',
  },
];

/** Returns all curated and extended regional Telugu seeds with deduplication against existing topicKeys. */
export function getAllTeluguSeeds(excludeKeys: Set<string> = new Set()): QueueCandidate[] {
  const seenKeys = new Set<string>();
  const candidates: QueueCandidate[] = [];

  const allSeeds = [...TELUGU_CURATED_TOPIC_QUEUE, ...EXTENDED_TELUGU_SEEDS];

  for (const seed of allSeeds) {
    const key = toTopicKey(seed.topic);
    const compoundKey = `${key}::te`;
    if (!key || excludeKeys.has(compoundKey) || excludeKeys.has(key) || seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);
    candidates.push({
      ...seed,
      language: TE_LANG,
      source: 'curated-rotation',
    });
  }

  return candidates;
}
