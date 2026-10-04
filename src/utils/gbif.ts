import type { TaxonMatch } from '../types';

// GBIF Backbone Taxonomy name matching: https://techdocs.gbif.org/en/openapi/v1/species
const API = 'https://api.gbif.org/v1/species';

interface GbifMatchResponse {
  usageKey?: number;
  acceptedUsageKey?: number;
  scientificName?: string;
  rank?: string;
  status?: string;
  confidence?: number;
  matchType?: 'EXACT' | 'FUZZY' | 'HIGHERRANK' | 'NONE';
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
}

export type MatchOutcome =
  | { kind: 'match'; match: TaxonMatch }
  | { kind: 'none' }
  | { kind: 'not-fungus'; kingdom: string }
  | { kind: 'error'; message: string };

/** Match a name against the GBIF backbone, restricted to kingdom Fungi. */
export const matchName = async (name: string, fetchImpl: typeof fetch = fetch): Promise<MatchOutcome> => {
  const q = name.trim();
  if (!q) return { kind: 'none' };
  try {
    const res = await fetchImpl(`${API}/match?kingdom=Fungi&name=${encodeURIComponent(q)}`);
    if (!res.ok) return { kind: 'error', message: `GBIF returned ${res.status}` };
    const data = (await res.json()) as GbifMatchResponse;

    if (!data.usageKey || !data.matchType || data.matchType === 'NONE') return { kind: 'none' };
    if (data.kingdom && data.kingdom !== 'Fungi') return { kind: 'not-fungus', kingdom: data.kingdom };

    let acceptedName = data.scientificName ?? q;
    if (data.acceptedUsageKey && data.acceptedUsageKey !== data.usageKey) {
      // Synonym: look up the accepted name with its authorship.
      const acc = await fetchImpl(`${API}/${data.acceptedUsageKey}`);
      if (acc.ok) acceptedName = ((await acc.json()) as { scientificName?: string }).scientificName ?? acceptedName;
    }

    return {
      kind: 'match',
      match: {
        taxonKey: data.usageKey,
        matchedName: data.scientificName ?? q,
        acceptedName,
        rank: data.rank ?? '',
        status: data.status ?? '',
        matchType: data.matchType,
        confidence: data.confidence ?? 0,
        kingdom: data.kingdom,
        phylum: data.phylum,
        class: data.class,
        order: data.order,
        family: data.family,
        genus: data.genus,
      },
    };
  } catch {
    return { kind: 'error', message: 'Could not reach GBIF. Check your connection and try again.' };
  }
};

/** Strip the authorship from a GBIF scientific name: "Amanita muscaria (L.) Lam." → "Amanita muscaria". */
export const canonicalName = (scientificName: string, rank: string): string => {
  const words = scientificName.split(/\s+/);
  const keep = rank === 'GENUS' ? 1 : ['SUBSPECIES', 'VARIETY', 'FORM'].includes(rank) ? 4 : 2;
  const out: string[] = [];
  for (const w of words) {
    if (out.length >= keep) break;
    if (/^[(A-Z]/.test(w) && out.length > 0) break; // authorship starts
    out.push(w);
  }
  return out.join(' ');
};
