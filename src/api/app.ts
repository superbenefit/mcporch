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

// Root landing page
app.get('/', (c) => {
  // JSON for programmatic clients
  if (c.req.header('Accept')?.includes('application/json')) {
    return c.json({
      name: 'MCPorch',
      version: '0.1.0',
      description: 'SuperBenefit MCP Server Framework',
      endpoints: { mcp: '/mcp', health: '/api/v1/health' },
    });
  }
  // HTML for browsers
  return c.html(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MCPorch</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0b;color:#e4e4e7;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{max-width:540px;width:100%;padding:2rem}
h1{font-size:1.5rem;font-weight:600;margin-bottom:.25rem}
.subtitle{color:#a1a1aa;font-size:.875rem;margin-bottom:2rem}
.version{display:inline-block;font-size:.75rem;color:#71717a;border:1px solid #27272a;border-radius:9999px;padding:.125rem .5rem;margin-left:.5rem;vertical-align:middle}
.section{margin-bottom:1.5rem}
.section-title{font-size:.75rem;font-weight:500;color:#71717a;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.75rem}
a{color:#e4e4e7;text-decoration:none;display:flex;align-items:center;gap:.75rem;padding:.625rem .875rem;border-radius:.5rem;border:1px solid #27272a;background:#18181b;margin-bottom:.5rem;transition:border-color .15s,background .15s}
a:hover{border-color:#3f3f46;background:#1f1f23}
.label{font-size:.875rem;font-weight:500}
.path{font-size:.75rem;color:#71717a;font-family:ui-monospace,monospace}
.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dot-green{background:#22c55e}
.dot-purple{background:#a855f7}
.badge{display:inline-block;font-size:.625rem;color:#a1a1aa;border:1px solid #27272a;border-radius:.25rem;padding:.0625rem .375rem;margin-left:.5rem;vertical-align:middle}
.servers{margin-top:.5rem}
.server{display:flex;align-items:center;gap:.5rem;padding:.5rem .875rem;font-size:.8125rem;color:#a1a1aa}
.server .dot{width:6px;height:6px}
.footer{margin-top:2rem;padding-top:1rem;border-top:1px solid #1c1c1f;font-size:.75rem;color:#52525b}
.footer a{display:inline;border:0;background:0;padding:0;color:#a855f7}
.footer a:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="container">
  <h1>MCPorch<span class="version">v0.1.0</span></h1>
  <p class="subtitle">SuperBenefit MCP server framework — shared auth, types, and portal</p>
  <div class="section">
    <div class="section-title">Endpoints</div>
    <a href="/mcp"><span class="dot dot-purple"></span><span><span class="label">MCP Server</span><br><span class="path">/mcp</span></span></a>
    <a href="/api/v1/health"><span class="dot dot-green"></span><span><span class="label">Health</span><br><span class="path">/api/v1/health</span></span></a>
  </div>
  <div class="section">
    <div class="section-title">Ecosystem Servers</div>
    <div class="server"><span class="dot dot-green"></span>Knowledge Server<span class="badge">open</span></div>
  </div>
  <div class="footer">Part of the <a href="https://superbenefit.org">SuperBenefit</a> knowledge stack</div>
</div>
</body>
</html>`);
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
