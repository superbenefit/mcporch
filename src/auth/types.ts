/**
 * Porch access control framework types.
 *
 * Phase 1: Only 'open' tier active — no authentication.
 * Phase 2: + 'public' tier via Cloudflare Access for SaaS.
 * Phase 3: + 'members' tier via Hats Protocol / token gate.
 */

import { z } from '@hono/zod-openapi';

// ---------------------------------------------------------------------------
// Access Tiers
// ---------------------------------------------------------------------------

/**
 * Access tiers ordered by privilege level.
 * Each tier includes all capabilities of tiers below it.
 */
export type AccessTier = 'open' | 'public' | 'members';

export const AccessTierSchema = z
  .enum(['open', 'public', 'members'])
  .openapi('AccessTier');

export const TIER_LEVEL: Record<AccessTier, number> = {
  open: 0,
  public: 1,
  members: 2,
};

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/**
 * Authenticated identity. Null for anonymous (Open tier) requests.
 * Populated via Access JWT injection into createMcpHandler's authContext in Phase 2+.
 */
export interface Identity {
  /** Unique user ID from identity provider */
  userId: string;
  /** Display name */
  name: string | null;
  /** Email address */
  email: string | null;
  /** Identity provider identifier (e.g., "github", "siwe") */
  provider: string;
}

export const IdentitySchema = z
  .object({
    userId: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    provider: z.string(),
  })
  .openapi('Identity');

// ---------------------------------------------------------------------------
// Hats Protocol Roles
// ---------------------------------------------------------------------------

/**
 * Hats Protocol role information.
 * Defined now, populated when authorization module connects (Phase 3).
 */
export interface HatsRole {
  /** Hat IDs the user wears */
  hats: bigint[];
  /** Whether the user is a Community Member (path [3,5]) */
  isMember: boolean;
  /** Whether the user is a Contributor (path [3,1]) */
  isContributor: boolean;
}

// ---------------------------------------------------------------------------
// Auth Context
// ---------------------------------------------------------------------------

/**
 * Resolved access context for a request.
 * Every request gets one of these — even anonymous ones.
 */
export interface AuthContext {
  /** Null for anonymous (Open tier) requests */
  identity: Identity | null;
  /** Resolved access tier */
  tier: AccessTier;
  /** Ethereum address — null until identity-address mapping exists */
  address: `0x${string}` | null;
  /** Hats Protocol roles — null until authorization module is connected */
  roles: HatsRole | null;
}

export const AuthContextSchema = z
  .object({
    identity: IdentitySchema.nullable(),
    tier: AccessTierSchema,
    address: z.string().nullable(),
    roles: z.unknown().nullable(), // HatsRole serialized as unknown for OpenAPI (bigint[] not representable)
  })
  .openapi('AuthContext');
