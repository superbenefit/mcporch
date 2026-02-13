# MCPorch — SuperBenefit MCP Server Framework

## Project Context

Porch is the reference MCP server framework for SuperBenefit. It provides:
- Three-tier access control (open → public → members)
- Per-request MCP server instantiation (CVE-2026-25536 mitigation)
- Rate limiting via Cloudflare Rate Limiting API
- Tool registration pattern with mandatory auth checks

**Phase 1 (current):** Open tier only — no authentication.
**Phase 2 (future):** Public tier via Cloudflare Access JWT.
**Phase 3 (future):** Members tier via Hats Protocol / token gating.

## Technical Stack

- Cloudflare Workers with `agents/mcp` (`createMcpHandler`)
- Hono for REST API routing
- Zod 4.x for schema validation
- Vitest for testing
- TypeScript (strict mode, ES2021 target)

## Architecture

### Route Split (`src/index.ts`)

```
/mcp, /mcp/* → createMcpHandler (bypasses Hono)
everything else → Hono REST API
```

Rate limiting is applied to ALL requests at the top of the fetch handler.

### MCP Server Pattern

**CRITICAL:** Create a new `McpServer` per request. Never reuse instances.

```typescript
const server = createMcpServer(env); // Factory in src/mcp/server.ts
const handler = createMcpHandler(server, { route: '/mcp' });
return handler(request, env, ctx);
```

### Access Control

Every tool MUST follow this pattern:

```typescript
import { resolveAuthContext } from '../../auth/resolve.js';
import { checkTierAccess } from '../../auth/check.js';

server.tool('tool_name', 'description', { param: z.string().max(200) },
  async ({ param }) => {
    const authContext = await resolveAuthContext(env);
    const access = checkTierAccess('open', authContext);
    if (!access.allowed) {
      return {
        content: [{ type: 'text', text: `Requires ${access.requiredTier} access. Current: ${access.currentTier}.` }],
        isError: true,
      };
    }
    // ... tool logic
  }
);
```

### Three Tiers

| Tier | Level | Auth Mechanism | Phase |
|------|-------|----------------|-------|
| `open` | 0 | None | 1 (current) |
| `public` | 1 | Cloudflare Access JWT | 2 |
| `members` | 2 | Hats Protocol / GitHub org | 3 |

## Project Structure

```
src/
├── index.ts              # Fetch handler with route split + rate limiting
├── env.d.ts              # Environment type declarations
├── api/
│   └── app.ts            # Hono REST API
├── auth/
│   ├── types.ts          # AccessTier, AuthContext, Identity, HatsRole
│   ├── check.ts          # checkTierAccess()
│   ├── check.test.ts     # All 9 tier combinations + result shapes
│   ├── resolve.ts        # resolveAuthContext() — Phase 1: always open
│   └── resolve.test.ts   # Phase 1 behavior tests
└── mcp/
    ├── server.ts          # createMcpServer() factory
    └── tools/
        ├── index.ts       # registerTools() — central registration
        ├── core/          # Framework tools (ping, health)
        │   ├── ping.ts
        │   └── ping.test.ts
        └── knowledge/     # Knowledge tools (migrated from knowledge-server)
            └── index.ts   # Conditional registration
```

## Code Standards

### Input Validation

ALL string inputs MUST have `.max()` constraints:
- General text: `.max(1000)`
- Identifiers: `.max(200)`
- Search queries: `.max(5000)`
- Document content: `.max(100000)`
- URLs: `.max(2000)`

### Testing

- Framework: Vitest with `globals: true`
- Pattern: Co-located tests (`*.test.ts` next to source)
- Test schemas directly via `safeParse()` — no need to instantiate McpServer
- Auth tests cover all 9 tier combinations (3 required x 3 current)
- Use `makeAuthContext(tier)` helper for test fixtures

### Adding a New Tool

1. Create `src/mcp/tools/<category>/<tool-name>.ts`
2. Export `register<ToolName>Tool(server, env)` function
3. Follow the auth pattern (resolveAuthContext → checkTierAccess)
4. Add `.max()` to all string params
5. Import and call in `src/mcp/tools/index.ts`
6. Add co-located test file

### Common Mistakes

- Never share McpServer instances across requests
- Never skip `resolveAuthContext()` + `checkTierAccess()` in a tool
- Never leave string params unbounded (no `.max()`)
- Never use `batch.ackAll()` for queue consumers — use per-message `msg.ack()`

## Testing

```bash
npm test          # Run all tests
npm run dev       # Start local dev server
npm run types     # Regenerate Cloudflare types
```

## Key Files

| File | Purpose |
|------|---------|
| `src/auth/types.ts` | Type definitions for the entire auth system |
| `src/auth/resolve.ts` | Single source of truth for tier resolution |
| `src/mcp/server.ts` | MCP server factory (per-request) |
| `src/mcp/tools/index.ts` | Tool registration hub |
| `mcporch-spec.md` | Full specification document |
