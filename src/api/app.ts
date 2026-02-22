import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

const app = new Hono<{ Bindings: Env }>();

// Security headers middleware
app.use('*', secureHeaders());

// CORS middleware - restricted methods/headers for Phase 1
// Phase 2+: replace origin '*' with strict allowlist
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}));

// Structured error handler — logs details, returns generic response
app.onError((err, c) => {
  console.error('Unhandled error:', err.message);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Root info endpoint
app.get('/', (c) => {
  return c.json({
    name: 'MCPorch',
    version: '0.1.0',
    description: 'SuperBenefit MCP Server Framework',
    endpoints: {
      mcp: '/mcp',
      health: '/api/v1/health',
    },
  });
});

// Health check endpoint
app.get('/api/v1/health', (c) => {
  return c.json({ status: 'ok', tier: 'open' });
});

// 404 handler for unmatched routes
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export { app as honoApp };
