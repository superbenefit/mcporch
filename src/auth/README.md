# Auth Module

## Overview

This module provides the access control framework for MCPorch. It defines three access tiers and provides functions for resolving and checking access.

## Access Tiers

| Tier | Level | Description |
|------|-------|-------------|
| open | 0 | No auth required. Public access. |
| public | 1 | Authentication required. Sybil resistance. |
| members | 2 | Auth + authorization. Role/token check. |

## Files

- `types.ts` - Type definitions (AccessTier, AuthContext, Identity, HatsRole)
- `resolve.ts` - `resolveAuthContext(env)` - determines caller's access tier
- `check.ts` - `checkTierAccess(tier, ctx)` - enforces tier requirements

## Usage

```typescript
import { resolveAuthContext } from './auth/resolve.js';
import { checkTierAccess } from './auth/check.js';

// In every tool handler:
const authContext = await resolveAuthContext(env);
const access = checkTierAccess('open', authContext);
if (!access.allowed) {
  return { content: [{ type: 'text', text: `Requires ${access.requiredTier} access.` }] };
}
```

## Current Status

Phase 1 - `resolveAuthContext()` always returns `{ tier: 'open' }`. Phase 2/3 logic is scaffolded in comments.

## Phase Roadmap

- **Phase 2**: Authentication via Cloudflare Access, public tier active
- **Phase 3**: Authorization via Hats Protocol, members tier active
