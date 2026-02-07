/**
 * Access tiers ordered by privilege level.
 * Each tier includes all capabilities of tiers below it.
 */
export type AccessTier = 'open' | 'public' | 'members';

export const TIER_LEVEL: Record<AccessTier, number> = {
  open: 0,
  public: 1,
  members: 2,
};

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

/**
 * Hats Protocol role information.
 * Defined now, populated when authorization module connects.
 */
export interface HatsRole {
  /** Hat IDs the user wears */
  hats: bigint[];
  /** Whether the user is a Community Member (path [3,5]) */
  isMember: boolean;
  /** Whether the user is a Contributor (path [3,1]) */
  isContributor: boolean;
}
