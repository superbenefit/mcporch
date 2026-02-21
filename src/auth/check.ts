import type { AccessTier, AuthContext } from './types.js';
import { TIER_LEVEL } from './types.js';

export type AccessResult =
  | { allowed: true; authContext: AuthContext }
  | { allowed: false; requiredTier: AccessTier; currentTier: AccessTier };

/**
 * Check whether an auth context meets the required tier.
 *
 * Tools declare their required tier. This function enforces it.
 * The tool never needs to know how tiers are resolved.
 */
export function checkTierAccess(
  requiredTier: AccessTier,
  authContext: AuthContext
): AccessResult {
  if (TIER_LEVEL[authContext.tier] >= TIER_LEVEL[requiredTier]) {
    return { allowed: true, authContext };
  }
  return { allowed: false, requiredTier, currentTier: authContext.tier };
}
