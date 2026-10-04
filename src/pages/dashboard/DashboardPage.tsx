import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, MapPin, Clock, CheckCircle, CloudOff, PlusSquare, Leaf, Camera } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocalRecords, formatRelative } from '../../utils/observations';

const StatCard: React.FC<{ icon: LucideIcon; label: string; value: string | number; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-2xl font-black text-gray-800 tabular-nums">{value}</span>
  </div>
);

const statusDot: Record<string, string> = {
  UNVERIFIED: 'bg-amber-400',
  COMMUNITY_GRADE: 'bg-teal-500',
  RESEARCH_GRADE: 'bg-emerald-500',
  FLAGGED: 'bg-rose-500',
};

const DashboardPage: React.FC = () => {
  const records = useLocalRecords();
  const list = records ?? [];

  const verified = list.filter((r) => r.status === 'RESEARCH_GRADE' || r.status === 'COMMUNITY_GRADE').length;
  const pending = list.filter((r) => r.status === 'UNVERIFIED').length;
  const unsynced = list.filter((r) => !r.synced).length;
  const sites = new Set(list.map((r) => r.locality.trim().toLowerCase()).filter(Boolean)).size;
  const geo = list.filter((r) => r.latitude !== null && r.longitude !== null);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <section>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-4">Field Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={TrendingUp} label="Total Obs" value={records ? list.length : '…'} color="bg-emerald-500" />
          <StatCard icon={CheckCircle} label="Verified" value={records ? verified : '…'} color="bg-teal-500" />
          <StatCard icon={MapPin} label="Sites" value={records ? sites : '…'} color="bg-cyan-500" />
          <StatCard icon={Clock} label="Pending" value={records ? pending : '…'} color="bg-amber-500" />
        </div>
        {unsynced > 0 && (
          <p className="mt-4 flex items-center gap-2 text-[10px] font-black text-amber-700 bg-amber-50 rounded-2xl p-3 uppercase tracking-widest">
            <CloudOff className="w-4 h-4" /> {unsynced} record{unsynced === 1 ? '' : 's'} stored on this device only
          </p>
        )}
      </section>

      <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm">Recent Records</h3>
          <Link to="/community" className="text-emerald-600 font-bold text-xs uppercase tracking-widest">View All</Link>
        </div>
        {records && list.length === 0 ? (
          <div className="text-center py-6">
            <Leaf className="w-8 h-8 text-emerald-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500 mb-4">No records yet. Your saved collections will appear here.</p>
            <Link to="/entry" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">
              <PlusSquare className="w-4 h-4" /> Add first record
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {list.slice(0, 5).map((r) => (
              <div key={r.id} className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  {r.photos.length ? (
                    <span className="text-emerald-700 font-black text-[10px] flex items-center gap-0.5"><Camera className="w-3 h-3" />{r.photos.length}</span>
                  ) : (
                    <span className="text-emerald-700 font-black text-[10px]">{r.scientificName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold italic text-gray-800 text-sm truncate">{r.scientificName}</h4>
                  <p className="text-[10px] text-gray-400 font-medium truncate">
                    {r.collectionNumber} • {r.locality || 'No locality'} • {formatRelative(r.timestamp)}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[r.status]}`} title={r.status.replace('_', ' ')} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm mb-1">Georeferenced Records</h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
          {geo.length} of {list.length} have WGS84 coordinates
        </p>
        <div className="space-y-2">
          {geo.slice(0, 5).map((r) => (
            <div key={r.id} className="flex justify-between gap-3 text-xs">
              <span className="font-bold italic text-gray-700 truncate">{r.scientificName}</span>
              <a
                className="font-mono text-emerald-700 flex-shrink-0 underline decoration-dotted"
                href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=14/${r.latitude}/${r.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                {r.latitude!.toFixed(4)}, {r.longitude!.toFixed(4)}
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
