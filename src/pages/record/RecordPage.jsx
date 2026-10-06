import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Pencil,
  Trash2,
  Cloud,
  CloudOff,
  AlertOctagon,
  ShieldCheck,
  UserCircle2,
  Loader2,
  MapPin,
  Microscope,
  Send,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  addIdentification,
  deleteObservation,
  displayStatus,
  formatRelative,
  setManualStatus,
  useLocalRecord,
} from '../../utils/observations';
import { recordConsensus } from '../../utils/consensus';
import { formatSporeStats, parseSporeMeasurements, sporeStats } from '../../utils/microscopy';
import { STATUS_STYLE } from '../../components/StatusBadge';

const label = (v) => v.replace(/_/g, ' ').toLowerCase();

const Row = ({ term, value }) =>
  value === undefined || value === null || value === '' ? null : (
    <>
      <dt className="text-[10px] font-black text-gray-500 uppercase tracking-widest pt-0.5">{term}</dt>
      <dd className="text-sm font-bold text-gray-800 min-w-0 break-words">{value}</dd>
    </>
  );

const Section = ({ title, children }) => (
  <section className="bg-white p-6 rounded-[2rem] border border-gray-100">
    <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm mb-4">{title}</h3>
    {children}
  </section>
);

const Photos = ({ record }) => {
  const urls = useMemo(
    () => (record.photos.length ? record.photos.map((b) => URL.createObjectURL(b)) : record.mediaUrls),
    [record.photos, record.mediaUrls],
  );
  useEffect(
    () => () => {
      if (record.photos.length) urls.forEach((u) => URL.revokeObjectURL(u));
    },
    [urls, record.photos.length],
  );
  if (urls.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {urls.map((u, i) => (
        <img
          key={u}
          src={u}
          alt={`${record.scientificName}, photo ${i + 1}`}
          className="aspect-square w-full object-cover rounded-2xl bg-gray-100"
        />
      ))}
    </div>
  );
};

const RecordPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const record = useLocalRecord(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [taxon, setTaxon] = useState('');
  const [comment, setComment] = useState('');

  if (record === undefined) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }
  if (record === null) {
    return (
      <div className="bg-white p-6 rounded-[2rem] text-sm font-bold text-gray-600">
        This record isn't on this device.{' '}
        <Link to="/community" className="text-emerald-700 underline">
          Back to records
        </Link>
      </div>
    );
  }

  const isOwner = !!user && (record.userId === user.id || record.userId.startsWith('local-'));
  const status = displayStatus(record);
  const consensus = recordConsensus(record);
  const myId = record.identifications.find((i) => i.userId === user?.id);
  const spores = sporeStats(parseSporeMeasurements(record.sporeMeasurements).spores);
  const style = STATUS_STYLE[status];

  const agree = () => user && addIdentification(record, user, consensus.taxon ?? record.scientificName);
  const submitSuggestion = async (e) => {
    e.preventDefault();
    if (!user || !taxon.trim()) return;
    await addIdentification(record, user, taxon, comment);
    setSuggesting(false);
    setTaxon('');
    setComment('');
  };

  return (
    <div className="pb-12 space-y-4">
      <header className="bg-white p-6 rounded-[2rem] border border-gray-100">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-black italic text-gray-800 leading-tight break-words">
              {record.scientificName}
            </h2>
            {record.taxonomy?.family && (
              <p className="text-[11px] font-bold text-gray-500 mt-1">
                {record.taxonomy.order} › {record.taxonomy.family}
              </p>
            )}
            <p className="text-[11px] font-bold text-gray-500 mt-1">
              {record.collectionNumber} · {record.collectorName} · {new Date(record.timestamp).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight flex-shrink-0 ${style.className}`}
          >
            {style.label}
          </span>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
          {record.synced && !record.dirty ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
          {record.synced && !record.dirty
            ? 'Synced'
            : record.syncError
              ? `Not synced: ${record.syncError}`
              : 'Waiting to sync'}
        </p>
        {isOwner && (
          <div className="flex gap-2 mt-4">
            <Link
              to={`/entry/${record.id}`}
              className="flex-1 bg-gray-50 text-gray-700 p-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" /> Edit
            </Link>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex-1 bg-gray-50 text-rose-600 p-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        )}
        {confirmDelete && (
          <div className="mt-4 bg-rose-50 p-4 rounded-2xl">
            <p className="text-xs font-bold text-rose-700 mb-3">
              Delete {record.collectionNumber}?{' '}
              {record.synced
                ? 'The cloud copy and its photos are deleted on the next sync.'
                : 'It has never been synced and cannot be recovered.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await deleteObservation(record);
                  navigate('/community', { replace: true });
                }}
                className="flex-1 bg-rose-600 text-white p-3 rounded-xl text-[11px] font-black uppercase tracking-widest"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-white text-gray-600 p-3 rounded-xl text-[11px] font-black uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </header>

      <Photos record={record} />

      <Section title="Identifications">
        <p className="text-xs font-bold text-gray-600 mb-4">
          {consensus.votes} vote{consensus.votes === 1 ? '' : 's'}
          {consensus.taxon && (
            <>
              {' '}
              · leading: <i>{consensus.taxon}</i> ({consensus.agreeing}/{consensus.votes})
            </>
          )}
          {consensus.disputed && ' · disputed'}
        </p>
        <ul className="space-y-3 mb-4">
          <li className="flex items-start gap-3">
            <UserCircle2 className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold italic text-gray-800">{record.scientificName}</p>
              <p className="text-[11px] font-medium text-gray-500">{record.collectorName} · observer's original name</p>
            </div>
          </li>
          {record.identifications.map((i) => (
            <li key={i.userId} className="flex items-start gap-3">
              {['IDENTIFIER', 'CURATOR', 'ADMIN'].includes(i.role) ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <UserCircle2 className="w-5 h-5 text-gray-500 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold italic text-gray-800">{i.taxon}</p>
                <p className="text-[11px] font-medium text-gray-500">
                  {i.userName} · {label(i.role)} · {formatRelative(i.createdAt)}
                  {i.pending && ' · not yet synced'}
                </p>
                {i.comment && <p className="text-xs text-gray-600 mt-1">{i.comment}</p>}
              </div>
            </li>
          ))}
        </ul>

        {user && (
          <div className="space-y-2">
            {!suggesting ? (
              <div className="flex gap-2">
                <button
                  onClick={agree}
                  className="flex-1 bg-emerald-600 text-white p-3 rounded-xl text-[11px] font-black uppercase tracking-widest"
                >
                  Agree{consensus.taxon ? `: ${consensus.taxon}` : ''}
                </button>
                <button
                  onClick={() => setSuggesting(true)}
                  className="flex-1 bg-gray-50 text-gray-700 p-3 rounded-xl text-[11px] font-black uppercase tracking-widest"
                >
                  Suggest another
                </button>
              </div>
            ) : (
              <form onSubmit={submitSuggestion} className="space-y-2">
                <label
                  htmlFor="id-taxon"
                  className="block text-[10px] font-black text-gray-500 uppercase tracking-widest"
                >
                  Your identification
                </label>
                <input
                  id="id-taxon"
                  value={taxon}
                  onChange={(e) => setTaxon(e.target.value)}
                  required
                  placeholder="Scientific name"
                  className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm font-bold"
                />
                <label
                  htmlFor="id-comment"
                  className="block text-[10px] font-black text-gray-500 uppercase tracking-widest"
                >
                  Reason (optional)
                </label>
                <textarea
                  id="id-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="e.g. spores amyloid, no volva"
                  className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white p-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggesting(false)}
                    className="flex-1 bg-gray-50 text-gray-600 p-3 rounded-xl text-[11px] font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {myId && (
              <p className="text-[11px] font-medium text-gray-500">
                Your current identification: <i>{myId.taxon}</i>. A new one replaces it.
              </p>
            )}
            {hasRole('IDENTIFIER') && (
              <button
                onClick={() => setManualStatus(record, record.status === 'FLAGGED' ? 'UNVERIFIED' : 'FLAGGED')}
                className="w-full bg-white border border-gray-100 text-gray-600 p-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <AlertOctagon className="w-4 h-4" /> {record.status === 'FLAGGED' ? 'Remove flag' : 'Flag record'}
              </button>
            )}
          </div>
        )}
        <p className="text-[11px] font-medium text-gray-500 mt-4 leading-snug">
          Community grade: at least 2 votes and more than ⅔ agreeing. Research grade also needs an agreeing Identifier,
          a date and coordinates.
        </p>
      </Section>

      <Section title="Location">
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
          <Row term="Locality" value={record.locality} />
          <Row
            term="Coordinates"
            value={
              record.latitude !== null && record.longitude !== null ? (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${record.latitude}&mlon=${record.longitude}#map=15/${record.latitude}/${record.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-emerald-700 underline decoration-dotted inline-flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {record.latitude.toFixed(5)}, {record.longitude.toFixed(5)}
                </a>
              ) : undefined
            }
          />

          <Row
            term="Uncertainty"
            value={
              record.coordinateUncertaintyInMeters !== null ? `± ${record.coordinateUncertaintyInMeters} m` : undefined
            }
          />
          <Row term="Habitat" value={label(record.habitatType)} />
          <Row term="Substrate" value={label(record.substrate)} />
          <Row term="Host" value={record.hostSpecies} />
          <Row term="Trophic mode" value={label(record.trophicMode)} />
        </dl>
      </Section>

      <Section title="Morphology & Chemistry">
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
          <Row
            term="Cap"
            value={[record.capDiameterMm && `${record.capDiameterMm} mm`, record.capShape, record.capColor]
              .filter(Boolean)
              .join(', ')}
          />
          <Row
            term="Hymenium"
            value={[record.hymeniumType, record.gillSpacing !== 'N/A' && record.gillSpacing, record.attachment]
              .filter(Boolean)
              .join(', ')}
          />
          <Row term="Odor" value={record.odor} />
          <Row term="Bruising" value={record.bruising} />
          <Row term="KOH" value={record.koh} />
          <Row term="FeSO4" value={record.feso4} />
          <Row term="Taste" value={record.taste} />
        </dl>
      </Section>

      {(spores ||
        record.sporePrintColor ||
        record.melzers !== 'NOT_TESTED' ||
        record.clampConnections !== 'NOT_SEEN') && (
        <Section title="Microscopy">
          <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
            <Row term="Spore print" value={record.sporePrintColor} />
            <Row
              term="Spores"
              value={
                spores ? (
                  <span className="font-mono text-xs flex gap-1">
                    <Microscope className="w-3.5 h-3.5 flex-shrink-0" />
                    {formatSporeStats(spores)}
                  </span>
                ) : undefined
              }
            />
            <Row term="Melzer's" value={record.melzers !== 'NOT_TESTED' ? label(record.melzers) : undefined} />
            <Row
              term="Clamps"
              value={record.clampConnections !== 'NOT_SEEN' ? label(record.clampConnections) : undefined}
            />
          </dl>
        </Section>
      )}

      <Section title="Voucher">
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
          <Row term="Preserved" value={record.preserved ? 'Yes' : 'No'} />
          <Row term="DNA" value={record.dnaExtracted ? 'Extracted' : 'No'} />
          <Row term="Herbarium" value={record.herbariumCode} />
          <Row term="Accession" value={record.accessionNumber} />
          <Row
            term="GBIF taxon"
            value={
              record.taxonomy ? (
                <a
                  className="text-emerald-700 underline"
                  href={`https://www.gbif.org/species/${record.taxonomy.taxonKey}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {record.taxonomy.taxonKey}
                </a>
              ) : undefined
            }
          />
        </dl>
      </Section>
    </div>
  );
};

export default RecordPage;
