/**
 * Automated Bilingual Auto-Blogging Generation Run (3 Telugu + 2 English)
 * Executes against live MongoDB Atlas & Google Gemini API.
 */
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../apps/api/dist/app.module');
const { BlogAutomationService } = require('../apps/api/dist/automation/blog-automation.service');

const SEED_TELUGU_TOPICS = [
  {
    topic: 'మాచర్లలో హోల్‌సేల్ వ్యాపారాల కోసం వెబ్‌సైట్ మరియు బిల్లింగ్ సాఫ్ట్‌వేర్ ఖర్చు ఎంత?',
    categorySlug: 'website-development',
    targetLocation: 'Macherla, Palnadu',
    searchIntent: 'COMMERCIAL_INVESTIGATION',
    primaryKeyword: 'మాచర్లలో వెబ్‌సైట్ డెవలప్‌మెంట్',
    keywords: ['హోల్‌సేల్ బిల్లింగ్ సాఫ్ట్‌వేర్ మాచర్ల', 'సాఫ్ట్‌వేర్ కంపెనీ మాచర్ల', 'వెబ్‌సైట్ ధరలు పల్నాడు'],
    referenceSources: ['Google Live Suggest: Macherla commercial software', 'Palnadu local market research'],
    source: 'manual',
    language: 'te',
  },
  {
    topic: 'పల్నాడు జిల్లాలోని రిటైల్ దుకాణాలకు ఆధునిక ఇన్వెంటరీ మరియు అకౌంటింగ్ సాఫ్ట్‌వేర్ ప్రయోజనాలు',
    categorySlug: 'website-development',
    targetLocation: 'Palnadu, Andhra Pradesh',
    searchIntent: 'HOW_TO',
    primaryKeyword: 'ఇన్వెంటరీ సాఫ్ట్‌వేర్ పల్నాడు',
    keywords: ['రిటైల్ బిల్లింగ్ సాఫ్ట్‌వేర్ ఆంధ్రప్రదేశ్', 'వ్యాపార సాఫ్ట్‌వేర్ సొల్యూషన్స్', 'జీఎస్టీ బిల్లింగ్ సిస్టమ్'],
    referenceSources: ['Google Live Suggest: retail inventory software Andhra Pradesh', 'Regional MSME trade survey'],
    source: 'manual',
    language: 'te',
  },
  {
    topic: 'గుంటూరు మరియు పల్నాడులో ప్రైవేట్ క్లినిక్‌ల కోసం ఆన్‌లైన్ పేషెంట్ అపాయింట్‌మెంట్ సిస్టమ్',
    categorySlug: 'local-seo-business',
    targetLocation: 'Guntur & Palnadu, Andhra Pradesh',
    searchIntent: 'PRODUCT_SERVICE_RESEARCH',
    primaryKeyword: 'హాస్పిటల్ మేనేజ్‌మెంట్ సాఫ్ట్‌వేర్ గుంటూరు',
    keywords: ['డాక్టర్ అపాయింట్‌మెంట్ వెబ్‌సైట్', 'క్లినిక్ సాఫ్ట్‌వేర్ పల్నాడు', 'లోకల్ ఎస్‌ఈఓ హాస్పిటల్స్'],
    referenceSources: ['Google Live Suggest: hospital management software Guntur', 'Local clinic workflow audit'],
    source: 'manual',
    language: 'te',
  },
];

async function main() {
  console.log('🚀 Initializing Palnadu.dev bilingual generation runner...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const blogService = app.get(BlogAutomationService);

  try {
    console.log('📌 Enqueueing 3 regional Telugu topics...');
    for (const t of SEED_TELUGU_TOPICS) {
      const res = await blogService.enqueueTopic(t);
      console.log(`  [TE] "${t.topic.slice(0, 40)}..." -> enqueued: ${res.enqueued} (key: ${res.topicKey}, reason: ${res.reason || 'ok'})`);
    }

    const bilingualStatus = await blogService.getBilingualStatus();
    console.log(`\n📊 Queue State: Pending TE=${bilingualStatus.pending.te}, Pending EN=${bilingualStatus.pending.en}`);

    console.log('\n⚙️  Running Bilingual Batch (Quota: 3 TE + 2 EN)...');
    const workerId = `runner:${process.pid}:${Date.now()}`;
    const startTime = Date.now();
    const batchResult = await blogService.generateBilingualBatch({ te: 3, en: 2 }, false, workerId);
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n✅ Generation run finished in ${durationSec}s`);
    console.log(`Generated: ${batchResult.results.length} articles`);
    console.log(`Rejected: ${batchResult.rejected.length} topics`);

    if (batchResult.results.length > 0) {
      console.log('\n--- GENERATED ARTICLES ---');
      for (const res of batchResult.results) {
        console.log(`• ID: ${res.id}`);
        console.log(`  Title: ${res.title}`);
        console.log(`  Slug: ${res.slug}`);
        console.log(`  Category: ${res.category} | Status: ${res.status} | Words: ${res.wordCount}`);
        console.log(`  URL: ${res.url}\n`);
      }
    }

    if (batchResult.rejected.length > 0) {
      console.log('\n--- REJECTED TOPICS ---');
      for (const rej of batchResult.rejected) {
        console.log(`⚠️  ${rej.topicKey} (${rej.topic}): ${rej.reason} -> ${rej.detail}`);
      }
    }
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('Fatal error during bilingual batch:', err);
  process.exit(1);
});
