import { describe, it, expect } from 'vitest';
import { honoApp } from './app';

interface InfoResponse {
  name: string;
  version: string;
  description: string;
  endpoints: { mcp: string; health: string };
}

interface HealthResponse {
  status: string;
  tier: string;
}

describe('GET /', () => {
  it('returns HTML landing page for browsers', async () => {
    const res = await honoApp.request('/');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<!doctype html>');
    expect(text).toContain('MCPorch');
  });

  it('returns JSON when Accept: application/json', async () => {
    const res = await honoApp.request('/', { headers: { Accept: 'application/json' } });
    expect(res.status).toBe(200);
    const json = (await res.json()) as InfoResponse;
    expect(json.name).toBe('MCPorch');
    expect(json.version).toBe('0.1.0');
    expect(json.endpoints.mcp).toBe('/mcp');
    expect(json.endpoints.health).toBe('/api/v1/health');
  });
});

describe('GET /api/v1/health', () => {
  it('returns health status', async () => {
    const res = await honoApp.request('/api/v1/health');
    expect(res.status).toBe(200);
    const json = (await res.json()) as HealthResponse;
    expect(json.status).toBe('ok');
    expect(json.tier).toBe('open');
  });
});
