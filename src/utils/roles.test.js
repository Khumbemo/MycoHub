import { describe, expect, it } from 'vitest';
import { roleAtLeast, roleFromClaims } from './roles';

describe('roleFromClaims', () => {
  it('reads a valid role claim', () => {
    expect(roleFromClaims({ role: 'IDENTIFIER' })).toBe('IDENTIFIER');
    expect(roleFromClaims({ role: 'ADMIN' })).toBe('ADMIN');
  });

  it('falls back to COLLECTOR for missing or unknown claims', () => {
    expect(roleFromClaims(undefined)).toBe('COLLECTOR');
    expect(roleFromClaims({})).toBe('COLLECTOR');
    expect(roleFromClaims({ role: 'SUPERUSER' })).toBe('COLLECTOR');
    expect(roleFromClaims({ role: 3 })).toBe('COLLECTOR');
  });
});

describe('roleAtLeast', () => {
  it('orders COLLECTOR < IDENTIFIER < CURATOR < ADMIN', () => {
    expect(roleAtLeast('IDENTIFIER', 'IDENTIFIER')).toBe(true);
    expect(roleAtLeast('CURATOR', 'IDENTIFIER')).toBe(true);
    expect(roleAtLeast('COLLECTOR', 'IDENTIFIER')).toBe(false);
    expect(roleAtLeast(undefined, 'COLLECTOR')).toBe(false);
  });
});
