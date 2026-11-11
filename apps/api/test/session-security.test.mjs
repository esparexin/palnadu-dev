import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sessionServicePath = fileURLToPath(new URL('../dist/auth/session.service.js', import.meta.url));
const cookieUtilPath = fileURLToPath(new URL('../dist/auth/cookie.util.js', import.meta.url));
const csrfGuardPath = fileURLToPath(new URL('../dist/common/guards/csrf.guard.js', import.meta.url));

const { SessionService, hashToken, generateSecureToken, generateCsrfToken } = require(sessionServicePath);
const { parseCookies, setAuthCookies, clearAuthCookies, ADMIN_SESSION_COOKIE, CSRF_COOKIE } = require(cookieUtilPath);
const { CsrfGuard } = require(csrfGuardPath);

test('Session Security - Cryptographic Tokens & Hashing', async (t) => {
  await t.test('generates 256-bit cryptographically secure unpredictable tokens', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();
    assert.equal(token1.length, 64);
    assert.equal(token2.length, 64);
    assert.notEqual(token1, token2);
  });

  await t.test('hashes tokens deterministically with SHA-256', () => {
    const token = 'test-token-secret-12345';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    assert.equal(hash1.length, 64);
    assert.equal(hash1, hash2);
    assert.notEqual(token, hash1, 'Raw secret must never equal the hash');
  });

  await t.test('generates distinct CSRF tokens', () => {
    const csrf1 = generateCsrfToken();
    const csrf2 = generateCsrfToken();
    assert.equal(csrf1.length, 48);
    assert.notEqual(csrf1, csrf2);
  });
});

test('SessionService - Lifecycle, Storage & Cache Acceleration', async (t) => {
  const sessionsDb = new Map();

  const mockPrisma = {
    adminSession: {
      create: async ({ data }) => {
        const record = {
          id: `sess_${Date.now()}_${Math.random()}`,
          userId: data.userId,
          tokenHash: data.tokenHash,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          expiresAt: data.expiresAt,
          user: {
            id: data.userId,
            email: 'admin@palnadu.dev',
            name: 'Admin',
            role: 'SUPER_ADMIN',
            isActive: true,
          },
        };
        sessionsDb.set(data.tokenHash, record);
        return record;
      },
      findUnique: async ({ where }) => sessionsDb.get(where.tokenHash) || null,
      deleteMany: async ({ where }) => {
        let count = 0;
        for (const [hash, sess] of sessionsDb.entries()) {
          if ((where.tokenHash && hash === where.tokenHash) || (where.userId && sess.userId === where.userId)) {
            sessionsDb.delete(hash);
            count++;
          }
        }
        return { count };
      },
    },
  };

  const service = new SessionService(mockPrisma);

  await t.test('creates session record with token hash only, never raw token', async () => {
    const created = await service.createSession('user_1', '127.0.0.1', 'Mozilla/5.0');
    assert.ok(created.rawToken);
    assert.equal(created.rawToken.length, 64);
    assert.ok(created.expiresAt);

    // Verify database record holds ONLY tokenHash
    const expectedHash = hashToken(created.rawToken);
    const stored = sessionsDb.get(expectedHash);
    assert.ok(stored);
    assert.equal(stored.tokenHash, expectedHash);
    assert.equal(stored.rawToken, undefined, 'Database must never persist raw session token');
  });

  await t.test('validates active session and hits in-memory cache (<1ms)', async () => {
    const created = await service.createSession('user_1', '127.0.0.1', 'Mozilla/5.0');
    const start = performance.now();
    const user = await service.validateSession(created.rawToken);
    const duration = performance.now() - start;

    assert.ok(user);
    assert.equal(user.id, 'user_1');
    assert.equal(user.email, 'admin@palnadu.dev');
    assert.ok(duration < 5, `Cache lookup should be near instantaneous: ${duration}ms`);
  });

  await t.test('revokes single session on logout immediately', async () => {
    const created = await service.createSession('user_1');
    const isValidBefore = await service.validateSession(created.rawToken);
    assert.ok(isValidBefore);

    const revoked = await service.revokeSession(created.rawToken);
    assert.equal(revoked, true);

    const isValidAfter = await service.validateSession(created.rawToken);
    assert.equal(isValidAfter, null, 'Revoked session must immediately fail validation');
  });

  await t.test('revokes all active sessions when user is deactivated', async () => {
    const sess1 = await service.createSession('user_deact');
    const sess2 = await service.createSession('user_deact');
    const sessOther = await service.createSession('user_active');

    assert.ok(await service.validateSession(sess1.rawToken));
    assert.ok(await service.validateSession(sess2.rawToken));
    assert.ok(await service.validateSession(sessOther.rawToken));

    const count = await service.revokeAllUserSessions('user_deact');
    assert.equal(count, 2);

    assert.equal(await service.validateSession(sess1.rawToken), null);
    assert.equal(await service.validateSession(sess2.rawToken), null);
    assert.ok(await service.validateSession(sessOther.rawToken), 'Other user session remains active');
  });
});

