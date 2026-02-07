import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware - permissive for Phase 1 (all tools are public)
app.use('*', cors());

// Health check endpoint
app.get('/api/v1/health', (c) => {
  return c.json({ status: 'ok', tier: 'open' });
});

// 404 handler for unmatched routes
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export { app as honoApp };
