import type { VerificationStatus } from '../types';

export const STATUS_STYLE: Record<VerificationStatus, { label: string; className: string; dot: string; color: string }> = {
  UNVERIFIED: { label: 'Needs ID', className: 'bg-amber-50 text-amber-800', dot: 'bg-amber-400', color: '#d97706' },
  COMMUNITY_GRADE: { label: 'Community grade', className: 'bg-teal-50 text-teal-800', dot: 'bg-teal-500', color: '#0d9488' },
  RESEARCH_GRADE: { label: 'Research grade', className: 'bg-emerald-600 text-white', dot: 'bg-emerald-500', color: '#059669' },
  FLAGGED: { label: 'Flagged', className: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', color: '#e11d48' },
};
