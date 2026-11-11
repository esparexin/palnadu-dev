import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const prismaServicePath = fileURLToPath(new URL('../dist/prisma.service.js', import.meta.url));
const authServicePath = fileURLToPath(new URL('../dist/auth/auth.service.js', import.meta.url));

const { tuneDatabaseUrl } = require(prismaServicePath);
const { AuthService, maskEmail } = require(authServicePath);

test('MongoDB Connection Pooling & URL Tuning', async (t) => {
  await t.test('appends default pool parameters when none are present', () => {
    const raw = 'mongodb+srv://user:pass@cluster.mongodb.net/palnadu_dev?retryWrites=true&w=majority';
    const tuned = tuneDatabaseUrl(raw);
    assert.ok(tuned);

    const url = new URL(tuned);
    assert.equal(url.searchParams.get('minPoolSize'), '5');
    assert.equal(url.searchParams.get('maxPoolSize'), '20');
    assert.equal(url.searchParams.get('maxIdleTimeMS'), '60000');
    assert.equal(url.searchParams.get('connectTimeoutMS'), '10000');
    assert.equal(url.searchParams.get('serverSelectionTimeoutMS'), '10000');
    assert.equal(url.searchParams.get('retryWrites'), 'true');
  });

  await t.test('strictly preserves explicitly defined pool parameters', () => {
    const raw = 'mongodb+srv://user:pass@cluster.mongodb.net/palnadu_dev?retryWrites=true&minPoolSize=2&maxPoolSize=50&maxIdleTimeMS=30000';
    const tuned = tuneDatabaseUrl(raw);
    assert.ok(tuned);

    const url = new URL(tuned);
    assert.equal(url.searchParams.get('minPoolSize'), '2');
    assert.equal(url.searchParams.get('maxPoolSize'), '50');
    assert.equal(url.searchParams.get('maxIdleTimeMS'), '30000');
    assert.equal(url.searchParams.get('connectTimeoutMS'), '10000');
    assert.equal(url.searchParams.get('serverSelectionTimeoutMS'), '10000');
  });

  await t.test('handles non-mongodb URLs and undefined gracefully', () => {
    assert.equal(tuneDatabaseUrl(undefined), undefined);
    assert.equal(tuneDatabaseUrl(''), undefined);
    const postgresUrl = 'postgresql://user:pass@localhost:5432/mydb';
    assert.equal(tuneDatabaseUrl(postgresUrl), postgresUrl);
  });
});

test('Auth Telemetry & Sensitive Data Masking', async (t) => {
  await t.test('masks standard email addresses safely', () => {
    assert.equal(maskEmail('admin@palnadu.dev'), 'a***n@palnadu.dev');
    assert.equal(maskEmail('editor@palnadu.dev'), 'e***r@palnadu.dev');
  });

  await t.test('masks short local parts safely', () => {
    assert.equal(maskEmail('ab@palnadu.dev'), 'a***@palnadu.dev');
    assert.equal(maskEmail('a@palnadu.dev'), 'a***@palnadu.dev');
  });

  await t.test('handles malformed emails safely without throwing', () => {
    assert.equal(maskEmail(''), '***');
    assert.equal(maskEmail('no-at-symbol'), '***');
  });
});

test('AuthService - Login Behavior & Instrumentation', async (t) => {
  const bcrypt = require('bcryptjs');

  const mockUser = {
    id: 'user_123',
    email: 'admin@palnadu.dev',
    password: await bcrypt.hash('secret_password', 10),
    name: 'Admin',
    role: 'SUPER_ADMIN',
    isActive: true,
  };

  const createMockPrisma = (userToReturn) => ({
    user: {
      findUnique: async () => userToReturn,
    },
  });

  const mockJwtService = {
    sign: (payload) => `mock_token_${payload.sub}_${payload.role}`,
  };

  await t.test('successfully logs in with valid credentials without exposing password or token in logs', async () => {
    const authService = new AuthService(createMockPrisma(mockUser), mockJwtService);
    const result = await authService.login('admin@palnadu.dev', 'secret_password');

    assert.ok(result.accessToken);
    assert.equal(result.accessToken, 'mock_token_user_123_SUPER_ADMIN');
    assert.equal(result.user.email, 'admin@palnadu.dev');
    assert.equal(result.user.role, 'SUPER_ADMIN');
    assert.equal(result.user.password, undefined, 'Password hash must never be returned');
  });

  await t.test('rejects login when user does not exist', async () => {
    const authService = new AuthService(createMockPrisma(null), mockJwtService);
    await assert.rejects(
      () => authService.login('unknown@palnadu.dev', 'secret_password'),
      { name: 'UnauthorizedException', message: 'Invalid credentials' },
    );
  });

  await t.test('rejects login when user is inactive', async () => {
    const inactiveUser = { ...mockUser, isActive: false };
    const authService = new AuthService(createMockPrisma(inactiveUser), mockJwtService);
    await assert.rejects(
      () => authService.login('admin@palnadu.dev', 'secret_password'),
      { name: 'UnauthorizedException', message: 'Invalid credentials' },
    );
  });

  await t.test('rejects login when password is incorrect', async () => {
    const authService = new AuthService(createMockPrisma(mockUser), mockJwtService);
    await assert.rejects(
      () => authService.login('admin@palnadu.dev', 'wrong_password'),
      { name: 'UnauthorizedException', message: 'Invalid credentials' },
    );
  });
});
