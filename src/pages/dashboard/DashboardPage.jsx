import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, MapPin, Clock, CheckCircle, CloudOff, PlusSquare, Leaf, Camera } from 'lucide-react';
import { useLocalRecords, formatRelative, displayStatus } from '../../utils/observations';
import { STATUS_STYLE } from '../../components/StatusBadge';
import MushroomPlate from '../../components/MushroomPlate';
import { useAuth } from '../../contexts/AuthContext';
import { useBackground } from '../../utils/background';
import { cn } from '../../utils/cn';

// Leaflet is only downloaded when the dashboard has something to map.
const RecordMap = lazy(() => import('../../components/RecordMap'));

const StatCard = ({ icon: Icon, label, value }) => (
  <div
    role="group"
    aria-label={label}
    className="bg-white p-4 rounded-2xl border border-gray-200/80 flex flex-col gap-3"
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-gray-500 uppercase" aria-hidden="true">
        {label}
      </span>
      <Icon className="w-4 h-4 text-gray-500" aria-hidden="true" />
    </div>
    <span className="text-3xl text-ink tabular-nums leading-none">{value}</span>
  </div>
);

const greeting = (d) => {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

/** Opening panel: date, greeting, what needs attention, and the chosen background. */
const Hero = ({ pending, total }) => {
  const { user } = useAuth();
  const bg = useBackground();
  const onPhoto = bg.mode === 'photo' && bg.photoUrl;
  const now = new Date();
  const date = now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const name =
    user?.displayName && user.displayName !== 'Local Researcher' ? `, ${user.displayName.split(' ')[0]}` : '';

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border',
        onPhoto
          ? 'bg-ink border-transparent'
          : bg.mode === 'illustration' || bg.mode === 'mycelium'
            ? 'bg-emerald-50 border-emerald-100'
            : 'bg-white border-gray-200/80',
      )}
    >
      {onPhoto && (
        <>
          <img src={bg.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/10" />
        </>
      )}
      <div className="relative grid sm:grid-cols-[1fr_auto] items-center gap-4 p-6 sm:p-8">
        <div className="min-w-0">
          <p className={cn('text-[11px] uppercase mb-2', onPhoto ? 'text-emerald-100' : 'text-emerald-700')}>{date}</p>
          <h2 className={cn('text-3xl sm:text-4xl leading-tight mb-2', onPhoto ? 'text-white' : 'text-ink')}>
            Field Overview
          </h2>
          <p className={cn('text-[15px] leading-snug max-w-md', onPhoto ? 'text-white/85' : 'text-gray-600')}>
            {greeting(now)}
            {name}.{' '}
            {total === 0
              ? 'Start your first collection record.'
              : pending > 0
                ? `${pending} record${pending === 1 ? '' : 's'} still need${pending === 1 ? 's' : ''} an identification.`
                : 'Every record has a verified identification.'}
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            <Link
              to="/entry"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs uppercase"
            >
              <PlusSquare className="w-4 h-4" /> New record
            </Link>
            <Link
              to="/community"
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs uppercase border',
                onPhoto
                  ? 'text-white border-white/40 hover:bg-white/10'
                  : 'text-ink border-gray-300 bg-white/70 hover:border-emerald-600',
              )}
            >
              Review IDs
            </Link>
          </div>
        </div>
        {(bg.mode === 'illustration' || bg.mode === 'mycelium') && (
          <MushroomPlate labels={false} caption={false} className="hidden sm:block w-48 lg:w-64 -my-6 -mr-2" />
        )}
      </div>
    </section>
  );
};

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
      <Hero pending={pending} total={list.length} />

      <section aria-label="Totals">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={TrendingUp} label="Total Obs" value={records ? list.length : '…'} />
          <StatCard icon={CheckCircle} label="Verified" value={records ? verified : '…'} />
          <StatCard icon={MapPin} label="Sites" value={records ? sites : '…'} />
          <StatCard icon={Clock} label="Pending" value={records ? pending : '…'} />
        </div>
        {unsynced > 0 && (
          <p className="mt-4 flex items-center gap-2 text-[10px] font-black text-amber-700 bg-amber-50 rounded-2xl p-3 uppercase tracking-widest">
            <CloudOff className="w-4 h-4" /> {unsynced} record{unsynced === 1 ? '' : 's'} stored on this device only
          </p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2 items-start">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
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

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
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
    </div>
  );
};

export default DashboardPage;
