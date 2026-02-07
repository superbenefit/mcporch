# MCP Module

## Overview

This module implements the MCP (Model Context Protocol) server. It provides a factory function for creating server instances and registers all available tools.

## Key Pattern - Per-Request Instantiation

```typescript
// CRITICAL: Create new server instance per request
const server = createMcpServer(env);
```

MCP SDK >=1.26.0 requires fresh instances per request (CVE GHSA-qgp8-v765-qxx9). Sharing instances across requests leaks data between clients. The `createMcpServer` factory function ensures each request gets an isolated server instance with its own state.

## Files

| File | Description |
|------|-------------|
| `server.ts` | `createMcpServer(env)` factory function that creates and configures MCP server instances |
| `tools/` | Individual tool implementations, each following the auth pattern |

## Adding Tools

See `tools/README.md` for step-by-step instructions on implementing new MCP tools with proper authentication.
