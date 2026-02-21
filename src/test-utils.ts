import type { AccessTier, AuthContext } from './auth/types.js';
import type { PorchEnv } from './auth/resolve.js';

/**
 * Create a minimal AuthContext for testing.
 * Phase 1: Always anonymous with the specified tier.
 */
export function makeAuthContext(tier: AccessTier): AuthContext {
  return { identity: null, tier, address: null, roles: null };
}

/**
 * Create a mock Env object for testing.
 * Provides minimal stubs for all PorchEnv bindings; override as needed.
 * Generic so consumers can pass their own extended Env type.
 */
export function makeMockEnv<E extends PorchEnv>(overrides?: Partial<E>): E {
  return {
    RATE_LIMITER: {
      limit: async () => ({ success: true }),
    } as unknown as RateLimit,
    ...overrides,
  } as E;
}
