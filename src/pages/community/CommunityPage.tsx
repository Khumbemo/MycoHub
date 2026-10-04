import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertOctagon, Leaf, CloudOff, Cloud } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { localDb } from '../../utils/db';
import { useLocalRecords, formatRelative } from '../../utils/observations';
import type { FieldRecord, VerificationStatus } from '../../types';

const STATUS_STYLE: Record<VerificationStatus, { label: string; className: string }> = {
  UNVERIFIED: { label: 'Needs ID review', className: 'bg-amber-50 text-amber-700' },
  COMMUNITY_GRADE: { label: 'Community grade', className: 'bg-teal-50 text-teal-700' },
  RESEARCH_GRADE: { label: 'Research grade', className: 'bg-emerald-500 text-white' },
  FLAGGED: { label: 'Flagged', className: 'bg-rose-50 text-rose-700' },
};

const FILTERS: { key: 'ALL' | VerificationStatus; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'UNVERIFIED', label: 'Pending' },
  { key: 'RESEARCH_GRADE', label: 'Verified' },
  { key: 'FLAGGED', label: 'Flagged' },
];

const VerificationTicket: React.FC<{ record: FieldRecord; canVerify: boolean }> = ({ record, canVerify }) => {
  const style = STATUS_STYLE[record.status];
  const setStatus = (status: VerificationStatus) => localDb.observations.update(record.id, { status });

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="min-w-0">
          <h4 className="font-black italic text-gray-800 leading-tight truncate">{record.scientificName}</h4>
          <p className="text-[10px] font-bold text-gray-400 mt-1">
            {record.collectionNumber} · {record.collectorName} · {formatRelative(record.timestamp)}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter flex-shrink-0 ${style.className}`}>{style.label}</span>
      </div>

      <div className="bg-gray-50/70 p-4 rounded-2xl mb-4 grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-600">
        <span>Confidence: {record.identificationConfidence.replace('_', ' ').toLowerCase()}</span>
        <span>Hymenium: {record.hymeniumType}</span>
        <span className="truncate">Locality: {record.locality || '—'}</span>
        <span className="flex items-center gap-1">
          {record.synced ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
          {record.synced ? 'Synced' : 'Device only'}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setStatus('RESEARCH_GRADE')}
          disabled={!canVerify || record.status === 'RESEARCH_GRADE'}
          title={canVerify ? 'Confirm this identification' : 'Requires the Identifier role'}
          className="flex-1 bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none text-white p-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <CheckCircle2 className="w-4 h-4" />
          Confirm ID
        </button>
        <button
          onClick={() => setStatus(record.status === 'FLAGGED' ? 'UNVERIFIED' : 'FLAGGED')}
          className="flex-1 bg-white border border-gray-100 text-gray-500 p-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <AlertOctagon className="w-4 h-4" />
          {record.status === 'FLAGGED' ? 'Unflag' : 'Flag'}
        </button>
      </div>
    </div>
  );
};

const CommunityPage: React.FC = () => {
  const { hasRole } = useAuth();
  const records = useLocalRecords();
  const [filter, setFilter] = useState<'ALL' | VerificationStatus>('ALL');
  const list = records ?? [];
  const shown = filter === 'ALL' ? list : list.filter((r) => r.status === filter);
  const canVerify = hasRole('IDENTIFIER');

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Verification Pipeline</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Review identifications before they count as research grade</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
          <span className="text-2xl font-black text-amber-600 tabular-nums">{list.filter((r) => r.status === 'UNVERIFIED').length}</span>
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Pending Review</span>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
          <span className="text-2xl font-black text-emerald-600 tabular-nums">{list.filter((r) => r.status === 'RESEARCH_GRADE').length}</span>
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Research Grade</span>
        </div>
      </div>

      {!canVerify && (
        <p className="mb-6 flex items-start gap-2 bg-blue-50 text-blue-700 p-4 rounded-2xl text-[10px] font-bold leading-snug">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          Confirming an ID requires the Identifier role. Collectors can flag records for a second look.
        </p>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${
              filter === f.key ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 border border-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {shown.map((r) => <VerificationTicket key={r.id} record={r} canVerify={canVerify} />)}
        {records && shown.length === 0 && (
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 text-center">
            <Leaf className="w-8 h-8 text-emerald-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500 mb-4">
              {list.length === 0 ? 'No records to review yet.' : 'No records match this filter.'}
            </p>
            {list.length === 0 && (
              <Link to="/entry" className="inline-block bg-emerald-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                Add a record
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
