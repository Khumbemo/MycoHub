// GBIF Backbone Taxonomy name matching: https://techdocs.gbif.org/en/openapi/v1/species
const API = 'https://api.gbif.org/v1/species';

/** Match a name against the GBIF backbone, restricted to kingdom Fungi. */
export const matchName = async (name, fetchImpl = fetch) => {
  const q = name.trim();
  if (!q) return { kind: 'none' };
  try {
    const res = await fetchImpl(`${API}/match?kingdom=Fungi&name=${encodeURIComponent(q)}`);
    if (!res.ok) return { kind: 'error', message: `GBIF returned ${res.status}` };
    const data = await res.json();

    if (!data.usageKey || !data.matchType || data.matchType === 'NONE') return { kind: 'none' };
    if (data.kingdom && data.kingdom !== 'Fungi') return { kind: 'not-fungus', kingdom: data.kingdom };

    let acceptedName = data.scientificName ?? q;
    if (data.acceptedUsageKey && data.acceptedUsageKey !== data.usageKey) {
      // Synonym: look up the accepted name with its authorship.
      const acc = await fetchImpl(`${API}/${data.acceptedUsageKey}`);
      if (acc.ok) acceptedName = (await acc.json()).scientificName ?? acceptedName;
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
export const canonicalName = (scientificName, rank) => {
  const words = scientificName.split(/\s+/);
  const keep = rank === 'GENUS' ? 1 : ['SUBSPECIES', 'VARIETY', 'FORM'].includes(rank) ? 4 : 2;
  const out = [];
  for (const w of words) {
    if (out.length >= keep) break;
    if (/^[(A-Z]/.test(w) && out.length > 0) break; // authorship starts
    out.push(w);
  }
  return out.join(' ');
};
