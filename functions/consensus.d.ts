import type { UserRole, VerificationStatus } from '../src/types';

export interface ConsensusInput {
  ownerId: string;
  ownerRole?: UserRole;
  ownerTaxon: string;
  hasDate: boolean;
  hasCoordinates: boolean;
  identifications?: { userId: string; role?: UserRole; taxon: string }[];
}

export interface ConsensusResult {
  status: Exclude<VerificationStatus, 'FLAGGED'>;
  taxon: string | null;
  votes: number;
  agreeing: number;
  disputed: boolean;
}

export function normalizeTaxon(name: string | null | undefined): string;
export function computeConsensus(input: ConsensusInput): ConsensusResult;
