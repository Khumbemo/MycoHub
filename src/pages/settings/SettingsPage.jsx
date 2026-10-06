import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Download, RefreshCw, UserCircle2, CloudOff, Trash2, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { localDb } from '../../utils/db';
import { useLocalRecords } from '../../utils/observations';
import { syncNow, useSyncState } from '../../utils/sync';
import { getThemePref, setThemePref } from '../../utils/theme';
import { toCsv } from '../../utils/dwc';

const SettingsPage = () => {
  const { user, isOffline, logout } = useAuth();
  const navigate = useNavigate();
  const records = useLocalRecords() ?? [];
  const [message, setMessage] = useState(null);
  const sync = useSyncState();
  const [confirmClear, setConfirmClear] = useState(false);
  const [theme, setTheme] = useState(getThemePref);

  const unsynced = records.filter(
    (r) => !r.synced || r.dirty || r.statusDirty || r.identifications.some((i) => i.pending),
  );
  const errored = records.filter((r) => r.syncError);

  const handleSync = async () => {
    const report = await syncNow();
    if (report.skipped) {
      setMessage(
        isOffline
          ? 'Sign in with an account to sync. Offline records stay on this device.'
          : report.skipped === 'error'
            ? 'Sync failed. Check your connection.'
            : report.skipped,
      );
      return;
    }
    setMessage(
      `Uploaded ${report.pushed}, downloaded ${report.pulled}` +
        (report.failed ? `, ${report.failed} failed and will retry automatically.` : '.'),
    );
  };

  const chooseTheme = (t) => {
    setTheme(t);
    setThemePref(t);
  };

  const handleExport = () => {
    const blob = new Blob([toCsv(records)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mycohub-occurrences-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`Exported ${records.length} record${records.length === 1 ? '' : 's'} as Darwin Core CSV.`);
  };

  const handleClear = async () => {
    await localDb.observations.clear();
    setConfirmClear(false);
    setMessage('Local records deleted.');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const rowBtn =
    'w-full bg-white p-5 rounded-[2rem] border border-gray-100 flex items-center gap-4 text-left disabled:opacity-50';

  return (
    <div className="pb-12 space-y-4">
      <section className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <UserCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <h2 className="font-black text-gray-800 text-lg leading-tight truncate">{user?.displayName}</h2>
          <p className="text-xs font-bold text-gray-500 truncate">{user?.email || 'No email on this account'}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700">
              {user?.role}
            </span>
            {isOffline && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 flex items-center gap-1">
                <CloudOff className="w-3 h-3" /> Offline session
              </span>
            )}
          </div>
        </div>
      </section>

      {message && (
        <p role="status" className="bg-emerald-50 text-emerald-700 text-xs font-bold p-4 rounded-2xl">
          {message}
        </p>
      )}

      <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2 pt-2">Data</h3>

      <button onClick={handleSync} disabled={sync.running} className={rowBtn}>
        <RefreshCw className={`w-5 h-5 text-blue-600 ${sync.running ? 'animate-spin' : ''}`} />
        <div>
          <span className="block font-black text-gray-800 text-sm">{sync.running ? 'Syncing…' : 'Sync now'}</span>
          <span className="text-[11px] font-bold text-gray-500">
            {unsynced.length} change{unsynced.length === 1 ? '' : 's'} waiting
            {sync.lastSyncedAt ? ` · last synced ${new Date(sync.lastSyncedAt).toLocaleTimeString()}` : ''}
            {' · syncs automatically when online'}
          </span>
        </div>
      </button>
      {errored.length > 0 && (
        <p className="bg-amber-50 text-amber-800 text-[11px] font-bold p-4 rounded-2xl">
          {errored.length} record{errored.length === 1 ? '' : 's'} had sync problems: {errored[0].syncError}
        </p>
      )}

      <button onClick={handleExport} disabled={records.length === 0} className={rowBtn}>
        <Download className="w-5 h-5 text-emerald-600" />
        <div>
          <span className="block font-black text-gray-800 text-sm">Export Darwin Core CSV</span>
          <span className="text-[10px] font-bold text-gray-500">
            occurrenceID, scientificName, eventDate, decimalLatitude…
          </span>
        </div>
      </button>

      {!confirmClear ? (
        <button onClick={() => setConfirmClear(true)} disabled={records.length === 0} className={rowBtn}>
          <Trash2 className="w-5 h-5 text-rose-500" />
          <div>
            <span className="block font-black text-gray-800 text-sm">Delete local records</span>
            <span className="text-[10px] font-bold text-gray-500">
              Removes them from this device; synced records download again on the next sync
            </span>
          </div>
        </button>
      ) : (
        <div className="bg-rose-50 p-5 rounded-[2rem] border border-rose-100">
          <p className="text-xs font-bold text-rose-700 mb-3">
            Delete {records.length} local record{records.length === 1 ? '' : 's'}?{' '}
            {unsynced.length > 0 && `${unsynced.length} have never been synced and will be lost.`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 bg-rose-600 text-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="flex-1 bg-white text-gray-600 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2 pt-2">Appearance</h3>

      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
        {[
          ['system', 'System', Monitor],
          ['light', 'Light', Sun],
          ['dark', 'Dark', Moon],
        ].map(([value, text, Icon]) => (
          <button
            key={value}
            role="radio"
            aria-checked={theme === value}
            onClick={() => chooseTheme(value)}
            className={`p-4 rounded-2xl border flex flex-col items-center gap-1 text-[11px] font-black uppercase tracking-widest ${
              theme === value
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-100'
            }`}
          >
            <Icon className="w-5 h-5" /> {text}
          </button>
        ))}
      </div>

      <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2 pt-2">Account</h3>

      <button onClick={handleLogout} className={rowBtn}>
        <LogOut className="w-5 h-5 text-gray-500" />
        <span className="font-black text-gray-800 text-sm">Sign out</span>
      </button>

      <p className="text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] pt-4">
        MycoHub v1.0.0-alpha
      </p>
    </div>
  );
};

export default SettingsPage;
