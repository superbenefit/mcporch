# Specification: SuperBenefit MCPorch

**Component**: MCP Portal
**Status**: draft  
**Spec Version**: 0.19 (supersedes 0.18)

## Overview

MCPorch is the coordination hub for SuperBenefit's MCP server ecosystem. It provides shared access control, identity resolution, and Portal registration so that community-built MCP servers interoperate through a unified experience without each server reinventing auth, identity, or access control.

The porch defines three access tiers based on the economic properties of the resources being served, a composable identity and authorization model, and standardized conventions that reduce the learning curve for DAO members building new MCP servers.

The naming reflects the broader product surface:

- **`porch.superbenefit.dev`** — MCPorch infrastructure (this spec). Access control, shared framework, Portal.
- **`front.porch.superbenefit.dev`** — Public chat interface. Where anyone can sit down and use Open/Public tier tools.
- **`back.porch.superbenefit.dev`** — Members-only editor interface. Where SB members do internal work.

The framework is designed so that:

- Adding a new access tier requires no changes to existing servers or tools.
- Adding a new MCP server requires no changes to existing servers or the framework.
- A DAO member building a new server follows the same conventions as every other server, uses the same types, and gets auth, identity, and Portal registration for free.

### Phased Rollout

Phase 1 (now) ships Open tier: all tools across all servers are publicly accessible without authentication. Phase 2 (future) adds the Public tier via Cloudflare Access for SaaS, requiring authentication for rate-limited or personalized features. Phase 3 (future) adds the Members tier via Hats Protocol / token gating for excludable resources.

Each phase applies to the entire ecosystem, not individual servers. When Phase 2 ships, every registered MCP server gains authenticated identity in its tools without code changes — `resolveAuthContext()` starts returning `public` tier for authenticated requests, and tools that were already calling `checkTierAccess()` enforce the new tier automatically.

## Access Tiers

### Open

No authentication required. No authorization required.

Search, retrieval, content browsing, public knowledge exploration. Anyone with the server URL can use these tools.

**Access path**: Direct Worker URL or Portal (unauthenticated server registration).  
**Rate limiting**: IP-based or global throughput limits only.  
**Implementation**: Phase 1 (now).

### Public

Authentication required. No authorization required (beyond sybil resistance).

Personalized features, stateful interactions, higher rate limits, features that benefit from knowing who the user is.

Authentication accepts Ethereum wallet (SIWE) or GitHub. The canonical sign of community participation is a Community Member Hats Protocol NFT, but it is not required for this tier. Human Passport anti-sybil checking (threshold 25) is the primary gating mechanism.

**Access path**: Portal with Access for SaaS (OIDC), or direct URL with Access JWT injection.  
**Rate limiting**: Per-user, with higher limits than Open tier.  
**Community agreements**: Users accept SB community agreements as part of onboarding. Acceptance may be recorded onchain (Hats NFT) or stored in KV.  
**Implementation**: Phase 2 (future).

### Members

Authentication and authorization required.

Governance tools, internal knowledge, write operations, administrative functions, resource-intensive AI operations.

**Authorization sources** (checked in order):
1. Hats Protocol role check (Tree 30 on Optimism) — primary source of truth
2. ERC-1155 token gate — alternative onchain verification
3. SuperBenefit GitHub Organization membership — fallback for contributors who haven't onboarded onchain

**Access path**: Same as Public, with authorization layer resolving roles from identity.  
**Implementation**: Phase 3 (future).

### Tier Properties Summary

| Property | Open | Public | Members |
|----------|------|--------|---------|
| Economics | Non-excludable, non-rivalrous | Non-excludable, rivalrous | Excludable, rivalrous |
| Authentication | None | Required | Required |
| Authorization | None | Sybil resistance | Role/token check |
| Rate limiting | IP/global | Per-user | Per-user + role-based |
| Identity | Anonymous | Wallet or GitHub | Wallet or GitHub + roles |

## What the Porch Provides

The porch (`@superbenefit/porch`) is the single source of truth for everything an MCP server needs to participate in the SB ecosystem. A server that adopts porch conventions gets:

