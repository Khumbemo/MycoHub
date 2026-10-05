import type { UserRole } from '../types';

export const ROLE_ORDER: UserRole[] = ['COLLECTOR', 'IDENTIFIER', 'CURATOR', 'ADMIN'];

/**
 * The effective role comes only from the Firebase ID token's custom claims,
 * which only an admin can set (scripts/set-role.mjs). Anything else is a COLLECTOR.
 */
export const roleFromClaims = (claims: Record<string, unknown> | null | undefined): UserRole => {
  const role = claims?.role;
  return typeof role === 'string' && (ROLE_ORDER as string[]).includes(role) ? (role as UserRole) : 'COLLECTOR';
};

export const roleAtLeast = (role: UserRole | undefined, required: UserRole): boolean =>
  !!role && ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(required);
