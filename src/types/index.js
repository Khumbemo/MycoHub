// MycoHub data model, documented with JSDoc so editors can offer hints.
// This module has no runtime code.

/** @typedef {'COLLECTOR' | 'IDENTIFIER' | 'CURATOR' | 'ADMIN'} UserRole */
/** @typedef {'UNVERIFIED' | 'COMMUNITY_GRADE' | 'RESEARCH_GRADE' | 'FLAGGED'} VerificationStatus */
/** @typedef {'SAPROTROPHIC' | 'ECTOMYCORRHIZAL' | 'PARASITIC' | 'ENDOPHYTIC' | 'LICHENIZED'} TrophicMode */
/** @typedef {'DEAD_WOOD' | 'LIVING_WOOD' | 'SOIL' | 'DUNG' | 'LITTER' | 'OTHER_FUNGUS' | 'INVERTEBRATE'} SubstrateType */
/** @typedef {'BROADLEAF_WOODLAND' | 'CONIFEROUS_FOREST' | 'GRASSLAND' | 'HEATH' | 'WETLAND' | 'URBAN'} HabitatType */
/** @typedef {'CERTAIN' | 'PROBABLE' | 'POSSIBLE' | 'GENUS_ONLY'} IdentificationConfidence */
/** @typedef {'AMYLOID' | 'DEXTRINOID' | 'INAMYLOID' | 'NOT_TESTED'} MelzersReaction */
/** @typedef {'PRESENT' | 'ABSENT' | 'RARE' | 'NOT_SEEN'} ClampConnections */

/**
 * @typedef {object} UserProfile
 * @property {string} id
 * @property {string} email
 * @property {string} displayName
 * @property {UserRole} role             Effective role, from the ID token's custom claims
 * @property {string} [institutionalAffiliation]
 * @property {string[]} [specialization]
 * @property {string} [orcidId]
 * @property {string} [avatarUrl]
 * @property {Date} joinedAt
 */

/**
 * Taxonomy reference entry (src/data/species.js).
 * @typedef {object} Species
 * @property {string} id
 * @property {string} scientificName
 * @property {string} authorCitation
 * @property {string} [commonName]
 * @property {{kingdom: string, phylum: string, class: string, order: string, family: string, genus: string}} taxonomy
 * @property {string[]} synonyms
 * @property {'VALID' | 'INVALID' | 'ILLEGITIMATE'} nomenclaturalStatus
 */

/**
 * Result of matching a name against the GBIF Backbone Taxonomy.
 * @typedef {object} TaxonMatch
 * @property {number} taxonKey
 * @property {string} matchedName       Scientific name with authorship, as GBIF returns it
 * @property {string} acceptedName      Accepted name (differs from matchedName for synonyms)
 * @property {string} rank
 * @property {string} status            ACCEPTED, SYNONYM, DOUBTFUL…
 * @property {'EXACT' | 'FUZZY' | 'HIGHERRANK'} matchType
 * @property {number} confidence
 * @property {string} [kingdom]
 * @property {string} [phylum]
 * @property {string} [class]
 * @property {string} [order]
 * @property {string} [family]
 * @property {string} [genus]
 */

/**
 * One person's identification of a record. Each user has at most one.
 * @typedef {object} Identification
 * @property {string} userId
 * @property {string} userName
 * @property {UserRole} role
 * @property {string} taxon
 * @property {string} [comment]
 * @property {string} createdAt         ISO 8601
 * @property {boolean} [pending]        Not yet sent to the server
 */

/**
 * A field record: the Darwin Core occurrence the entry form captures plus sync
 * bookkeeping. Stored locally first (IndexedDB), synced to Firestore.
 * @typedef {object} FieldRecord
 * @property {string} id                Local ID, also the Storage folder name
 * @property {string} userId
 * @property {string} collectorName     DwC recordedBy
 * @property {string} collectionNumber  DwC recordNumber
 * @property {string} timestamp         ISO 8601 (DwC eventDate)
 * @property {VerificationStatus} status
 * @property {string} [consensusTaxon]
 * @property {string} locality
 * @property {number | null} latitude   Decimal degrees, WGS84
 * @property {number | null} longitude
 * @property {number | null} coordinateUncertaintyInMeters
 * @property {string} scientificName
 * @property {IdentificationConfidence} identificationConfidence
 * @property {TaxonMatch} [taxonomy]
 * @property {Identification[]} identifications
 * @property {string} capDiameterMm
 * @property {string} capShape
 * @property {string} capColor
 * @property {string} hymeniumType
 * @property {string} gillSpacing
 * @property {string} attachment
 * @property {string} odor
 * @property {string} bruising
 * @property {string} koh
 * @property {string} feso4
 * @property {string} taste
 * @property {string} sporePrintColor
 * @property {string} sporeMeasurements  Raw "L x W" pairs in µm
 * @property {MelzersReaction} melzers
 * @property {ClampConnections} clampConnections
 * @property {TrophicMode} trophicMode
 * @property {SubstrateType} substrate
 * @property {string} hostSpecies
 * @property {HabitatType} habitatType
 * @property {boolean} preserved
 * @property {boolean} dnaExtracted
 * @property {string} herbariumCode
 * @property {string} accessionNumber
 * @property {Blob[]} photos
 * @property {string[]} mediaUrls
 * @property {string} updatedAt         ISO 8601, local edit time
 * @property {boolean} synced           Has a server copy
 * @property {string} [remoteId]
 * @property {boolean} dirty            Content changed since last push
 * @property {boolean} statusDirty      Manual status change waiting to push
 * @property {number} syncAttempts
 * @property {number} nextSyncAt        Epoch ms; earliest next retry
 * @property {string} [syncError]
 */

/**
 * A server copy to delete once we're online.
 * @typedef {object} PendingDeletion
 * @property {string} remoteId
 * @property {string} userId
 * @property {string} localId
 * @property {number} photoCount
 */

export {};