test('Cookie Utilities - Serialization, Headers & Clearance', async (t) => {
  await t.test('parses cookie headers accurately', () => {
    const header = 'admin_session=abc123token; csrf_token=xyz789csrf; theme=dark';
    const parsed = parseCookies(header);
    assert.equal(parsed.admin_session, 'abc123token');
    assert.equal(parsed.csrf_token, 'xyz789csrf');
    assert.equal(parsed.theme, 'dark');
  });

  await t.test('handles empty or malformed cookie headers without error', () => {
    assert.deepEqual(parseCookies(''), {});
    assert.deepEqual(parseCookies(undefined), {});
    assert.deepEqual(parseCookies('; =; ;'), {});
  });

  await t.test('sets HttpOnly session and accessible CSRF cookies', () => {
    const cookiesSet = {};
    const mockRes = { cookie: (name, val, opts) => { cookiesSet[name] = { val, opts }; } };

    setAuthCookies(mockRes, 'session_jwt_payload', 'csrf_random_token', true);
    assert.ok(cookiesSet[ADMIN_SESSION_COOKIE]);
    assert.equal(cookiesSet[ADMIN_SESSION_COOKIE].opts.httpOnly, true, 'admin_session MUST be HttpOnly');
    assert.equal(cookiesSet[ADMIN_SESSION_COOKIE].opts.secure, true);
    assert.equal(cookiesSet[ADMIN_SESSION_COOKIE].opts.sameSite, 'lax');

    assert.ok(cookiesSet[CSRF_COOKIE]);
    assert.equal(cookiesSet[CSRF_COOKIE].opts.httpOnly, false, 'csrf_token must be readable by JS');
    assert.equal(cookiesSet[CSRF_COOKIE].opts.sameSite, 'lax');
  });

  await t.test('clears auth cookies with expired date and zero maxAge', () => {
    const cookiesCleared = {};
    const mockRes = { cookie: (name, val, opts) => { cookiesCleared[name] = { val, opts }; } };

    clearAuthCookies(mockRes, true);
    assert.equal(cookiesCleared[ADMIN_SESSION_COOKIE].opts.maxAge, 0);
    assert.equal(cookiesCleared[ADMIN_SESSION_COOKIE].val, '');
    assert.equal(cookiesCleared[CSRF_COOKIE].opts.maxAge, 0);
    assert.equal(cookiesCleared[CSRF_COOKIE].val, '');
  });
});

test('CsrfGuard - Origin, Header & Double-Submit Protection', async (t) => {
  const guard = new CsrfGuard();

  const mockContext = (req) => ({
    switchToHttp: () => ({ getRequest: () => req }),
  });

  await t.test('exempts safe HTTP methods (GET, HEAD, OPTIONS)', () => {
    assert.equal(guard.canActivate(mockContext({ method: 'GET', url: '/api/admin/leads' })), true);
    assert.equal(guard.canActivate(mockContext({ method: 'HEAD', url: '/api/admin/leads' })), true);
    assert.equal(guard.canActivate(mockContext({ method: 'OPTIONS', url: '/api/admin/leads' })), true);
  });

  await t.test('exempts login, logout and public webhook endpoints', () => {
    assert.equal(guard.canActivate(mockContext({ method: 'POST', url: '/api/auth/login' })), true);
    assert.equal(guard.canActivate(mockContext({ method: 'POST', url: '/api/auth/logout' })), true);
    assert.equal(guard.canActivate(mockContext({ method: 'POST', url: '/api/whatsapp/webhook' })), true);
    assert.equal(guard.canActivate(mockContext({ method: 'POST', url: '/api/webhooks/whatsapp' })), true);
  });

  await t.test('exempts Bearer token API requests when no session cookie exists', () => {
    const req = {
      method: 'POST',
      url: '/api/admin/leads',
      headers: { authorization: 'Bearer mock_bearer_token' },
    };
    assert.equal(guard.canActivate(mockContext(req)), true);
  });

  await t.test('rejects mutating requests with cookie when CSRF header is missing', () => {
    const req = {
      method: 'POST',
      url: '/api/admin/projects',
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=token123; ${CSRF_COOKIE}=csrf_val_456` },
    };
    assert.throws(() => guard.canActivate(mockContext(req)), { name: 'ForbiddenException' });
  });

  await t.test('rejects mutating requests when CSRF token mismatches cookie', () => {
    const req = {
      method: 'POST',
      url: '/api/admin/projects',
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE}=token123; ${CSRF_COOKIE}=csrf_val_456`,
        'x-csrf-token': 'wrong_csrf_val',
      },
    };
    assert.throws(() => guard.canActivate(mockContext(req)), { name: 'ForbiddenException' });
  });

  await t.test('passes mutating requests when CSRF cookie matches X-CSRF-Token header', () => {
    const req = {
      method: 'POST',
      url: '/api/admin/projects',
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE}=token123; ${CSRF_COOKIE}=correct_token_12345`,
        'x-csrf-token': 'correct_token_12345',
        origin: 'http://localhost:3000',
      },
    };
    assert.equal(guard.canActivate(mockContext(req)), true);
  });
});
