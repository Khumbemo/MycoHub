import { parseSporeMeasurements } from './microscopy';

export const localDateString = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const emptyForm = (collectorName) => ({
  collectorName,
  collectionNumber: '',
  locality: '',
  latitude: '',
  longitude: '',
  coordinateUncertainty: '',
  eventDate: localDateString(new Date()),
  scientificName: '',
  identificationConfidence: 'PROBABLE',
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
  sporePrintColor: '',
  sporeMeasurements: '',
  melzers: 'NOT_TESTED',
  clampConnections: 'NOT_SEEN',
  trophicMode: 'SAPROTROPHIC',
  substrate: 'DEAD_WOOD',
  hostSpecies: '',
  habitatType: 'BROADLEAF_WOODLAND',
  preserved: false,
  dnaExtracted: false,
  herbariumCode: '',
  accessionNumber: '',
});

export const parseCoord = (raw, limit) => {
  if (!raw.trim()) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || Math.abs(n) > limit) return undefined;
  return n;
};

/** Coordinate uncertainty in metres: blank, or a non-negative number up to Earth's half-circumference. */
export const parseUncertainty = (raw) => {
  if (!raw.trim()) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 20_037_509) return undefined;
  return n;
};

export const validate = (f) => {
  const e = {};
  if (!f.collectorName.trim()) e.collectorName = 'Required';
  if (!f.collectionNumber.trim()) e.collectionNumber = 'Required';
  if (!f.scientificName.trim()) e.scientificName = 'Enter a name, or a genus with "sp."';
  if (parseCoord(f.latitude, 90) === undefined) e.latitude = 'Decimal degrees, −90 to 90';
  if (parseCoord(f.longitude, 180) === undefined) e.longitude = 'Decimal degrees, −180 to 180';
  if (parseUncertainty(f.coordinateUncertainty) === undefined) e.coordinateUncertainty = 'Metres, 0 or more';
  if (!f.eventDate) e.eventDate = 'Required';
  if (f.sporeMeasurements.trim() && parseSporeMeasurements(f.sporeMeasurements).invalid.length > 0) {
    e.sporeMeasurements = 'Use length × width pairs in µm, e.g. 9.5 x 7, 10 x 7.5';
  }
  return e;
};

/** Form values → record fields (everything but identity, photos and sync bookkeeping). */
export const formToFields = (f) => {
  const { eventDate, latitude, longitude, coordinateUncertainty, ...rest } = f;
  return {
    ...rest,
    collectorName: rest.collectorName.trim(),
    collectionNumber: rest.collectionNumber.trim(),
    scientificName: rest.scientificName.trim().replace(/\s+/g, ' '),
    // Local noon, so the calendar date survives any time-zone conversion.
    timestamp: new Date(eventDate + 'T12:00:00').toISOString(),
    latitude: parseCoord(latitude, 90) ?? null,
    longitude: parseCoord(longitude, 180) ?? null,
    coordinateUncertaintyInMeters: parseUncertainty(coordinateUncertainty) ?? null,
  };
};

/** Record → form values, for editing. */
export const recordToForm = (r) => ({
  ...emptyForm(r.collectorName),
  collectionNumber: r.collectionNumber,
  locality: r.locality,
  latitude: r.latitude === null ? '' : String(r.latitude),
  longitude: r.longitude === null ? '' : String(r.longitude),
  coordinateUncertainty: r.coordinateUncertaintyInMeters === null ? '' : String(r.coordinateUncertaintyInMeters),
  eventDate: localDateString(new Date(r.timestamp)),
  scientificName: r.scientificName,
  identificationConfidence: r.identificationConfidence,
  capDiameterMm: r.capDiameterMm,
  capShape: r.capShape,
  capColor: r.capColor,
  hymeniumType: r.hymeniumType,
  gillSpacing: r.gillSpacing,
  attachment: r.attachment,
  odor: r.odor,
  bruising: r.bruising,
  koh: r.koh,
  feso4: r.feso4,
  taste: r.taste,
  sporePrintColor: r.sporePrintColor,
  sporeMeasurements: r.sporeMeasurements,
  melzers: r.melzers,
  clampConnections: r.clampConnections,
  trophicMode: r.trophicMode,
  substrate: r.substrate,
  hostSpecies: r.hostSpecies,
  habitatType: r.habitatType,
  preserved: r.preserved,
  dnaExtracted: r.dnaExtracted,
  herbariumCode: r.herbariumCode,
  accessionNumber: r.accessionNumber,
});
