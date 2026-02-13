import type { AccessTier, AuthContext } from './auth/types.js';

/**
 * Create a minimal AuthContext for testing.
 * Phase 1: Always anonymous with the specified tier.
 */
export function makeAuthContext(tier: AccessTier): AuthContext {
  return { identity: null, tier, address: null, roles: null };
}

/**
 * Create a mock Env object for testing.
 * Provides minimal stubs for all bindings; override as needed.
 */
export function makeMockEnv(overrides?: Partial<Env>): Env {
  return {
    RATE_LIMITER: {
      limit: async () => ({ success: true }),
    } as unknown as RateLimit,
    ...overrides,
  } as Env;
}
