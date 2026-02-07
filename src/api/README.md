# REST API Module

## Overview

Optional REST API layer using Hono. MCPorch can serve both MCP tools (at `/mcp`) and traditional REST endpoints (at `/api/v1/*`). Not all MCP servers need REST APIs - this is included for servers that do.

## Current Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check, returns `{ status: 'ok', tier: 'open' }` |

## Adding a New Route

Edit `src/api/app.ts`:

```typescript
// Add after existing routes
app.get('/api/v1/my-endpoint', (c) => {
  return c.json({ message: 'Hello from my endpoint' });
});
```

## CORS Configuration

Currently permissive (allows all origins) for Phase 1. Tighten in production.

## When to Use REST vs MCP

- **MCP**: AI tool invocations, structured tool calls
- **REST**: Health checks, webhooks, admin APIs, non-AI integrations

## Hono Documentation

https://hono.dev/