**Types** — `AccessTier`, `Identity`, `AuthContext`, `HatsRole`, `TIER_LEVEL`. These are the shared vocabulary. Every server uses the same types so tools, auth resolution, and tier checking are interoperable.

**Auth context resolution** — `resolveAuthContext(env)`. One function, one place. Determines the caller's access tier from the current request context. Servers never implement their own auth logic. When a new tier ships, this function changes once and every server benefits.

**Tier checking** — `checkTierAccess(requiredTier, authContext)`. Tools declare what tier they need and call this function. The tool never knows how tiers are resolved.

**Server factory pattern** — `createMcpServer(env)` instantiates a fresh `McpServer` per request with all tools registered. This pattern is required by the MCP SDK (≥1.26.0) for security. The porch standardizes how every server does it.

**Fetch handler pattern** — The route split between MCP (`/mcp`) and REST (`/api/v1/*`), with the `authContext` injection point for Phase 2. Every server's `index.ts` looks the same.

**Portal registration** — Every MCP server in the ecosystem registers in the MCPorch Portal. The Portal provides a single endpoint for clients, per-server auth requirements, tool visibility controls, and invocation logging. A server can also be accessed via its direct URL.

**Conventions** — Tool naming, error response format for tier violations, per-request instantiation, CORS configuration. These are standardized so servers are consistent for clients and predictable for developers.

## Architecture

### Multi-Server Ecosystem

```
MCP Client (Claude, Cursor, Code, etc.)
  │
  ├─── MCPorch Portal (single endpoint) ─────────────────┐
  │    discovery, logging, per-server auth                │
  │                                                       │
  └─── Direct URLs (per-server, open tools always work)   │
       │              │              │                     │
       ▼              ▼              ▼                     │
  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
  │Knowledge │  │Governance│  │  Value   │  ◄─────────────┘
  │ Server   │  │  Server  │  │  Flows   │
  └────┬─────┘  └────┬─────┘  └────┬─────┘
       │              │              │
       ▼              ▼              ▼
  ┌──────────────────────────────────────────┐
  │  Porch (shared coordination layer)       │
  │                                          │
  │  Types:    AccessTier, AuthContext, ...   │
  │  Auth:     resolveAuthContext(env)        │
  │  Check:    checkTierAccess(tier, ctx)     │
  │  Pattern:  createMcpServer(env)          │
  │  Pattern:  fetch handler route split     │
  └──────────────────────────────────────────┘
```

Every server is a standalone Cloudflare Worker. Each server has its own repo, its own `wrangler.jsonc`, its own deployment. The porch provides the shared conventions and code they all follow. The MCPorch Portal aggregates them into a unified experience for clients.

### Phase 1: Open Tier (Now)

```
MCP Client
  │
  │  Direct URL or MCPorch Portal (unauthenticated)
  ▼
┌─────────────────────────────────────────────────────┐
│  MCP Server (Cloudflare Worker)                     │
│                                                     │
│  /mcp       → MCP handler (no auth, open tools)    │
│  /api/v1/*  → REST API (no auth, open endpoints)   │
│                                                     │
│  resolveAuthContext() → { tier: 'open' }            │
│                                                     │
│  Tools check tier; all are 'open' in Phase 1        │
└─────────────────────────────────────────────────────┘
```

### Phase 2+: Authenticated Access

```
MCP Client
  │
  ├─── Direct URL (/mcp) ────────────────────────────────────┐
  │    (open tools always available)                         │
  │                                                          │
  └─── MCPorch Portal ──┐                                   │
                         ▼                                   │
  ┌──────────────────────────────────┐                       │
  │  MCPorch Portal                  │                       │
  │  (Zero Trust)                    │                       │
  │  - Server discovery              │                       │
  │  - Tool visibility controls      │                       │
  │  - Invocation logging            │                       │
  │  - Per-server auth requirements  │                       │
  └──────────┬───────────────────────┘                       │
             │                                               │
             ▼                                               │
  ┌──────────────────────────────────┐                       │
  │  Cloudflare Access for SaaS      │                       │
  │  (OIDC provider)                 │                       │
  │  - GitHub IdP                    │                       │
  │  - SIWE IdP (custom OIDC)       │                       │
  │  - Login, consent, tokens        │                       │
  └──────────┬───────────────────────┘                       │
             │  Authenticated request                        │
             │  (CF-Access-JWT-Assertion header)              │
             ▼                                               ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  MCP Server (Cloudflare Worker)                             │
  │                                                             │
  │  fetch handler: parse JWT → inject authContext              │
  │    ├── /mcp       → MCP handler (authContext populated)    │
  │    └── /api/v1/*  → REST API (Hono)                        │
  │                                                             │
  │  resolveAuthContext(env) → 'open' | 'public' | 'members'   │
  │                                                             │
  │  Tools call checkTierAccess(requiredTier, authContext)       │
  │  → same interface regardless of which tiers are active      │
  └─────────────────────────────────────────────────────────────┘
```

