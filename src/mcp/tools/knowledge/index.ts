import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Register knowledge tools with the MCP server.
 *
 * Knowledge tools are migrated from knowledge-server and provide:
 * - search_knowledge: Semantic search over the knowledge base
 * - define_term: Lexicon term definitions
 * - search_lexicon: Keyword search over lexicon entries
 * - get_document: Full document retrieval
 * - list_groups: List groups/cells
 * - list_releases: List creative releases
 *
 * These tools require knowledge-server bindings (KNOWLEDGE R2 bucket,
 * VECTORIZE index, AI binding). Registration is conditional on bindings
 * being available.
 */
export function registerKnowledgeTools(server: McpServer, env: Env) {
  // Knowledge tools will be registered here when migrated from knowledge-server.
  // Each tool follows the standard pattern:
  //   1. resolveAuthContext(env)
  //   2. checkTierAccess(tier, authContext)
  //   3. Execute tool logic
}
