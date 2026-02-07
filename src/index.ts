import { createMcpHandler } from 'agents/mcp';
import { createMcpServer } from './mcp/server.js';
import { honoApp } from './api/app.js';

/**
 * MCPorch fetch handler with route split.
 *
 * - /mcp and /mcp/* → MCP handler (createMcpHandler)
 * - Everything else → Hono REST API
 *
 * Phase 2 will add JWT parsing from CF-Access-JWT-Assertion header
 * and pass claims to createMcpHandler's authContext option.
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // MCP requests → createMcpHandler (bypasses Hono)
    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
      // Phase 2: parse CF-Access-JWT-Assertion → build authContext here
      // const claims = await resolveAuthFromHeaders(request, env);

      // CRITICAL: Create new server instance per request (MCP SDK >= 1.26.0 security requirement)
      const server = createMcpServer(env);
      const handler = createMcpHandler(server, {
        route: '/mcp',
        // Phase 2: authContext: claims ? { props: claims } : undefined,
      });
      return handler(request, env, ctx);
    }

    // REST API requests → Hono
    return honoApp.fetch(request, env, ctx);
  },
};
