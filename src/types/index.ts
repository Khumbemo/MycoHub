export type UserRole = 'COLLECTOR' | 'IDENTIFIER' | 'CURATOR' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  institutionalAffiliation?: string;
  specialization?: string[];
  orcidId?: string;
  avatarUrl?: string;
  joinedAt: Date;
}

export type TrophicMode = 'SAPROTROPHIC' | 'ECTOMYCORRHIZAL' | 'PARASITIC' | 'ENDOPHYTIC' | 'LICHENIZED';
export type SubstrateType = 'DEAD_WOOD' | 'LIVING_WOOD' | 'SOIL' | 'DUNG' | 'LITTER' | 'OTHER_FUNGUS' | 'INVERTEBRATE';
export type HabitatType = 'BROADLEAF_WOODLAND' | 'CONIFEROUS_FOREST' | 'GRASSLAND' | 'HEATH' | 'WETLAND' | 'URBAN';
export type VerificationStatus = 'UNVERIFIED' | 'COMMUNITY_GRADE' | 'RESEARCH_GRADE' | 'FLAGGED';
export interface Species {
  id: string;
  scientificName: string;
  authorCitation: string;
  commonName?: string;
  taxonomy: {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
  };
  synonyms: string[];
  nomenclaturalStatus: 'VALID' | 'INVALID' | 'ILLEGITIMATE';
  typeSpecimenInfo?: string;
  description?: string;
  distribution?: string[];
  uniteHypothesis?: string;
}

export type IdentificationConfidence = 'CERTAIN' | 'PROBABLE' | 'POSSIBLE' | 'GENUS_ONLY';

export type MelzersReaction = 'AMYLOID' | 'DEXTRINOID' | 'INAMYLOID' | 'NOT_TESTED';
export type ClampConnections = 'PRESENT' | 'ABSENT' | 'RARE' | 'NOT_SEEN';

/** Result of matching a name against the GBIF Backbone Taxonomy. */
export interface TaxonMatch {
  taxonKey: number;
  matchedName: string;        // scientific name with authorship, as GBIF returns it
  acceptedName: string;       // accepted name (differs from matchedName for synonyms)
  rank: string;
  status: string;             // ACCEPTED, SYNONYM, DOUBTFUL…
  matchType: 'EXACT' | 'FUZZY' | 'HIGHERRANK';
  confidence: number;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
}

/** One person's identification of a record. Each user has at most one. */
export interface Identification {
  userId: string;
  userName: string;
  role: UserRole;
  taxon: string;
  comment?: string;
  createdAt: string;          // ISO 8601
  pending?: boolean;          // not yet sent to the server
}

/**
 * A field record: the Darwin Core occurrence the entry form captures plus
 * sync bookkeeping. Stored locally first (IndexedDB), synced to Firestore.
 */
export interface FieldRecord {
  id: string;                 // local ID, also the Storage folder name
  userId: string;
  collectorName: string;
  collectionNumber: string;
  timestamp: string;          // ISO 8601 (DwC eventDate)
  status: VerificationStatus;
  consensusTaxon?: string;

  locality: string;
  latitude: number | null;    // decimal degrees, WGS84
  longitude: number | null;
  coordinateUncertaintyInMeters: number | null;

  scientificName: string;
  identificationConfidence: IdentificationConfidence;
  taxonomy?: TaxonMatch;
  identifications: Identification[];

  capDiameterMm: string;
  capShape: string;
  capColor: string;
  hymeniumType: string;
  gillSpacing: string;
  attachment: string;

  odor: string;
  bruising: string;
  koh: string;
  feso4: string;
  taste: string;

  sporePrintColor: string;
  sporeMeasurements: string;  // raw "L x W" pairs in µm
  melzers: MelzersReaction;
  clampConnections: ClampConnections;

  trophicMode: TrophicMode;
  substrate: SubstrateType;
  hostSpecies: string;
  habitatType: HabitatType;

  preserved: boolean;
  dnaExtracted: boolean;
  herbariumCode: string;
  accessionNumber: string;

  photos: Blob[];
  mediaUrls: string[];

  // Sync bookkeeping
  updatedAt: string;          // ISO 8601, local edit time
  synced: boolean;            // has a server copy
  remoteId?: string;
  dirty: boolean;             // content changed since last push
  statusDirty: boolean;       // manual status change waiting to push
  syncAttempts: number;
  nextSyncAt: number;         // epoch ms; earliest next retry
  syncError?: string;
}

/** A server copy to delete once we're online. */
export interface PendingDeletion {
  remoteId: string;
  userId: string;
  localId: string;
  photoCount: number;
}
