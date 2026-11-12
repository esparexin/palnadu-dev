import { maskApiKey } from '../dist/automation/gemini-verification/gemini-verification.util.js';

export function createMockPrisma() {
  const store = new Map();
  return {
    store,
    siteSetting: {
      async findUnique({ where: { key } }) {
        return store.get(key) || null;
      },
      async upsert({ where: { key }, update, create }) {
        const existing = store.get(key);
        const record = {
          key,
          value: existing ? update.value : create.value,
          updatedBy: existing ? update.updatedBy : create.updatedBy,
          description: existing ? update.description : create.description,
          updatedAt: new Date(),
        };
        store.set(key, record);
        return record;
      },
    },
  };
}

export function createMockVerificationService(behavior = 'valid') {
  return {
    async verifyKey(apiKey) {
      if (behavior === 'invalid') {
        return {
          isValid: false,
          isUsableForGeneration: false,
          verificationCode: 'INVALID_API_KEY',
          verificationStatus: 'Invalid Key',
          authenticationStatus: 'INVALID_KEY',
          failureCategory: 'INVALID_API_KEY',
          isTemporary: false,
          fallbackUsed: false,
          activeUsableModel: null,
          maskedKey: maskApiKey(apiKey),
          project: { id: null, name: null, status: 'Unavailable' },
          account: { email: null, status: 'Account Identity Unavailable' },
          models: { tested: [], supportedCount: 0 },
          quota: { status: 'Unknown' },
          permissions: { status: 'Denied' },
          verifiedAt: new Date().toISOString(),
          errorMessage: 'API_KEY_INVALID: Key not found',
        };
      }
      return {
        isValid: true,
        isUsableForGeneration: true,
        verificationCode: 'PARTIALLY_VERIFIED',
        verificationStatus: 'Partially Verified',
        authenticationStatus: 'AUTHENTICATED',
        isTemporary: false,
        fallbackUsed: false,
        activeUsableModel: 'gemini-3.8-flash',
        maskedKey: maskApiKey(apiKey),
        project: { id: 'gcp-project-4455', name: null, status: 'Inferred' },
        account: { email: null, status: 'Account Identity Unavailable' },
        models: {
          tested: [{ model: 'gemini-3.8-flash', accessible: true, latencyMs: 120, statusCode: 'VERIFIED', isTemporary: false }],
          supportedCount: 1,
        },
        quota: { status: 'Active' },
        permissions: { status: 'Granted' },
        verifiedAt: new Date().toISOString(),
      };
    },
  };
}

