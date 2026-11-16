import { CANONICAL_BLOG_CATEGORIES } from '../dist/automation/blog/blog-seeds.js';

export function validLlmDraftPayload(lang = 'en') {
  const isTe = lang === 'te';
  const body = isTe
    ? Array.from({ length: 36 }, () => 'గుంటూర్ మరియు పల్నాడు వ్యాపారాల కోసం వెబ్ మరియు మొబైల్ సాఫ్ట్‌వేర్ నిర్మాణం గురించి సమగ్ర సాంకేతిక వివరాలు మరియు పరిష్కారాలు అందుబాటులో ఉన్నాయి. ').join('') +
      '\n\n## 1. సాంకేతిక నిర్మాణం\n\nమా [మొబైల్ యాప్ సేవలు](/services/android-app-development) చూడండి.\n\n## 2. అమలు విధానం\n\nసంప్రదించండి [సంప్రదింపు పేజీ](/contact).'
    : Array.from({ length: 58 }, () => 'Modern enterprise software in Guntur and Palnadu removes manual bottlenecks across teams. ').join('') +
      '\n\n## Architecture Blueprint\n\nExplore our [Website Development](/services/website-development) practice.\n\n## Regional Rollout\n\nReach out via [Contact Us](/contact).';
  return JSON.stringify({
    title: isTe ? 'గుంటూరు వ్యాపారాల కోసం ఆధునిక వెబ్ సాఫ్ట్‌వేర్ గైడ్' : 'Custom Enterprise Web Platforms for Growing Guntur Businesses',
    slug: isTe ? 'guntur-business-web-software-guide-te' : 'custom-enterprise-web-platforms-guntur',
    h1: isTe ? 'గుంటూరు వ్యాపారాల వెబ్ సాఫ్ట్‌వేర్' : 'Custom Enterprise Web Platforms in Guntur',
    excerpt: 'Comprehensive engineering guide for regional business growth.',
    content: body,
    metaTitle: 'Enterprise Web Platforms | Palnadu.dev',
    metaDescription: 'Practical engineering guide on building custom web platforms in Guntur and Palnadu.',
    primaryKeyword: isTe ? 'వెబ్ సాఫ్ట్‌వేర్' : 'enterprise web platforms',
    secondaryKeywords: [isTe ? 'గుంటూరు టెక్నాలజీ' : 'guntur software'],
    h2Headings: isTe ? ['సాంకేతిక నిర్మాణం', 'అమలు విధానం'] : ['Architecture Blueprint', 'Regional Rollout'],
    internalLinks: [
      { anchor: isTe ? 'మొబైల్ యాప్ సేవలు' : 'Website Development', url: isTe ? '/services/android-app-development' : '/services/website-development' },
      { anchor: isTe ? 'సంప్రదింపు పేజీ' : 'Contact Us', url: '/contact' },
    ],
    faq: [{ q: 'Timeline?', a: '4-6 weeks.' }],
  });
}

