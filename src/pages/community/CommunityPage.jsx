import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Leaf, CloudOff, Cloud, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { addIdentification, displayStatus, formatRelative, useLocalRecords } from '../../utils/observations';
import { recordConsensus } from '../../utils/consensus';
import { STATUS_STYLE } from '../../components/StatusBadge';

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'UNVERIFIED', label: 'Needs ID' },
  { key: 'COMMUNITY_GRADE', label: 'Community' },
  { key: 'RESEARCH_GRADE', label: 'Research' },
  { key: 'FLAGGED', label: 'Flagged' },
];

const VerificationTicket = ({ record }) => {
  const { user } = useAuth();
  const status = displayStatus(record);
  const style = STATUS_STYLE[status];
  const consensus = recordConsensus(record);
  const leading = consensus.taxon ?? record.scientificName;
  const mine = record.identifications.find((i) => i.userId === user?.id);
  const agreed = mine && mine.taxon.trim().toLowerCase() === leading.trim().toLowerCase();

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
      <Link to={`/record/${record.id}`} className="flex justify-between items-start gap-3 mb-4">
        <div className="min-w-0">
          <h4 className="font-black italic text-gray-800 leading-tight truncate">{record.scientificName}</h4>
          <p className="text-[11px] font-bold text-gray-500 mt-1">
            {record.collectionNumber} · {record.collectorName} · {formatRelative(record.timestamp)}
          </p>
        </div>
        <span className="flex items-center gap-1 flex-shrink-0">
          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${style.className}`}>
            {style.label}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </span>
      </Link>

      <div className="bg-gray-50/70 p-4 rounded-2xl mb-4 grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-600">
        <span>
          {consensus.votes} vote{consensus.votes === 1 ? '' : 's'}
          {consensus.disputed ? ' · disputed' : ''}
        </span>
        <span>Hymenium: {record.hymeniumType || '—'}</span>
        <span className="truncate">Locality: {record.locality || '—'}</span>
        <span className="flex items-center gap-1">
          {record.synced && !record.dirty ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
          {record.synced && !record.dirty ? 'Synced' : 'Device only'}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => user && addIdentification(record, user, leading)}
          disabled={!user || agreed}
          className="flex-1 bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none text-white p-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <CheckCircle2 className="w-4 h-4" />
          {agreed ? 'Agreed' : 'Agree'}
        </button>
        <Link
          to={`/record/${record.id}`}
          className="flex-1 bg-white border border-gray-100 text-gray-600 p-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
        >
          Suggest ID
        </Link>
      </div>
    </div>
  );
};

const CommunityPage = () => {
  const { hasRole } = useAuth();
  const records = useLocalRecords();
  const [filter, setFilter] = useState('ALL');
  const list = records ?? [];
  const withStatus = list.map((r) => ({ r, status: displayStatus(r) }));
  const shown = filter === 'ALL' ? withStatus : withStatus.filter((x) => x.status === filter);
  const count = (s) => withStatus.filter((x) => x.status === s).length;

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Verification Pipeline</h2>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">
          Identifications decide the status, one vote per person
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {['UNVERIFIED', 'COMMUNITY_GRADE', 'RESEARCH_GRADE'].map((s) => (
          <div
            key={s}
            className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col items-center text-center"
          >
            <span className="text-2xl font-black text-gray-800 tabular-nums">{count(s)}</span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wide mt-1 leading-tight">
              {STATUS_STYLE[s].label}
            </span>
          </div>
        ))}
      </div>

      <p className="mb-6 flex items-start gap-2 bg-blue-50 text-blue-800 p-4 rounded-2xl text-[11px] font-bold leading-snug">
        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        {hasRole('IDENTIFIER')
          ? 'Your identifications count toward research grade.'
          : 'Anyone can identify. Research grade also needs agreement from someone with the Identifier role.'}
      </p>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest flex-shrink-0 ${
              filter === f.key ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {shown.map(({ r }) => (
          <VerificationTicket key={r.id} record={r} />
        ))}
        {records && shown.length === 0 && (
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 text-center">
            <Leaf className="w-8 h-8 text-emerald-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-600 mb-4">
              {list.length === 0 ? 'No records to review yet.' : 'No records match this filter.'}
            </p>
            {list.length === 0 && (
              <Link
                to="/entry"
                className="inline-block bg-emerald-600 text-white px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest"
              >
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
