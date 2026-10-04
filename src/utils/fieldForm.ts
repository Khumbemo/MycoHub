import type { HabitatType, IdentificationConfidence, SubstrateType, TrophicMode } from '../types';

export const localDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const emptyForm = (collectorName: string) => ({
  collectorName,
  collectionNumber: '',
  locality: '',
  latitude: '',
  longitude: '',
  eventDate: localDateString(new Date()),
  scientificName: '',
  identificationConfidence: 'PROBABLE' as IdentificationConfidence,
  capDiameterMm: '',
  capShape: '',
  capColor: '',
  hymeniumType: 'Gills',
  gillSpacing: 'Close',
  attachment: '',
  odor: '',
  bruising: '',
  koh: '',
  feso4: '',
  taste: '',
  trophicMode: 'SAPROTROPHIC' as TrophicMode,
  substrate: 'DEAD_WOOD' as SubstrateType,
  hostSpecies: '',
  habitatType: 'BROADLEAF_WOODLAND' as HabitatType,
  preserved: false,
  dnaExtracted: false,
  herbariumCode: '',
  accessionNumber: '',
});

export type FormState = ReturnType<typeof emptyForm>;
export type Errors = Partial<Record<keyof FormState, string>>;

export const parseCoord = (raw: string, limit: number): number | null | undefined => {
  if (!raw.trim()) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || Math.abs(n) > limit) return undefined;
  return n;
};

export const validate = (f: FormState): Errors => {
  const e: Errors = {};
  if (!f.collectorName.trim()) e.collectorName = 'Required';
  if (!f.collectionNumber.trim()) e.collectionNumber = 'Required';
  if (!f.scientificName.trim()) e.scientificName = 'Enter a name, or a genus with "sp."';
  if (parseCoord(f.latitude, 90) === undefined) e.latitude = 'Decimal degrees, −90 to 90';
  if (parseCoord(f.longitude, 180) === undefined) e.longitude = 'Decimal degrees, −180 to 180';
  if (!f.eventDate) e.eventDate = 'Required';
  return e;
};