export function createFullLifecyclePrisma() {
  const store = {
    siteSettings: new Map([['auto_publish_blogs', { key: 'auto_publish_blogs', value: true }]]),
    topics: new Map(),
    posts: new Map(),
    logs: [],
    notifications: [],
    users: [{ id: 'admin-1', role: 'SUPER_ADMIN', email: 'admin@palnadu.dev', createdAt: new Date() }],
    categories: CANONICAL_BLOG_CATEGORIES.map((c, i) => ({ id: `cat-${i}`, slug: c.slug, name: c.name })),
  };

  return {
    store,
    siteSetting: {
      async findUnique({ where: { key } }) { return store.siteSettings.get(key) ?? null; },
      async findMany({ where = {} }) {
        let all = Array.from(store.siteSettings.values());
        if (where.key?.in) all = all.filter((s) => where.key.in.includes(s.key));
        return all;
      },
      async create({ data }) {
        if (store.siteSettings.has(data.key)) { const e = new Error('P2002'); e.code = 'P2002'; throw e; }
        const r = { ...data, updatedAt: new Date() };
        store.siteSettings.set(data.key, r);
        return r;
      },
      async updateMany({ where, data }) {
        const cur = store.siteSettings.get(where.key);
        if (!cur) return { count: 0 };
        store.siteSettings.set(where.key, { ...cur, ...data, updatedAt: new Date() });
        return { count: 1 };
      },
      async upsert({ where: { key }, update, create }) {
        const cur = store.siteSettings.get(key);
        const r = cur ? { ...cur, ...update, updatedAt: new Date() } : { ...create, updatedAt: new Date() };
        store.siteSettings.set(key, r);
        return r;
      },
    },
    blogTopic: {
      async findMany({ where = {} }) {
        let all = Array.from(store.topics.values());
        if (where.status) all = all.filter((t) => t.status === where.status);
        if (where.language) all = all.filter((t) => t.language === where.language);
        return all;
      },
      async findFirst({ where = {} }) {
        let all = Array.from(store.topics.values());
        if (where.language) all = all.filter((t) => t.language === where.language);
        if (where.attempts?.lt) all = all.filter((t) => t.attempts < where.attempts.lt);
        return all[0] ?? null;
      },
      async findUnique({ where: { topicKey_language } }) {
        if (topicKey_language) return store.topics.get(`${topicKey_language.topicKey}:${topicKey_language.language}`) ?? null;
        return null;
      },
      async create({ data }) {
        const key = `${data.topicKey}:${data.language}`;
        if (store.topics.has(key)) { const e = new Error('P2002'); e.code = 'P2002'; throw e; }
        const r = { id: `top-${store.topics.size + 1}`, status: 'PENDING', attempts: 0, lastError: null, nextRetryAt: null, claimedAt: null, claimedBy: null, createdAt: new Date(), ...data };
        store.topics.set(key, r);
        return r;
      },
      async update({ where: { topicKey_language }, data }) {
        const k = `${topicKey_language.topicKey}:${topicKey_language.language}`;
        const cur = store.topics.get(k);
        if (!cur) throw new Error(`Topic not found: ${k}`);
        const upd = { ...cur, ...data };
        if (data.attempts?.increment) upd.attempts = (cur.attempts || 0) + data.attempts.increment;
        store.topics.set(k, upd);
        return upd;
      },
      async updateMany({ where = {}, data }) {
        let count = 0;
        for (const [k, cur] of store.topics.entries()) {
          if (where.id && cur.id !== where.id) continue;
          if (where.topicKey && cur.topicKey !== where.topicKey) continue;
          if (where.language && cur.language !== where.language) continue;
          if (where.status?.in && !where.status.in.includes(cur.status)) continue;
          if (where.status && typeof where.status === 'string' && cur.status !== where.status) continue;
          if (where.attempts?.lt && cur.attempts >= where.attempts.lt) continue;
          if (where.OR) {
            const orMatched = where.OR.some((cond) => {
              if ('claimedAt' in cond) {
                if (cond.claimedAt === null) return cur.claimedAt === null;
                if (cond.claimedAt?.lt) return cur.claimedAt && cur.claimedAt < cond.claimedAt.lt;
              }
              return true;
            });
            if (!orMatched) continue;
          }
          const upd = { ...cur, ...data };
          store.topics.set(k, upd);
          count++;
        }
        return { count };
      },
      async count({ where = {} }) {
        let all = Array.from(store.topics.values());
        if (where.status) all = all.filter((t) => t.status === where.status);
        if (where.language) all = all.filter((t) => t.language === where.language);
        return all.length;
      },
    },
    blogPost: {
      async findUnique({ where: { topicKey_language, slug } }) {
        if (topicKey_language) return store.posts.get(`${topicKey_language.topicKey}:${topicKey_language.language}`) ?? null;
        if (slug) return Array.from(store.posts.values()).find((p) => p.slug === slug) ?? null;
        return null;
      },
      async findMany({ where = {} }) {
        let all = Array.from(store.posts.values());
        if (where.language) all = all.filter((p) => p.language === where.language);
        return all;
      },
      async create({ data }) {
        const k = `${data.topicKey}:${data.language}`;
        if (store.posts.has(k)) { const e = new Error('P2002'); e.code = 'P2002'; throw e; }
        const r = { id: `post-${store.posts.size + 1}`, createdAt: new Date(), ...data };
        store.posts.set(k, r);
        return r;
      },
      async count({ where = {} } = {}) {
        let all = Array.from(store.posts.values());
        if (where?.status) all = all.filter((p) => p.status === where.status);
        return all.length;
      },
    },
    blogGenerationLog: {
      async create({ data }) { store.logs.push(data); return { id: `log-${store.logs.length}`, ...data }; },
    },
    notification: {
      async create({ data }) { store.notifications.push(data); return { id: `notif-${store.notifications.length}`, ...data }; },
    },
    blogCategory: {
      async findUnique({ where: { slug } }) { return store.categories.find((c) => c.slug === slug) ?? null; },
      async findFirst({ where: { slug } }) { return store.categories.find((c) => c.slug === slug) ?? null; },
      async upsert({ where: { slug }, create }) {
        const cur = store.categories.find((c) => c.slug === slug);
        if (cur) return cur;
        const n = { id: `cat-${store.categories.length + 1}`, ...create };
        store.categories.push(n);
        return n;
      },
    },
    user: {
      async findFirst() { return store.users[0] ?? null; },
    },
  };
}
