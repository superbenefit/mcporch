interface Env {
  // Phase 1: Rate limiting
  RATE_LIMITER: RateLimit;

  // Phase 2: Authentication
  // CF_ACCESS_AUD: string;
  // SYBIL_CACHE: KVNamespace;
  // AGREEMENTS: KVNamespace;

  // Phase 3: Authorization
  // IDENTITY_MAP: KVNamespace;
  // HATS_SUBGRAPH_URL: string;
}
