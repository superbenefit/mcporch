import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools/index.js';

/**
 * Factory function to create a new McpServer instance.
 *
 * CRITICAL: Must be called per-request (MCP SDK >= 1.26.0 security requirement).
 * See GHSA-345p-7cg4-v4c7 (CVE-2026-25536) - sharing McpServer instances across requests
 * can leak response data between clients.
 */
export function createMcpServer(env: Env): McpServer {
  const server = new McpServer({
    name: 'MCPorch',
    version: '0.1.0',
  });

  registerTools(server, env);

  return server;
}
