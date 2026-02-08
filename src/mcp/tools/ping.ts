import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { resolveAuthContext } from '../../auth/resolve.js';
import { checkTierAccess } from '../../auth/check.js';

/**
 * Register the ping tool - useful for testing connectivity.
 * Demonstrates the standard tier-checking pattern that ALL tools must follow.
 */
export function registerPingTool(server: McpServer, env: Env) {
  server.tool(
    'ping',
    'Returns pong - useful for testing connectivity',
    { message: z.string().max(1000).optional().describe('Optional message to echo back') },
    async ({ message }) => {
      // Every tool MUST call resolveAuthContext + checkTierAccess
      const authContext = await resolveAuthContext(env);
      const access = checkTierAccess('open', authContext);

      if (!access.allowed) {
        return {
          content: [{
            type: 'text',
            text: `Requires ${access.requiredTier} access. Current: ${access.currentTier}.`
          }],
        };
      }

      const response = message ? `pong: ${message}` : 'pong';
      return {
        content: [{ type: 'text', text: response }],
      };
    }
  );
}