### Implementation Foundations

**Transport**: MCP servers use the **Streamable HTTP** transport via a single `/mcp` endpoint. SSE transport (`/sse`) is deprecated. The `createMcpHandler` function from `agents/mcp` implements this transport via `WorkerTransport`, built on web standards.

**Stateless handler**: Phase 1 uses `createMcpHandler(server)` — the lightweight stateless pattern for Workers with no Durable Object backing. This is the officially recommended pattern for MCP servers that don't need session persistence, elicitation, or sampling. Phase 2+ may upgrade to a stateful `Agent`-backed handler if chat/elicitation features require it; the tool interface is identical either way.

**Per-request McpServer instantiation**: MCP SDK ≥1.26.0 requires creating new `McpServer` instances per request. A security fix (CVE GHSA-qgp8-v765-qxx9) prevents reusing server instances across requests — doing so can leak response data between clients. The porch standardizes a factory function (`createMcpServer(env)`) that returns a fresh server with all tools registered on each invocation.

**CORS**: `createMcpHandler` accepts a `corsOptions` configuration for cross-origin access. Phase 1 configures permissive CORS since all tools are public. Phase 2+ tightens to specific allowed origins.

**Reference templates**: Phase 1 scaffolds from [`cloudflare/agents/examples/mcp-worker`](https://github.com/cloudflare/agents/tree/main/examples/mcp-worker) — the canonical stateless `createMcpHandler` template. Phase 2 references [`cloudflare/ai/demos/remote-mcp-cf-access`](https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-cf-access) for Access-for-SaaS integration and [`cloudflare/agents/examples/mcp-worker-authenticated`](https://github.com/cloudflare/agents/tree/main/examples/mcp-worker-authenticated) for the stateless `authContext` injection pattern.

**Minimum package versions**:

| Package | Minimum Version | Purpose |
|---------|-----------------|----------|
| `@modelcontextprotocol/sdk` | 1.26.0 | MCP server/tool SDK (must be ≥1.26.0 for per-request safety) |
| `agents` | 0.3.6 | `createMcpHandler`, `getMcpAuthContext` |
| `hono` | 4.x | REST API routing (optional — only if server has REST API) |
| `zod` | 4.x | MCP tool parameter schemas |
| `@cloudflare/workers-oauth-provider` | — | **Not needed for Phase 1.** Only required if Worker acts as OAuth server (Phase 2 evaluates). |

## Building an MCP Server for the Porch

This section is the developer-facing contract. A DAO member building a new MCP server follows these conventions to register it with MCPorch.

### Server Structure

Every MCP server in the ecosystem follows this layout:

```
my-server/
├── src/
│   ├── index.ts              # fetch handler (route split)
│   ├── mcp/
│   │   ├── server.ts         # createMcpServer(env) factory
│   │   └── tools/
│   │       ├── my-tool.ts    # one file per tool or tool group
│   │       └── index.ts      # registerTools(server, env)
│   ├── api/                  # optional — only if REST API needed
│   │   ├── app.ts            # Hono app
│   │   └── routes/v1/
│   └── auth/
│       ├── types.ts          # porch types (AccessTier, Identity, AuthContext, HatsRole)
│       ├── resolve.ts        # resolveAuthContext(env)
│       └── check.ts          # checkTierAccess(requiredTier, authContext)
├── wrangler.jsonc
├── package.json
└── tsconfig.json
```

The `auth/` directory contains the same code in every server. This is intentional duplication until the mechanism for sharing it is decided (see Decisions). The contract is that this code is identical across servers — if it needs to change, it changes everywhere at once.

### Fetch Handler

Every server's `index.ts` follows this pattern:

```typescript
import { createMcpHandler } from 'agents/mcp';
import { createMcpServer } from './mcp/server.js';
import { honoApp } from './api/app.js'; // optional

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // MCP requests → createMcpHandler (bypasses Hono)
    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
      // Phase 2: parse CF-Access-JWT-Assertion → build authContext here
      const server = createMcpServer(env);
      const handler = createMcpHandler(server, {
        route: '/mcp',
        // Phase 2: authContext: { props: claims },
      });
      return handler(request, env, ctx);
    }

    // REST API requests → Hono (if this server has a REST API)
    return honoApp.fetch(request, env, ctx);
  },
};
```

Servers that don't need a REST API can omit Hono and the `api/` directory entirely. The MCP handler is the only required surface.

### Server Factory

Every server creates `McpServer` instances per-request via a factory function:

```typescript
// src/mcp/server.ts

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools/index.js';

export function createMcpServer(env: Env): McpServer {
  const server = new McpServer({ name: 'My Server', version: '1.0.0' });
  registerTools(server, env);
  return server;
}
```

Per-request instantiation is a security requirement (MCP SDK ≥1.26.0, CVE GHSA-qgp8-v765-qxx9). Sharing `McpServer` instances across requests leaks response data between clients.

### Tool Pattern

Every tool calls `resolveAuthContext()` + `checkTierAccess()`. No exceptions.

```typescript
// src/mcp/tools/my-tool.ts

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { resolveAuthContext } from '../../auth/resolve.js';
import { checkTierAccess } from '../../auth/check.js';

export function registerMyTool(server: McpServer, env: Env) {
  server.tool(
    'my_tool',
    'Description of what this tool does',
    { param: z.string() },
    async ({ param }) => {
      const authContext = await resolveAuthContext(env);
      const access = checkTierAccess('open', authContext);
      if (!access.allowed) {
        return {
          content: [{ type: 'text', text: `Requires ${access.requiredTier} access. Current: ${access.currentTier}.` }],
        };
      }
      // ... tool logic
    }
  );
}
```

The tier requirement (`'open'`, `'public'`, or `'members'`) is declared per-tool. In Phase 1, all tools use `'open'`. When a tool should require authentication, change the string — nothing else.

### Tool Registration

Tools are registered through a barrel file:

```typescript
// src/mcp/tools/index.ts

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMyTool } from './my-tool.js';
import { registerAnotherTool } from './another-tool.js';

export function registerTools(server: McpServer, env: Env) {
  registerMyTool(server, env);
  registerAnotherTool(server, env);
}
```

### Portal Registration

Every MCP server in the ecosystem registers in the MCPorch Portal. The Portal provides a single endpoint for clients to discover all SB tools, with per-server auth requirements and invocation logging. Servers are also accessible via their direct URLs.

### Scaffold

New servers scaffold from [`cloudflare/agents/examples/mcp-worker`](https://github.com/cloudflare/agents/tree/main/examples/mcp-worker) — the canonical stateless `createMcpHandler` template. Then add the `auth/` directory with the standard porch types, `resolveAuthContext()`, and `checkTierAccess()`.

## Framework Interface

This is the core contract. It ships now (Phase 1) with Open tier active, and is designed so Phases 2 and 3 add capability without modifying this interface.

### Types

```typescript
// src/auth/types.ts

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
```

### Auth Context Resolution

```typescript
// src/auth/resolve.ts

import { getMcpAuthContext } from 'agents/mcp';

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
export async function resolveAuthContext(env: Env): Promise<AuthContext> {
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
  // const address = await env.IDENTITY_MAP.get(identity.userId);
  // if (address) {
  //   const roles = await checkHatsRoles(address as `0x${string}`, env);
  //   if (roles.isMember || roles.isContributor) {
  //     return { identity, tier: 'members', address, roles };
  //   }
  // }
  //
  // // Fallback: check GitHub org membership
  // if (identity.provider === 'github') {
  //   const isSBMember = await checkGitHubOrgMembership(identity.userId, env);
  //   if (isSBMember) {
  //     return { identity, tier: 'members', address: null, roles: null };
  //   }
  // }
  //
  // return { identity, tier: 'public', address: null, roles: null };

  // Phase 1: Open tier only — no authentication
  return { identity: null, tier: 'open', address: null, roles: null };
}
```

### Tier Checking

```typescript
// src/auth/check.ts

/**
 * Check whether an auth context meets the required tier.
 *
 * Tools declare their required tier. This function enforces it.
 * The tool never needs to know how tiers are resolved.
 */
export function checkTierAccess(
  requiredTier: AccessTier,
  authContext: AuthContext
): { allowed: true; authContext: AuthContext } | { allowed: false; requiredTier: AccessTier; currentTier: AccessTier } {
  if (TIER_LEVEL[authContext.tier] >= TIER_LEVEL[requiredTier]) {
    return { allowed: true, authContext };
  }
  return { allowed: false, requiredTier, currentTier: authContext.tier };
}
```

## Knowledge Server: Phase 1 Implementation

The knowledge server is the first MCP server built on the porch framework. This section documents the specific implementation work for Phase 1.

### Starting Point

Scaffold from [`cloudflare/agents/examples/mcp-worker`](https://github.com/cloudflare/agents/tree/main/examples/mcp-worker). Add the standard porch `auth/` directory.

### Server Structure

```
knowledge-server/
├── src/
│   ├── index.ts              # fetch handler (standard porch route split)
│   ├── mcp/
│   │   ├── server.ts         # createMcpServer(env) factory
│   │   └── tools/
│   │       ├── search.ts
│   │       ├── retrieve.ts
│   │       └── index.ts      # registerTools(server, env)
│   ├── api/
│   │   ├── app.ts            # Hono app
│   │   └── routes/v1/
│   └── auth/
│       ├── types.ts          # standard porch types
│       ├── resolve.ts        # standard resolveAuthContext()
│       └── check.ts          # standard checkTierAccess()
├── wrangler.jsonc
├── package.json
└── tsconfig.json
```

### What Ships

- All MCP tools accessible without authentication at `open` tier
- REST API accessible without authentication (unchanged)
- Standard porch conventions and structure
- `createMcpServer(env)` factory function creating per-request `McpServer` instances
- `resolveAuthContext()` implemented, always returns `open`
- `checkTierAccess()` implemented, used by all tools
- All tools annotated with their tier requirement (all `open` for now)
- Framework types (`AccessTier`, `Identity`, `AuthContext`, `HatsRole`) in `src/auth/types.ts`
- OAuth machinery removed from Worker

### What Gets Removed

| File | Reason |
|------|--------|
| `src/github-handler.ts` | No authentication in Phase 1 |
| `src/workers-oauth-utils.ts` | No authentication in Phase 1 |
| `src/utils.ts` | Upstream auth helpers not needed |
| `OAuthProvider` wrapping in `src/index.ts` | No authentication in Phase 1 |

### Removed Bindings

| Binding | Reason |
|---------|--------|
| `OAUTH_KV` | No OAuth flow |
| `NONCE_KV` | No SIWE flow |
| `COOKIE_ENCRYPTION_KEY` | No session management |

### What Stays

| File/Binding | Status |
|--------------|--------|
| `src/auth/types.ts` | Updated — standard porch tier types replace old ones |
| `src/auth/resolve.ts` | New — standard `resolveAuthContext()` with Phase 2/3 commented |
| `src/auth/check.ts` | New — standard `checkTierAccess()` |
| `src/mcp/*` | Unchanged (tools updated to use `checkTierAccess()`) |
| `src/api/*` | Unchanged |

### Modified

| File | Change |
|------|--------|
| `src/index.ts` | Remove `OAuthProvider` wrapper. Standard porch fetch handler: route split, per-request `McpServer` via `createMcpServer(env)`. |
| `src/mcp/server.ts` | New — `createMcpServer(env)` factory. |
| `src/mcp/tools/*.ts` | Each tool calls `resolveAuthContext()` + `checkTierAccess()`. All tools require `open` tier for now. |
| `src/env.d.ts` | Remove OAuth bindings. Add `CF_ACCESS_AUD` as optional (unused until Phase 2). |
| `wrangler.jsonc` | Remove `OAUTH_KV`, `NONCE_KV` bindings. |

### Acceptance Criteria

- [ ] MCP client connects to Worker URL without authentication (Streamable HTTP at `/mcp`)
- [ ] All MCP tools respond successfully
- [ ] REST API continues to work without authentication
- [ ] OAuth code and bindings fully removed
- [ ] `McpServer` created per-request via `createMcpServer(env)` factory (not shared globally)
- [ ] Every tool uses `resolveAuthContext()` + `checkTierAccess('open', ...)`
- [ ] `resolveAuthContext()` contains commented Phase 2/3 logic as documented architecture
- [ ] Framework types compile and are importable
- [ ] `@modelcontextprotocol/sdk` ≥1.26.0 (per-request safety)
- [ ] Server structure matches the standard porch layout

### Local Development

`wrangler dev` works without any special configuration. No Access, no Portal, no OAuth — the server just responds to requests. Test with MCP Inspector at `http://localhost:8788/mcp`.

## Phase 2 Design (Future — Public Tier)

Phase 2 applies to all MCP servers in the ecosystem simultaneously. The changes are to the shared `auth/` code and the infrastructure layer.

### Reference Implementation

The [`cloudflare/ai/demos/remote-mcp-cf-access`](https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-cf-access) template implements the exact Access-for-SaaS + MCP pattern described here. That demo uses `OAuthProvider` + `McpAgent` (DO-backed); the porch intentionally uses the lighter `createMcpHandler` + manual JWT parse pattern instead, since Access handles the full OAuth flow externally and the Worker doesn't need to act as an OAuth server.

### Infrastructure

1. **Cloudflare Access for SaaS**: Register MCP servers as OIDC SaaS applications. Access becomes the OAuth provider for MCP clients. GitHub and SIWE configured as identity providers.

2. **MCPorch Portal**: Portals are production infrastructure (shipped Aug 2025) that provide single-endpoint aggregation of multiple MCP servers, per-server auth requirements (mix of auth and authless), tool visibility controls per user, and invocation logging. Portals support unauthenticated server registration, so servers are registered in Phase 1 for early logging without adding auth complexity.

3. **Access JWT injection**: Cloudflare Access handles the full OAuth flow externally. Workers receive requests with a `CF-Access-JWT-Assertion` header containing signed claims. The standard porch fetch handler validates the JWT against `CF_ACCESS_AUD`, extracts identity claims, and passes them to `createMcpHandler` via the `authContext` option. This populates `getMcpAuthContext()` inside tools without any `OAuthProvider` dependency. For local dev, mock the auth context directly or use Access service tokens.

### Server Changes

Every MCP server's fetch handler evolves identically:

```typescript
// src/index.ts — Phase 2 fetch handler (illustrative)

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Parse CF Access JWT if present (Phase 2)
    const claims = await resolveAuthFromHeaders(request, env);

    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
      const server = createMcpServer(env);
      const handler = createMcpHandler(server, {
        route: '/mcp',
        authContext: claims ? { props: claims } : undefined,
      });
      return handler(request, env, ctx);
    }

    return honoApp.fetch(request, env, ctx);
  },
};
```

No tool code changes — `resolveAuthContext()` picks up the identity from `getMcpAuthContext()` and the existing `checkTierAccess()` calls enforce the new tier requirements. Individual tools that should require authentication change their tier string from `'open'` to `'public'`.

### New Bindings (per server)

| Binding | Purpose |
|---------|---------|
| `CF_ACCESS_AUD` | Access application audience tag for JWT validation |

### New Bindings (ecosystem-wide)

| Binding | Purpose |
|---------|---------|
| `SYBIL_CACHE` KV | Cache Human Passport scores |
| `AGREEMENTS` KV | Track community agreement acceptance |

### Identity Provider: SIWE

SIWE (Sign-In with Ethereum) becomes an identity provider in Access by deploying a small Worker that implements the OIDC provider interface, backed by SIWE authentication. This Worker:

- Exposes standard OIDC endpoints (`.well-known/openid-configuration`, `/authorize`, `/token`, `/jwks`)
- Authenticates users via SIWE message signing
- Issues OIDC ID tokens with Ethereum address as `sub` claim
- Registers as a custom OIDC IdP in Cloudflare Access

This gives Access two IdPs: GitHub (for web2 identity) and SIWE (for web3 identity). Users choose at login. Both produce the same `Identity` shape in every MCP server.

## Phase 3 Design (Future — Members Tier)

### Authorization Module

Uncomment Phase 3 block in `resolveAuthContext()`. This change propagates to every MCP server. Add:

1. **Identity-to-address mapping** (`IDENTITY_MAP` KV): Maps GitHub userIds to Ethereum addresses. Populated when users link their GitHub account to their wallet (self-service or admin).

2. **Hats Protocol role check**: Query Hats subgraph or contract on Optimism. Check Tree 30, paths `[3,1]` (contributor) and `[3,5]` (member). Cache results in `ROLE_CACHE` KV.

3. **ERC-1155 token gate**: Alternative to Hats for membership verification. Check token balance on Optimism.

4. **GitHub org fallback**: For contributors who haven't onboarded onchain, check SuperBenefit GitHub organization membership via GitHub API.

### New Bindings

| Binding | Purpose |
|---------|---------|
| `IDENTITY_MAP` KV | GitHub userId → Ethereum address |
| `HATS_SUBGRAPH_URL` | Hats Protocol subgraph endpoint |

### Authorization Resolution Order

```
identity present?
  ├─ no  → tier: 'open'
  └─ yes → sybil check passed?
      ├─ no  → tier: 'open' (reject auth, treat as anonymous)
      └─ yes → has linked wallet?
          ├─ yes → check Hats roles
          │   ├─ has member/contributor hat → tier: 'members'
          │   └─ no hat → check ERC-1155
          │       ├─ has token → tier: 'members'
          │       └─ no token → tier: 'public'
          └─ no  → check GitHub org (if provider is github)
              ├─ is org member → tier: 'members'
              └─ not org member → tier: 'public'
```

## Edge Cases

| Case | Handling |
|------|----------|
| Anonymous request to Open tool | Works. `resolveAuthContext()` returns `open` tier. |
| Anonymous request to Public/Members tool | Returns error with required tier. Tool logic never executes. |
| Authenticated user, no wallet linked | Gets `public` tier. Can use Public tools, not Members tools. |
| Authenticated user, wallet linked, no Hats | Gets `public` tier (unless GitHub org member fallback). |
| GitHub org member without wallet | Gets `members` tier via fallback. |
| Expired Access JWT | MCP client receives 401, re-authenticates through Access. Open tools still work via direct URL. |
| Portal down | Direct URL still serves Open tier tools. Authenticated features unavailable. |
| Adding a new MCP server | Follow "Building an MCP Server for the Porch" conventions, register in MCPorch Portal. |
| Rate limit exceeded (Open) | 429 with retry-after. IP-based, affects all tools. |
| Rate limit exceeded (Public) | 429 with retry-after. Per-user, only affects that user. |

## Decisions and Rationale

**Why three tiers instead of two (authenticated/not)?** The economic properties of the resources dictate access patterns. Conflating "authenticated" with "authorized" creates a false binary. Some resources genuinely should be free to anyone (search), some need fair-use regulation (personalized features), and some must be restricted (internal governance). Three tiers maps cleanly to public goods / commons / club goods.

**Why remove OAuth now instead of leaving it?** The OAuth code is ~400 lines of complexity that currently serves no purpose if all tools are Open tier. Removing it makes the codebase simpler and makes the Phase 2 re-introduction intentional and well-documented rather than inherited.

**Why Cloudflare Access instead of in-Worker auth?** Infrastructure-layer auth means new servers get auth for free. Policy changes (adding IdPs, changing MFA rules, geo-restrictions) don't require code deploys. The Portal provides cross-server discovery and logging. And Access for SaaS on the free tier (50 seats) covers SuperBenefit's needs.

**Why design the full framework now?** The `resolveAuthContext()` → `checkTierAccess()` pattern, the `AuthContext` type, the tier definitions — these are the API contract that tools program against. If tools ship without this contract, adding tiers later requires touching every tool. If the contract exists from day one, adding tiers is a one-function change in `resolveAuthContext()`.

**Why `authContext` injection instead of `OAuthProvider` in the Worker?** `createMcpHandler` accepts an `authContext` option that populates `getMcpAuthContext()` for tools. Since Access for SaaS handles the full OAuth flow externally and attaches a signed JWT to requests, the Worker only needs to parse the header and pass claims through. This eliminates `workers-oauth-provider` as a Worker runtime dependency and reduces Phase 2's Worker-side changes to: parse JWT → inject `authContext` → uncomment `resolveAuthContext()` Phase 2 block.

**Why GitHub org as fallback for Members tier?** Not all SB contributors have onboarded to web3. The GitHub org is a reliable secondary source of truth for "is this person a contributor" until the ecosystem is fully onchain. It degrades gracefully.

**Why duplicate `auth/` across servers instead of a shared package?** The auth code is small (~150 lines across three files). Duplicating it keeps each server fully standalone with zero cross-repo build dependencies. The mechanism for sharing it (npm package, git submodule, copy script) is a practical decision deferred until the second server is built and the actual friction becomes clear. The contract is that this code is identical across servers — not the mechanism for keeping it in sync.

## Resolved Questions

These were open questions resolved during implementation research.

1. **Portal registration timing**: Register now as unauthenticated. Portals support unauthenticated server registration with no auth complexity, and early registration provides invocation logging and visibility.

2. **Rate limiting strategy**: Phase 1 uses Cloudflare edge rate limiting rules (no application code needed). IP-based, configured in the dashboard or wrangler. Phase 2+ adds application-level per-user rate limiting via KV or DO counters alongside the edge rules.

3. **Community agreements for Public tier**: KV storage for acceptance records in Phase 2 (simplest). Optional Hats NFT minting as the onchain acceptance record is the upgrade path. Decision: implement KV first, add onchain option when the Hats integration (Phase 3) is live.

## Open Questions

_(None at this time. New questions should be added here as they arise during implementation.)_

## Reference Links

### Official Cloudflare Documentation

- [createMcpHandler API Reference](https://developers.cloudflare.com/agents/model-context-protocol/mcp-handler-api/)
- [MCP Authorization](https://developers.cloudflare.com/agents/model-context-protocol/authorization/)
- [MCP Transport](https://developers.cloudflare.com/agents/model-context-protocol/transport/)
- [MCP Server Portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/)
- [Secure MCP with Access for SaaS](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/saas-mcp/)
- [Linked Apps (MCP → self-hosted)](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/linked-apps/)
- [Build a Remote MCP Server (guide)](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)

### Official Templates & Examples

- **Phase 1 scaffold**: [cloudflare/agents/examples/mcp-worker](https://github.com/cloudflare/agents/tree/main/examples/mcp-worker) — stateless `createMcpHandler`
- **Phase 2 reference (Access for SaaS)**: [cloudflare/ai/demos/remote-mcp-cf-access](https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-cf-access)
- **Phase 2 reference (authContext injection)**: [cloudflare/agents/examples/mcp-worker-authenticated](https://github.com/cloudflare/agents/tree/main/examples/mcp-worker-authenticated)
- **Stateful MCP (DO-backed)**: [cloudflare/agents/examples/mcp](https://github.com/cloudflare/agents/tree/main/examples/mcp)
- **Authless template**: [cloudflare/ai/demos/remote-mcp-authless](https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)
- **GitHub OAuth template**: [cloudflare/ai/demos/remote-mcp-github-oauth](https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-github-oauth)

### Production References

- **Cloudflare's own MCP servers**: [cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare)
- **Agents SDK**: [cloudflare/agents](https://github.com/cloudflare/agents)
- **OAuth Provider library**: [cloudflare/workers-oauth-provider](https://github.com/cloudflare/workers-oauth-provider)