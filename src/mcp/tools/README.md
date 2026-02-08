# Adding MCP Tools

## The Required Pattern

Every tool MUST:

1. Call `resolveAuthContext(env)` to get the current authentication state
2. Call `checkTierAccess(tier, authContext)` to verify access permissions
3. Handle access denial before executing any tool logic

This pattern ensures consistent authentication and authorization across all tools.

## Input Validation Convention

All string parameters MUST include a `.max()` constraint to prevent abuse via oversized inputs. Use appropriate limits based on the parameter's purpose:

```typescript
// Examples
z.string().max(1000)             // General text input
z.string().max(200)              // Short identifiers or names
z.string().max(100).regex(/.../) // Constrained format strings
```

Never accept unbounded strings — even with Cloudflare's request body limits, explicit validation provides defense in depth and clear error messages.

## Step-by-Step: Add a New Tool

### Step 1: Create the Tool File

Create `src/mcp/tools/my-tool.ts`:

```typescript
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { resolveAuthContext } from '../../auth/resolve.js';
import { checkTierAccess } from '../../auth/check.js';

export function registerMyTool(server: McpServer, env: Env) {
  server.tool(
    'my_tool',
    'Description of what this tool does',
    { param: z.string().max(1000).describe('Parameter description') },
    async ({ param }) => {
      // Step 1: Resolve authentication context
      const authContext = await resolveAuthContext(env);

      // Step 2: Check tier access
      const access = checkTierAccess('open', authContext);

      // Step 3: Handle denial before executing logic
      if (!access.allowed) {
        return {
          content: [{ type: 'text', text: `Requires ${access.requiredTier} access.` }],
        };
      }

      // Your tool logic here
      return { content: [{ type: 'text', text: `Result: ${param}` }] };
    }
  );
}
```

### Step 2: Register the Tool

Add your tool to `src/mcp/tools/index.ts`:

```typescript
import { registerMyTool } from './my-tool.js';

export function registerTools(server: McpServer, env: Env) {
  registerPingTool(server, env);
  registerMyTool(server, env);  // Add this line
}
```

### Step 3: Test the Tool

Test with MCP Inspector at http://localhost:8787/mcp

## Example: ping.ts Walkthrough

The `ping.ts` tool demonstrates the required pattern:

1. It imports `resolveAuthContext` and `checkTierAccess` from the auth module
2. Inside the tool handler, it first resolves the auth context
3. It checks access for the `'open'` tier
4. If access is denied, it returns an error message with the required tier
5. Only after access is confirmed does it execute the actual ping logic

This ensures that even the simplest tools follow the authentication flow consistently.

## Tier Requirements

| Tier | Use Case | Phase |
|------|----------|-------|
| `'open'` | Public tools accessible to everyone | Phase 1 |
| `'public'` | Tools requiring authentication | Phase 2 |
| `'members'` | Tools requiring authorization/membership | Phase 3 |

Choose the appropriate tier based on your tool's security requirements. Start with `'open'` for public functionality and increase restrictions as needed.
