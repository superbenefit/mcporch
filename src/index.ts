import { createMcpHandler } from 'agents/mcp';
import { createMcpServer } from './mcp/server.js';
import { honoApp } from './api/app.js';
import { SECURITY_HEADERS } from './security.js';

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
    try {
      const url = new URL(request.url);

      // Rate limiting — key on client IP (Phase 2+: key on user ID)
      const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      const { success } = await env.RATE_LIMITER.limit({ key: clientIp });
      if (!success) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '60', ...SECURITY_HEADERS },
        });
      }

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
        const response = await handler(request, env, ctx);

        // Inject security headers into MCP response
        const securedResponse = new Response(response.body, response);
        for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
          securedResponse.headers.set(key, value);
        }
        return securedResponse;
      }

      // REST API requests → Hono
      return honoApp.fetch(request, env, ctx);
    } catch (err) {
      console.error('Unhandled fetch error:', err instanceof Error ? err.message : String(err));
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...SECURITY_HEADERS },
      });
    }
  },
};
