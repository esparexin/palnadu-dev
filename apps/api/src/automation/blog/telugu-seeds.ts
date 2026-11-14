import type { BlogLanguage } from '@prisma/client';
import type { QueueCandidate } from './types';

type CuratedSeedEntry = Omit<QueueCandidate, 'source'>;

/**
 * Curated regional Telugu topic seeds across Palnadu, Guntur, and Andhra Pradesh
 * covering all five canonical categories without collapsing onto duplicate topicKeys.
 */
export const TELUGU_CURATED_TOPIC_QUEUE: readonly CuratedSeedEntry[] = [
  {
    categorySlug: 'website-development',
    language: 'te' as BlogLanguage,
    topic: 'గుంటూరులో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత అవుతుంది?',
    targetLocation: 'గుంటూరు, ఆంధ్రప్రదేశ్',
    primaryKeyword: 'గుంటూరులో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు',
  },
  {
    categorySlug: 'website-development',
    language: 'te' as BlogLanguage,
    topic: 'పల్నాడు చిన్న వ్యాపారాలకు తక్కువ బడ్జెట్‌లో ఉత్తమ వెబ్‌సైట్ డిజైన్ గైడ్',
    targetLocation: 'పల్నాడు జిల్లా',
    primaryKeyword: 'పల్నాడు వెబ్‌సైట్ డిజైన్',
  },
  {
    categorySlug: 'app-development',
    language: 'te' as BlogLanguage,
    topic: 'విజయవాడ వ్యాపారాలకు మొబైల్ యాప్ డెవలప్మెంట్ ఖర్చు వివరాలు',
    targetLocation: 'విజయవాడ మరియు గుంటూరు',
    primaryKeyword: 'విజయవాడ మొబైల్ యాప్ డెవలప్మెంట్',
  },
  {
    categorySlug: 'app-development',
    language: 'te' as BlogLanguage,
    topic: 'గుంటూరులో రిటైల్ వ్యాపారాల కోసం ఆండ్రాయిడ్ యాప్ ఎలా నిర్మించాలి?',
    targetLocation: 'గుంటూరు మరియు పల్నాడు',
    primaryKeyword: 'గుంటూరు రిటైల్ ఆండ్రాయిడ్ యాప్',
  },
  {
    categorySlug: 'website-development',
    language: 'te' as BlogLanguage,
    topic: 'తెనాలి వ్యాపారస్తులు ఆన్‌లైన్ స్టోర్ ఇ-కామర్స్ వెబ్‌సైట్ ఎలా ప్రారంభించాలి?',
    targetLocation: 'తెనాలి, గుంటూరు',
    primaryKeyword: 'తెనాలి ఇ-కామర్స్ వెబ్‌సైట్',
  },
  {
    categorySlug: 'website-development',
    language: 'te' as BlogLanguage,
    topic: 'మంగళగిరి హ్యాండ్లూమ్ వ్యాపారాలకు ఆన్‌లైన్ స్టోర్ ఇ-కామర్స్ ఖర్చు ఎంత?',
    targetLocation: 'మంగళగిరి మరియు అమరావతి',
    primaryKeyword: 'మంగళగిరి ఆన్‌లైన్ స్టోర్ ఇ-కామర్స్',
  },
  {
    categorySlug: 'website-development',
    language: 'te' as BlogLanguage,
    topic: 'నరసారావుపేటలో హోల్‌సేల్ దుకాణాలకు ఉత్తమ బిల్లింగ్ సాఫ్ట్‌వేర్',
    targetLocation: 'నరసారావుపేట, పల్నాడు',
    primaryKeyword: 'నరసారావుపేట బిల్లింగ్ సాఫ్ట్‌వేర్',
  },
  {
    categorySlug: 'website-development',
    language: 'te' as BlogLanguage,
    topic: 'పిడుగురాళ్ల పరిశ్రమలు మరియు గోదాములకు ఇన్వెంటరీ సాఫ్ట్‌వేర్ గైడ్',
    targetLocation: 'పిడుగురాళ్ల, పల్నాడు',
    primaryKeyword: 'పిడుగురాళ్ల ఇన్వెంటరీ సాఫ్ట్‌వేర్',
  },
  {
    categorySlug: 'school-websites',
    language: 'te' as BlogLanguage,
    topic: 'నరసారావుపేట పాఠశాలలకు డిజిటల్ అడ్మిషన్ పోర్టల్ మరియు ఫీ పోర్టల్ గైడ్',
    targetLocation: 'నరసారావుపేట మరియు పల్నాడు',
    primaryKeyword: 'నరసారావుపేట స్కూల్ డిజిటల్ అడ్మిషన్ పోర్టల్',
  },
  {
    categorySlug: 'school-websites',
    language: 'te' as BlogLanguage,
    topic: 'సత్తెనపల్లి కళాశాలలకు స్కూల్ మేనేజ్‌మెంట్ సాఫ్ట్‌వేర్ వర్సెస్ మాన్యువల్ రిజిస్టర్లు: తేడా ఏమిటి?',
    targetLocation: 'సత్తెనపల్లి, పల్నాడు',
    primaryKeyword: 'స్కూల్ మేనేజ్‌మెంట్ సాఫ్ట్‌వేర్ సత్తెనపల్లి',
  },
  {
    categorySlug: 'website-development',
    language: 'te' as BlogLanguage,
    topic: 'గుంటూరు ఆసుపత్రులకు హాస్పిటల్ మేనేజ్‌మెంట్ మరియు పేషెంట్ అపాయింట్‌మెంట్ గైడ్',
    targetLocation: 'గుంటూరు, కోస్తా ఆంధ్ర',
    primaryKeyword: 'గుంటూరు హాస్పిటల్ మేనేజ్‌మెంట్ సాఫ్ట్‌వేర్',
  },
  {
    categorySlug: 'local-seo-business',
    language: 'te' as BlogLanguage,
    topic: 'వినుకొండ వ్యాపారాలు గూగుల్‌లో కనిపించేలా లోకల్ ఎస్‌ఇ‌ఓ గైడ్',
    targetLocation: 'వినుకొండ, పల్నాడు',
    primaryKeyword: 'వినుకొండ లోకల్ ఎస్‌ఇ‌ఓ గైడ్',
  },
  {
    categorySlug: 'local-seo-business',
    language: 'te' as BlogLanguage,
    topic: 'అమరావతి వ్యాపారాలకు డిజిటల్ మార్కెటింగ్ మరియు గూగుల్ యాడ్స్ ఖర్చు వివరాలు',
    targetLocation: 'అమరావతి మరియు విజయవాడ',
    primaryKeyword: 'అమరావతి డిజిటల్ మార్కెటింగ్ గూగుల్ యాడ్స్',
  },
  {
    categorySlug: 'startups',
    language: 'te' as BlogLanguage,
    topic: 'ఆంధ్రప్రదేశ్‌లో కొత్త వ్యాపారం కోసం సాస్ మరియు ఎమ్‌వీ‌పీ స్టార్టప్ ఎలా ప్రారంభించాలి?',
    targetLocation: 'ఆంధ్రప్రదేశ్',
    primaryKeyword: 'ఆంధ్రప్రదేశ్ సాస్ ఎమ్‌వీ‌పీ స్టార్టప్',
  },
  {
    categorySlug: 'startups',
    language: 'te' as BlogLanguage,
    topic: 'విజయవాడ స్టార్టప్ ఎమ్‌వీ‌పీ నిర్మాణానికి ఎంత సమయం పడుతుంది?',
    targetLocation: 'విజయవాడ, ఆంధ్రప్రదేశ్',
    primaryKeyword: 'విజయవాడ స్టార్టప్ ఎమ్‌వీ‌పీ',
  },
  {
    categorySlug: 'website-development',
    language: 'te' as BlogLanguage,
    topic: 'మాచేర్ల వ్యాపారాలకు ఆధునిక వెబ్‌సైట్ వర్సెస్ పాత వెబ్ డిజైన్ పోలిక',
    targetLocation: 'మాచేర్ల, పల్నాడు',
    primaryKeyword: 'మాచేర్ల ఆధునిక వెబ్‌సైట్ డిజైన్',
  },
  {
    categorySlug: 'local-seo-business',
    language: 'te' as BlogLanguage,
    topic: 'బాపట్ల స్థానిక సంస్థలకు అత్యుత్తమ సెర్చ్ ఇంజిన్ ఆప్టిమైజేషన్ వ్యూహాలు',
    targetLocation: 'బాపట్ల, ఆంధ్రప్రదేశ్',
    primaryKeyword: 'బాపట్ల సెర్చ్ ఇంజిన్ ఆప్టిమైజేషన్',
  },
];

