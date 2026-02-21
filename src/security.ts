/**
 * Security headers for MCP and API responses.
 *
 * Applied to all non-Hono responses (MCP handler, rate limit errors, etc.).
 * Hono apps handle their own headers via secureHeaders() middleware.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-site',
  'Cross-Origin-Resource-Policy': 'same-site',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'none'",
};
