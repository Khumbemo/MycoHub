import type { FieldRecord } from '../types';
import { computeConsensus, type ConsensusResult } from '../../functions/consensus.js';

export { computeConsensus, normalizeTaxon } from '../../functions/consensus.js';

/** Consensus for a local record, using its current identifications. */
export const recordConsensus = (r: FieldRecord): ConsensusResult =>
  computeConsensus({
    ownerId: r.userId,
    ownerTaxon: r.scientificName,
    hasDate: !!r.timestamp,
    hasCoordinates: r.latitude !== null && r.longitude !== null,
    identifications: r.identifications,
  });
