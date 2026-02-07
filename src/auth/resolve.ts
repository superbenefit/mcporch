import type { AuthContext, Identity } from './types.js';
// Phase 2: import { getMcpAuthContext } from 'agents/mcp';

/**
 * Resolve access context from the current request.
 *
 * Phase 1: Always returns { tier: 'open', identity: null }
 * Phase 2: Extracts identity from getMcpAuthContext() (populated by
 *          Access JWT injection via createMcpHandler's authContext option),
 *          returns 'public' after sybil/agreement checks
 * Phase 3: Checks Hats/tokens/org membership, returns 'members' if authorized
 *
 * This function is the ONLY place tier resolution logic lives.
 * Tools never resolve tiers themselves.
 */
export async function resolveAuthContext(_env: Env): Promise<AuthContext> {
  // --- Phase 2: Authentication ---
  // const mcpAuth = getMcpAuthContext();
  // if (!mcpAuth?.props?.sub) {
  //   return { identity: null, tier: 'open', address: null, roles: null };
  // }
  //
  // const identity: Identity = {
  //   userId: mcpAuth.props.sub as string,
  //   name: (mcpAuth.props.name as string) ?? null,
  //   email: (mcpAuth.props.email as string) ?? null,
  //   provider: (mcpAuth.props.provider as string) ?? 'unknown',
  // };
  //
  // // TODO: Sybil check (Human Passport, threshold 25)
  // // TODO: Community agreement acceptance check
  //
  // --- Phase 3: Authorization ---
  // const address = await _env.IDENTITY_MAP.get(identity.userId);
  // if (address) {
  //   const roles = await checkHatsRoles(address as `0x${string}`, _env);
  //   if (roles.isMember || roles.isContributor) {
  //     return { identity, tier: 'members', address, roles };
  //   }
  // }
  //
  // // Fallback: check GitHub org membership
  // if (identity.provider === 'github') {
  //   const isSBMember = await checkGitHubOrgMembership(identity.userId, _env);
  //   if (isSBMember) {
  //     return { identity, tier: 'members', address: null, roles: null };
  //   }
  // }
  //
  // return { identity, tier: 'public', address: null, roles: null };

  // Phase 1: Open tier only — no authentication
  return { identity: null, tier: 'open', address: null, roles: null };
}
