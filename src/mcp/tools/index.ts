import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPingTool } from './core/ping.js';
import { registerKnowledgeTools } from './knowledge/index.js';

/**
 * Register all MCP tools with the server.
 * Add new tool registrations here as tools are created.
 */
export function registerTools(server: McpServer, env: Env) {
  // Core framework tools
  registerPingTool(server, env);

  // Knowledge tools (migrated from knowledge-server)
  registerKnowledgeTools(server, env);
}
