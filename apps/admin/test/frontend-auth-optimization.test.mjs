import test from 'node:test';
import assert from 'node:assert/strict';

function createMockJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = 'mock_signature';
  return `${header}.${body}.${sig}`;
}

function parseJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload || !payload.sub) return false;
  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    return false;
  }
  return true;
}

test('Frontend Auth Guard - Token Validation & Expiration', async (t) => {
  await t.test('rejects null, undefined, or empty token strings', () => {
    assert.equal(isTokenValid(null), false);
    assert.equal(isTokenValid(undefined), false);
    assert.equal(isTokenValid(''), false);
  });

  await t.test('rejects malformed token strings without 3 segments', () => {
    assert.equal(isTokenValid('not-a-token'), false);
    assert.equal(isTokenValid('header.payload'), false);
  });

  await t.test('rejects token without sub identity', () => {
    const token = createMockJwt({ email: 'admin@palnadu.dev' });
    assert.equal(isTokenValid(token), false);
  });

  await t.test('rejects expired token', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const token = createMockJwt({ sub: 'user_1', email: 'admin@palnadu.dev', exp: pastExp });
    assert.equal(isTokenValid(token), false);
  });

  await t.test('accepts valid, non-expired token', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 7 * 86400; // 7 days ahead
    const token = createMockJwt({ sub: 'user_1', email: 'admin@palnadu.dev', role: 'SUPER_ADMIN', exp: futureExp });
    assert.equal(isTokenValid(token), true);
  });
});

test('Frontend Branding Cache & In-Flight Request Deduplication', async (t) => {
  let networkFetches = 0;
  let brandingCache = null;
  let pendingBrandingPromise = null;
  const BRANDING_CACHE_TTL_MS = 60_000;

  const mockFetchBrandingFromApi = async () => {
    networkFetches++;
    return { success: true, data: { headerLogo: { url: 'https://cdn.palnadu.dev/logo.png' } } };
  };

  const getBranding = async () => {
    const now = Date.now();
    if (brandingCache && now < brandingCache.expiry) {
      return { success: true, data: brandingCache.data };
    }
    if (pendingBrandingPromise) {
      return pendingBrandingPromise;
    }
    pendingBrandingPromise = mockFetchBrandingFromApi()
      .then((res) => {
        if (res.success && res.data) {
          brandingCache = { data: res.data, expiry: Date.now() + BRANDING_CACHE_TTL_MS };
        }
        return res;
      })
      .finally(() => {
        pendingBrandingPromise = null;
      });
    return pendingBrandingPromise;
  };

  const invalidateBrandingClientCache = () => {
    brandingCache = null;
    pendingBrandingPromise = null;
  };

  await t.test('deduplicates simultaneous concurrent branding requests into a single network call', async () => {
    networkFetches = 0;
    invalidateBrandingClientCache();

    // Simulate LoginPage and AdminSidebar mounting simultaneously
    const [res1, res2, res3] = await Promise.all([
      getBranding(),
      getBranding(),
      getBranding(),
    ]);

    assert.equal(networkFetches, 1, 'Concurrent calls must be deduplicated to 1 network request');
    assert.equal(res1.data.headerLogo.url, 'https://cdn.palnadu.dev/logo.png');
    assert.equal(res2.data.headerLogo.url, 'https://cdn.palnadu.dev/logo.png');
    assert.equal(res3.data.headerLogo.url, 'https://cdn.palnadu.dev/logo.png');
  });

  await t.test('serves subsequent calls from in-memory cache without extra network requests', async () => {
    networkFetches = 0;
    // Cache was populated in previous test
    const res = await getBranding();
    assert.equal(networkFetches, 0, 'Subsequent call within TTL must hit cache');
    assert.equal(res.data.headerLogo.url, 'https://cdn.palnadu.dev/logo.png');
  });

  await t.test('refetches from network after cache invalidation', async () => {
    networkFetches = 0;
    invalidateBrandingClientCache();

    const res = await getBranding();
    assert.equal(networkFetches, 1, 'Call after cache invalidation must trigger network fetch');
    assert.equal(res.data.headerLogo.url, 'https://cdn.palnadu.dev/logo.png');
  });
});

test('Role-Based Navigation Safety (No SUPER_ADMIN Leak)', async (t) => {
  const sidebarItems = [
    { title: 'Dashboard', href: '/dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EDITOR', 'DEVELOPER'] },
    { title: 'Users', href: '/users', roles: ['SUPER_ADMIN'] },
    { title: 'Settings', href: '/settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { title: 'Blog', href: '/blog', roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
  ];

  const filterItems = (role) => sidebarItems.filter((item) => (role ? item.roles.includes(role) : false));

  await t.test('renders zero menu items if role is uninitialized or empty', () => {
    const uninitialized = filterItems('');
    assert.equal(uninitialized.length, 0, 'Must never leak SUPER_ADMIN links before role is verified');
  });

  await t.test('filters menu items strictly for EDITOR role without super admin leak', () => {
    const editorItems = filterItems('EDITOR');
    const titles = editorItems.map((i) => i.title);
    assert.ok(titles.includes('Dashboard'));
    assert.ok(titles.includes('Blog'));
    assert.equal(titles.includes('Users'), false, 'EDITOR must never see Users link');
    assert.equal(titles.includes('Settings'), false, 'EDITOR must never see Settings link');
  });

  await t.test('displays all authorized items for SUPER_ADMIN role', () => {
    const superAdminItems = filterItems('SUPER_ADMIN');
    assert.equal(superAdminItems.length, 4);
  });
});
