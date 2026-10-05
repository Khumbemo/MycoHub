// Short reference notes for the offline assistant. Each entry matches on keywords.
export interface AssistantNote {
  topic: string;
  keywords: string[];
  answer: string;
}

export const SAFETY_ANSWER =
  '⚠️ Safety: this app cannot tell you whether a wild mushroom is edible, and neither can any photo or AI tool. ' +
  'Deadly species such as Amanita phalloides and Galerina marginata contain amatoxins and can look like edible species. ' +
  'Get an in-person identification from an experienced mycologist. In a suspected poisoning, contact a poison control centre or emergency services immediately.';

export const SAFETY_KEYWORDS = ['edible', 'eat', 'eating', 'cook', 'taste good', 'safe to', 'poison', 'toxic', 'psychedelic', 'dose'];

export const NOTES: AssistantNote[] = [
  {
    topic: 'Amanita',
    keywords: ['amanita', 'death cap', 'fly agaric', 'volva'],
    answer:
      'Amanita: a universal veil leaves a volva at the stem base and often warts or patches on the cap; most species also have a partial veil that leaves a ring (annulus), ' +
      'though section Vaginatae (the grisettes) lacks one. Spore print white. Most species are ectomycorrhizal with trees. ' +
      'The genus includes the deadliest fungi known (A. phalloides, A. virosa, A. bisporigera). Always dig up the whole stem base to check for a volva.',
  },
  {
    topic: 'Spore prints',
    keywords: ['spore print', 'spore colour', 'spore color', 'print'],
    answer:
      'Spore print: remove the stem, place the cap hymenium-down on paper (half white, half dark helps) or glass, cover it to stop drafts, and leave it for a few hours to overnight. ' +
      'Colour narrows the genus, e.g. white (Amanita, most Russula, Lactarius), pink (Pluteus, Entoloma), rusty brown (Cortinarius, Galerina), chocolate brown (Agaricus), purple-black (Psathyrella, Hypholoma).',
  },
  {
    topic: "Melzer's reagent",
    keywords: ['melzer', 'amyloid', 'dextrinoid', 'iodine'],
    answer:
      "Melzer's reagent is an iodine–potassium iodide solution with chloral hydrate. Under the microscope spores react as amyloid (blue to blue-black), " +
      'dextrinoid (reddish-brown) or inamyloid (no change or pale yellow). Russula and Lactarius spore ornamentation is amyloid; many Amanita species split by amyloid vs inamyloid spores.',
  },
  {
    topic: 'KOH and FeSO4',
    keywords: ['koh', 'potassium hydroxide', 'feso4', 'iron', 'chemical test', 'macrochemical'],
    answer:
      'Macrochemical tests: apply a drop of KOH (typically 3–10%) or FeSO4 (iron sulphate, about 10%) to the cap cuticle and flesh and note the colour change and timing. ' +
      'KOH reactions are widely used in boletes and Cortinarius. FeSO4 is classic in Russula: most turn salmon-pink on the stem, while the R. xerampelina group turns green.',
  },
  {
    topic: 'Gill attachment',
    keywords: ['gill', 'attachment', 'adnate', 'adnexed', 'decurrent', 'free', 'sinuate', 'lamellae'],
    answer:
      'Gill attachment terms: free (not touching the stem), adnexed (narrowly attached), adnate (broadly attached), sinuate/emarginate (notched just before the stem), ' +
      'decurrent (running down the stem). Look at a longitudinal section through cap and stem.',
  },
  {
    topic: 'Mycorrhiza',
    keywords: ['mycorrhiz', 'ectomycorrhizal', 'host', 'symbio', 'tree'],
    answer:
      'Ectomycorrhizal fungi sheath the host root tips in a mantle and grow between root cortex cells as a Hartig net, trading soil nutrients for host sugars. ' +
      'Common hosts are Pinaceae, Fagaceae, Betulaceae and Salicaceae. Recording the nearest trees within a few metres is valuable data for ectomycorrhizal genera such as Amanita, Boletus, Russula and Cortinarius.',
  },
  {
    topic: 'Habitat',
    keywords: ['habitat', 'substrate', 'ecology', 'woodland', 'grassland'],
    answer:
      'Record habitat as precisely as you can: substrate (soil, litter, dead or living wood, dung), host or nearby plants, and vegetation type. ' +
      'Wood-decay species are often host-specific; many grassland waxcaps (Hygrocybe s.l.) are indicators of old, unfertilised grassland.',
  },
  {
    topic: 'Shannon diversity',
    keywords: ['shannon', 'diversity', 'richness', 'evenness', 'pielou', 'index'],
    answer:
      "Shannon diversity H′ = −Σ pᵢ ln pᵢ, where pᵢ is the proportion of records belonging to species i. Richness S is the number of species. " +
      "Pielou's evenness J′ = H′ / ln S ranges from 0 to 1. Fungal fruiting is patchy and seasonal, so sporocarp surveys need repeated visits across years to estimate site diversity well.",
  },
  {
    topic: 'Darwin Core',
    keywords: ['darwin core', 'dwc', 'gbif', 'data standard', 'occurrence'],
    answer:
      'Darwin Core is the TDWG standard used by GBIF. Core occurrence terms include scientificName, eventDate, recordedBy, recordNumber, decimalLatitude, decimalLongitude, ' +
      'geodeticDatum (e.g. WGS84), coordinateUncertaintyInMeters and basisOfRecord (e.g. PreservedSpecimen or HumanObservation).',
  },
  {
    topic: 'Vouchers',
    keywords: ['voucher', 'herbarium', 'dry', 'drying', 'preserve', 'specimen'],
    answer:
      'Voucher specimens: photograph fresh material first, then dry it whole on low heat (around 40–50 °C) in a food dehydrator until brittle. ' +
      'Store in a sealed bag with the collection number and a silica packet, and deposit important collections in a recognised herbarium (find codes in Index Herbariorum).',
  },
  {
    topic: 'DNA barcoding',
    keywords: ['dna', 'barcode', 'its region', 'sequence', 'unite', 'genbank', 'pcr'],
    answer:
      'The nuclear ribosomal ITS region is the formal DNA barcode for fungi (Schoch et al. 2012, PNAS). Compare sequences against curated references in UNITE ' +
      'and GenBank, and record the voucher number with every sequence so the identification can be checked later.',
  },
];

export const FALLBACK_ANSWER =
  "I'm an offline keyword helper with short notes on: " +
  NOTES.map((n) => n.topic).join(', ') +
  '. Try asking about one of these. I cannot identify a mushroom from a description.';

// Match keywords at the start of a word, so "eat" matches "eating" but not "heat".
const matches = (q: string, keyword: string) =>
  new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(q);

export const findAnswer = (query: string): string => {
  const q = query.toLowerCase();
  if (SAFETY_KEYWORDS.some((k) => matches(q, k))) return SAFETY_ANSWER;
  let best: AssistantNote | null = null;
  let bestScore = 0;
  for (const note of NOTES) {
    const score = note.keywords.filter((k) => matches(q, k)).length;
    if (score > bestScore) {
      best = note;
      bestScore = score;
    }
  }
  return best ? best.answer : FALLBACK_ANSWER;
};
