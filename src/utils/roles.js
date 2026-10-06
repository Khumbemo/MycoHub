export const ROLE_ORDER = ['COLLECTOR', 'IDENTIFIER', 'CURATOR', 'ADMIN'];

/**
 * The effective role comes only from the Firebase ID token's custom claims,
 * which only an admin can set (scripts/set-role.mjs). Anything else is a COLLECTOR.
 */
export const roleFromClaims = (claims) => {
  const role = claims?.role;
  return typeof role === 'string' && ROLE_ORDER.includes(role) ? role : 'COLLECTOR';
};

export const roleAtLeast = (role, required) => !!role && ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(required);
