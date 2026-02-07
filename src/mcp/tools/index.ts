import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPingTool } from './ping.js';

/**
 * Register all MCP tools with the server.
 * Add new tool registrations here as tools are created.
 */
export function registerTools(server: McpServer, env: Env) {
  registerPingTool(server, env);
  // Add more tools here as they are created
}
