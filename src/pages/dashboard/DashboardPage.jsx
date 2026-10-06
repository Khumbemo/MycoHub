import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, MapPin, Clock, CheckCircle, CloudOff, PlusSquare, Leaf, Camera } from 'lucide-react';
import { useLocalRecords, formatRelative, displayStatus } from '../../utils/observations';
import { STATUS_STYLE } from '../../components/StatusBadge';

// Leaflet is only downloaded when the dashboard has something to map.
const RecordMap = lazy(() => import('../../components/RecordMap'));

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
    <span className="text-2xl font-black text-gray-800 tabular-nums">{value}</span>
  </div>
);

const DashboardPage = () => {
  const records = useLocalRecords();
  const list = records ?? [];

  const statuses = list.map(displayStatus);
  const verified = statuses.filter((s) => s === 'RESEARCH_GRADE' || s === 'COMMUNITY_GRADE').length;
  const pending = statuses.filter((s) => s === 'UNVERIFIED').length;
  const unsynced = list.filter((r) => !r.synced || r.dirty).length;
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
          <Link to="/community" className="text-emerald-600 font-bold text-xs uppercase tracking-widest">
            View All
          </Link>
        </div>
        {records && list.length === 0 ? (
          <div className="text-center py-6">
            <Leaf className="w-8 h-8 text-emerald-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500 mb-4">
              No records yet. Your saved collections will appear here.
            </p>
            <Link
              to="/entry"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            >
              <PlusSquare className="w-4 h-4" /> Add first record
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {list.slice(0, 5).map((r) => (
              <Link key={r.id} to={`/record/${r.id}`} className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  {r.photos.length ? (
                    <span className="text-emerald-700 font-black text-[10px] flex items-center gap-0.5">
                      <Camera className="w-3 h-3" />
                      {r.photos.length}
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-black text-[10px]">
                      {r.scientificName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold italic text-gray-800 text-sm truncate">{r.scientificName}</h4>
                  <p className="text-[10px] text-gray-500 font-medium truncate">
                    {r.collectionNumber} • {r.locality || 'No locality'} • {formatRelative(r.timestamp)}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight flex-shrink-0 ${STATUS_STYLE[displayStatus(r)].className}`}
                >
                  {STATUS_STYLE[displayStatus(r)].label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm mb-1">Georeferenced Records</h3>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
          {geo.length} of {list.length} have WGS84 coordinates
        </p>
        {geo.length > 0 && (
          <Suspense fallback={<div className="h-64 rounded-2xl bg-gray-100" />}>
            <RecordMap records={geo} />
          </Suspense>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
