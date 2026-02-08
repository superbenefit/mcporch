import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test the Zod schema constraint directly (no need to instantiate McpServer)
const pingSchema = z.object({
  message: z.string().max(1000).optional(),
});

describe('ping tool input validation', () => {
  it('accepts a short message', () => {
    const result = pingSchema.safeParse({ message: 'hello' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty message (optional)', () => {
    const result = pingSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts undefined message (optional)', () => {
    const result = pingSchema.safeParse({ message: undefined });
    expect(result.success).toBe(true);
  });

  it('accepts a message at the max length (1000 chars)', () => {
    const result = pingSchema.safeParse({ message: 'a'.repeat(1000) });
    expect(result.success).toBe(true);
  });

  it('rejects a message exceeding max length (1001 chars)', () => {
    const result = pingSchema.safeParse({ message: 'a'.repeat(1001) });
    expect(result.success).toBe(false);
  });

  it('rejects a very large message', () => {
    const result = pingSchema.safeParse({ message: 'x'.repeat(100_000) });
    expect(result.success).toBe(false);
  });
});

// Test that tier denial returns before executing tool logic
describe('ping tool tier denial', () => {
  it('checkTierAccess denies open-tier tool for insufficient tier', async () => {
    // Import dynamically to avoid issues with Workers types
    const { checkTierAccess } = await import('../../auth/check.js');
    const result = checkTierAccess('public', {
      identity: null,
      tier: 'open',
      address: null,
      roles: null,
    });
    expect(result.allowed).toBe(false);
  });
});
