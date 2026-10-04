// Identification consensus, shared by the app and the Cloud Function.
//
// Modelled on iNaturalist's community taxon rule:
//  - every person gets one vote (their latest identification); the record's
//    original name counts as the observer's vote unless they add one later;
//  - a taxon reaches consensus with at least 2 votes and more than 2/3 of all votes;
//  - COMMUNITY_GRADE = consensus;
//  - RESEARCH_GRADE  = consensus, at least one agreeing IDENTIFIER/CURATOR/ADMIN,
//    and the record has a date and coordinates;
//  - otherwise UNVERIFIED. FLAGGED is set by people, never computed.
// Names are compared case- and whitespace-insensitively; unlike iNaturalist,
// a genus-level ID does not count as agreeing with a species inside it.

const EXPERT_ROLES = ['IDENTIFIER', 'CURATOR', 'ADMIN'];

export const normalizeTaxon = (name) =>
  String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const display = (key) => key.charAt(0).toUpperCase() + key.slice(1);

/**
 * @param {object} input
 * @param {string} input.ownerId
 * @param {string} [input.ownerRole]
 * @param {string} input.ownerTaxon
 * @param {boolean} input.hasDate
 * @param {boolean} input.hasCoordinates
 * @param {{userId: string, role?: string, taxon: string}[]} input.identifications
 */
export function computeConsensus({ ownerId, ownerRole = 'COLLECTOR', ownerTaxon, hasDate, hasCoordinates, identifications = [] }) {
  const votes = new Map();
  if (normalizeTaxon(ownerTaxon)) votes.set(ownerId, { taxon: normalizeTaxon(ownerTaxon), role: ownerRole });
  for (const id of identifications) {
    const taxon = normalizeTaxon(id.taxon);
    if (taxon) votes.set(id.userId, { taxon, role: id.role ?? 'COLLECTOR' });
  }

  const tally = new Map();
  for (const { taxon } of votes.values()) tally.set(taxon, (tally.get(taxon) ?? 0) + 1);

  let top = null;
  let topVotes = 0;
  for (const [taxon, n] of tally) {
    if (n > topVotes) { top = taxon; topVotes = n; }
  }
  const total = votes.size;
  const hasConsensus = top !== null && topVotes >= 2 && topVotes / total > 2 / 3;

  if (!hasConsensus) {
    return { status: 'UNVERIFIED', taxon: top ? display(top) : null, votes: total, agreeing: topVotes, disputed: tally.size > 1 };
  }

  const expertAgrees = [...votes.values()].some((v) => v.taxon === top && EXPERT_ROLES.includes(v.role));
  const status = expertAgrees && hasDate && hasCoordinates ? 'RESEARCH_GRADE' : 'COMMUNITY_GRADE';
  return { status, taxon: display(top), votes: total, agreeing: topVotes, disputed: tally.size > 1 };
}
