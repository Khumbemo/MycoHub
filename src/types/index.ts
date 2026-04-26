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
export type AbundanceEstimate = 'SINGLE' | 'SCATTERED' | 'GREGARIOUS' | 'CLUSTERED';
export type PhenologyStage = 'IMMATURE' | 'MATURE' | 'SENESCENT';
export type PreservationMethod = 'AIR_DRIED' | 'LYOPHILIZED' | 'ALCOHOL' | 'FROZEN';
export type VerificationStatus = 'UNVERIFIED' | 'COMMUNITY_GRADE' | 'RESEARCH_GRADE' | 'FLAGGED';

export interface VerificationLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: Date;
  suggestedSpeciesId?: string;
  suggestedName?: string;
  confidence: 'CERTAIN' | 'PROBABLE' | 'POSSIBLE' | 'GENUS_ONLY';
  comment?: string;
  isAgreed: boolean;
}

export interface Observation {
  id: string;
  userId: string;
  collectorName: string;
  collectionNumber: string; // Unique per collector
  timestamp: Date;
  status: VerificationStatus;

  // Geospatial (DwC compliant)
  location: {
    latitude: number;
    longitude: number;
    altitudeMetres: number;
    localityDescription: string;
    country: string;
    region: string;
    siteName: string;
  };

  // Taxonomy
  taxonomy: {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
    authorCitation?: string;
    infraspecificRank?: string;
    identificationConfidence: 'CERTAIN' | 'PROBABLE' | 'POSSIBLE' | 'GENUS_ONLY';
  };

  // Morphology - The bulk
  morphology: {
    pileus: {
      diameterRangeMm: [number, number];
      shape: string; // convex/umbonate/etc
      color: string; // Munsell/Kornerup
      texture: string;
      margin: string;
    };
    hymenium: {
      type: 'GILLS' | 'PORES' | 'TEETH' | 'SPINES' | 'SMOOTH' | 'RIDGED';
      color: string;
      spacing: 'CROWDED' | 'CLOSE' | 'SUBDISTANT' | 'DISTANT';
      attachment: string;
    };
    stipe: {
      present: boolean;
      dimensionsMm: { height: number; diameter: number };
      shape: string;
      texture: string;
      color: string;
      fleshConsistency: 'HOLLOW' | 'STUFFED' | 'SOLID';
      baseMorphology: string;
    };
    flesh: {
      colorAtCut: string;
      bruisingReaction: {
        color: string;
        timing: 'IMMEDIATE' | 'DELAYED' | 'NONE';
      };
      texture: string;
      odor: string;
      taste: string; // Includes safety disclaimer
    };
    sporePrintColor: string;
    chemicalTests: {
      koh?: string;
      feso4?: string;
      melzers: 'AMYLOID' | 'DEXTRINOID' | 'INAMYLOID' | 'NONE';
      ammonia?: string;
      phenol?: string;
    };
  };

  // Microscopy
  microscopy?: {
    spores: {
      dimensionsUm: { length: number; width: number };
      ornamentation: string;
      wallThickness: string;
      colorInWater?: string;
      colorInKoh?: string;
      colorInMelzers?: string;
    };
    basidia: {
      dimensionsUm: { length: number; width: number };
      sterigmataCount: number;
    };
    cystidia?: string;
    clampConnections: 'PRESENT' | 'ABSENT' | 'RARE';
    pileipellisStructure: string;
  };

  // Ecology
  ecology: {
    trophicMode: TrophicMode;
    substrate: SubstrateType;
    substrateDetail?: string;
    hostSpecies?: string;
    habitatType: HabitatType;
    associatedPlants?: string[];
    abundance: AbundanceEstimate;
    phenology: PhenologyStage;
  };

  // Voucher
  voucher: {
    preserved: boolean;
    method?: PreservationMethod;
    herbariumCode?: string; // e.g. K, NY
    accessionNumber?: string;
    dnaExtracted: boolean;
    genbankAccession?: string;
    uniteMatch?: string;
  };

  media: {
    url: string;
    type: 'HABITAT' | 'PILEUS_TOP' | 'HYMENIUM' | 'STIPE' | 'CROSS_SECTION' | 'SPORE_PRINT' | 'SCALE_BAR' | 'MICROSCOPY';
    exifData?: any;
  }[];

  verificationLog: VerificationLogEntry[];
  isPoisonous?: boolean; // Triggers UI safety layer
}

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
