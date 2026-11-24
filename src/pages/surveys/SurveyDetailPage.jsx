import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  Copy,
  Download,
  Loader2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Repeat,
  Trash2,
  Flag,
  Timer,
} from 'lucide-react';
import {
  elapsedMinutes,
  methodById,
  methodsParagraph,
  normaliseParams,
  samplingEffort,
  samplingProtocol,
  sampleSize,
} from '../../utils/methods';
import {
  addLog,
  analyseSurvey,
  deleteSurvey,
  finishSurvey,
  pauseTimer,
  reopenSurvey,
  startTimer,
  toggleUnitDone,
  useSurvey,
  useSurveyRecords,
} from '../../utils/surveys';
import { accumulationCurve, frequencies } from '../../utils/stats';
import { seededRandom } from '../../utils/methods';
import { downloadText, toCsv, toEventsCsv } from '../../utils/dwc';
import PlotMap from '../../components/PlotMap';
import RarefactionChart from '../../components/RarefactionChart';
import { cn } from '../../utils/cn';

const card = 'bg-white border border-gray-200 rounded-2xl p-5';
const h3 = 'text-xs text-gray-500 uppercase mb-3';
const btn =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs uppercase disabled:opacity-60 transition-colors';
const primary = `${btn} bg-emerald-700 hover:bg-emerald-800 text-white`;
const secondary = `${btn} bg-white border border-gray-300 hover:border-emerald-600 text-ink`;

const fmt = (n, d = 1) =>
  n === null || n === undefined || !Number.isFinite(n) ? '—' : Number(n.toFixed(d)).toString();

const mmss = (minutes) => {
  const total = Math.max(0, Math.round(minutes * 60));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
};

const useNow = (active) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
};

const TimerCard = ({ survey }) => {
  const running = !!survey.timer?.runningSince;
  const now = useNow(running);
  const p = normaliseParams(survey.method, survey.params);
  const elapsed = elapsedMinutes(survey, now) ?? 0;
  const left = p.durationMin - elapsed;
  const over = left <= 0;
  const pct = Math.min(100, (elapsed / p.durationMin) * 100);
  const active = survey.status === 'active';

  return (
    <section className={card} aria-labelledby="timer-h">
      <h3 id="timer-h" className={h3}>
        Search timer
      </h3>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-4xl tabular-nums text-ink" aria-live="off">
            {mmss(elapsed)}
          </p>
          <p className={cn('text-sm mt-1', over ? 'text-emerald-700 font-semibold' : 'text-gray-600')} role="status">
            {over ? `Time's up: ${p.durationMin} min reached` : `${mmss(left)} left of ${p.durationMin} min`}
          </p>
        </div>
        {active && (
          <div className="flex gap-2">
            {running ? (
              <button type="button" onClick={() => pauseTimer(survey)} className={secondary}>
                <Pause className="w-4 h-4" aria-hidden="true" /> Pause
              </button>
            ) : (
              <button type="button" onClick={() => startTimer(survey)} className={primary}>
                <Play className="w-4 h-4" aria-hidden="true" /> {elapsed > 0 ? 'Resume' : 'Start'}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="h-2 rounded-full bg-gray-100 mt-4 overflow-hidden" aria-hidden="true">
        <div className="h-full bg-emerald-600 transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[12px] text-gray-500 mt-3">
        Pause while you photograph or collect, so the time reflects searching only. {p.observers} observer
        {p.observers === 1 ? '' : 's'}: effort = minutes × observers.
      </p>
    </section>
  );
};

const DECAY = [
  ['1', '1 · Fresh: bark intact, wood hard'],
  ['2', '2 · Bark loose, wood mostly hard'],
  ['3', '3 · Bark mostly gone, wood soft on the surface'],
  ['4', '4 · Wood soft through much of the piece'],
  ['5', '5 · Almost decomposed, shape lost'],
];

const LogForm = ({ survey }) => {
  const [decayClass, setDecayClass] = useState('2');
  const [lengthM, setLengthM] = useState('');
  const [diameterCm, setDiameterCm] = useState('');
  const [note, setNote] = useState('');
  const field =
    'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/30';
  const add = async (e) => {
    e.preventDefault();
    await addLog(survey, {
      decayClass: Number(decayClass),
      lengthM: lengthM ? Number(lengthM) : null,
      diameterCm: diameterCm ? Number(diameterCm) : null,
      note,
    });
    setLengthM('');
    setDiameterCm('');
    setNote('');
  };
  return (
    <form onSubmit={add} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end mb-4">
      <div className="col-span-2">
        <label htmlFor="log-decay" className="block text-[10px] text-gray-600 uppercase mb-1">
          Decay class
        </label>
        <select id="log-decay" value={decayClass} onChange={(e) => setDecayClass(e.target.value)} className={field}>
          {DECAY.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="log-length" className="block text-[10px] text-gray-600 uppercase mb-1">
          Length (m)
        </label>
        <input
          id="log-length"
          type="number"
          step="0.1"
          min="0"
          value={lengthM}
          onChange={(e) => setLengthM(e.target.value)}
          className={field}
        />
      </div>
      <div>
        <label htmlFor="log-diameter" className="block text-[10px] text-gray-600 uppercase mb-1">
          Diameter (cm)
        </label>
        <input
          id="log-diameter"
          type="number"
          step="1"
          min="0"
          value={diameterCm}
          onChange={(e) => setDiameterCm(e.target.value)}
          className={field}
        />
      </div>
      <div className="col-span-2 sm:col-span-3">
        <label htmlFor="log-note" className="block text-[10px] text-gray-600 uppercase mb-1">
          Note
        </label>
        <input
          id="log-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Species of tree, on ground or suspended…"
          className={field}
        />
      </div>
      <button type="submit" className={cn(primary, 'col-span-2 sm:col-span-1')}>
        <Plus className="w-4 h-4" aria-hidden="true" /> Add log
      </button>
    </form>
  );
};

const unitDetail = (survey, u) => {
  if (Number.isFinite(u.x) && Number.isFinite(u.y)) return `x ${u.x} m · y ${u.y} m`;
  if (u.meta?.transect) return `${u.meta.fromM}–${u.meta.toM} m`;
  if (survey.method === 'substrate' && u.meta)
    return [
      `decay ${u.meta.decayClass}`,
      u.meta.lengthM && `${u.meta.lengthM} m`,
      u.meta.diameterCm && `⌀ ${u.meta.diameterCm} cm`,
    ]
      .filter(Boolean)
      .join(' · ');
  return '';
};

const UnitsCard = ({ survey, records }) => {
  const m = methodById(survey.method);
  const p = normaliseParams(survey.method, survey.params);
  const active = survey.status === 'active';
  const done = survey.units.filter((u) => u.done).length;
  const perUnit = (id) => records.filter((r) => r.samplingUnitId === id).length;
  const isLogs = survey.method === 'substrate';
  const isCores = survey.method === 'soilcore';
  const code = (u) => `${survey.id.slice(0, 6).toUpperCase()}-${u.label}`;

  return (
    <section className={card} aria-labelledby="units-h">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="units-h" className={h3}>
          {isLogs ? 'Logs examined' : `${m.unitNoun[0].toUpperCase()}${m.unitNoun.slice(1)}s`}
        </h3>
        {!isLogs && (
          <p className="text-[11px] uppercase text-gray-600 tabular-nums">
            {done} / {survey.units.length} done
          </p>
        )}
      </div>

      {isLogs && active && <LogForm survey={survey} />}

      {(survey.method === 'quadrat' || isCores) && p.placement !== 'subjective' && (
        <PlotMap method={survey.method} params={p} units={survey.units} className="mb-4 max-w-md mx-auto" />
      )}

      {survey.units.length === 0 ? (
        <p className="text-sm text-gray-600">No logs yet. Add each piece of woody debris as you examine it.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2" aria-label={isLogs ? 'Logs' : `${m.unitNoun}s`}>
          {survey.units.map((u) => (
            <li
              key={u.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-2.5',
                u.done ? 'border-emerald-200 bg-emerald-50/60' : 'border-gray-200',
              )}
            >
              {!isLogs && (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={!!u.done}
                  aria-label={`${u.label} ${isCores ? 'collected' : 'searched'}`}
                  disabled={!active}
                  onClick={() => toggleUnitDone(survey, u.id)}
                  className={cn(
                    'w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0',
                    u.done ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-gray-300 bg-white',
                  )}
                >
                  {u.done && <Check className="w-4 h-4" aria-hidden="true" />}
                </button>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {isCores ? code(u) : u.label}
                  {m.counts && (
                    <span className="ml-2 text-[11px] font-normal text-gray-600 tabular-nums">
                      {perUnit(u.id)} rec.
                    </span>
                  )}
                </p>
                {unitDetail(survey, u) && (
                  <p className="text-[11.5px] text-gray-600 truncate">{unitDetail(survey, u)}</p>
                )}
              </div>
              {m.counts && active && (
                <Link
                  to={`/entry?survey=${survey.id}&unit=${encodeURIComponent(u.id)}`}
                  className="text-[11px] uppercase text-emerald-700 hover:underline flex-shrink-0 px-1"
                  aria-label={`Add record in ${u.label}`}
                >
                  + Record
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      {isCores && (
        <p className="text-[12px] text-gray-500 mt-3">
          Label each bag with its code. Keep cores cool and process them for DNA as your lab protocol requires.
        </p>
      )}
    </section>
  );
};

const ResultsCard = ({ survey, records }) => {
  const m = methodById(survey.method);
  const a = useMemo(() => analyseSurvey(survey, records), [survey, records]);
  const curve = useMemo(
    () => (a.unitSets.length >= 2 ? accumulationCurve(a.unitSets, 200, seededRandom(survey.id)) : []),
    [a.unitSets, survey.id],
  );
  const freq = useMemo(() => frequencies(a.unitSets), [a.unitSets]);
  if (!m.counts) return null;

  const stats = [
    ['Species', a.species, 0],
    ['Records', a.records, 0],
    ['Fruit bodies', a.fruitBodies, 0],
    a.areaM2 !== null && ['Area searched (m²)', a.areaM2, 1],
    a.densityPerM2 !== null && ['Fruit bodies per m²', a.densityPerM2, 2],
    a.personHours !== null && ['Person-hours', a.personHours, 2],
    a.speciesPerPersonHour !== null && ['Species per person-hour', a.speciesPerPersonHour, 2],
  ].filter(Boolean);

  return (
    <section className={card} aria-labelledby="results-h">
      <h3 id="results-h" className={h3}>
        Results
      </h3>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(([label, value, d]) => (
          <div key={label} className="rounded-xl bg-gray-50 border border-gray-200 p-3">
            <dt className="text-[10px] uppercase text-gray-600">{label}</dt>
            <dd className="text-xl tabular-nums text-ink mt-1">{fmt(value, d)}</dd>
          </div>
        ))}
      </dl>

      {curve.length >= 2 && (
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-ink mb-1">Species accumulation</h4>
          <RarefactionChart
            points={curve}
            xLabel={`${m.unitNoun}s sampled`}
            unit={m.unitNoun}
            caption={`Mean species found in the first k ${m.unitNoun}s, over 200 random orders. Still rising at the end means more ${m.unitNoun}s would find more species.`}
          />
        </div>
      )}

      {freq.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <h4 className="text-sm font-semibold text-ink mb-2">Frequency of occurrence</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase text-gray-600">
                <th className="py-1.5 pr-3 font-semibold">Species</th>
                <th className="py-1.5 pr-3 font-semibold text-right">{m.unitNoun}s</th>
                <th className="py-1.5 font-semibold text-right">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {freq.map((f) => (
                <tr key={f.species} className="border-t border-gray-100">
                  <td className="py-1.5 pr-3 italic">{f.species}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {f.units}/{a.unitSets.length}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{Math.round(f.frequency * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[12px] text-gray-500 mt-4">
        A single visit records what was fruiting that day. Absence of fruit bodies does not mean the fungus is absent;
        repeat the survey across seasons and years for a fuller inventory.
      </p>
    </section>
  );
};

const MethodsCard = ({ survey, records }) => {
  const text = methodsParagraph(survey, records);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className={card} aria-labelledby="methods-h">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="methods-h" className={h3}>
          Methods paragraph
        </h3>
        <button
          type="button"
          onClick={copy}
          className="text-[11px] uppercase text-emerald-700 inline-flex items-center gap-1"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-[14.5px] leading-relaxed text-ink font-display" data-testid="methods-paragraph">
        {text}
      </p>
      <p className="text-[12px] text-gray-500 mt-3">
        A draft to check and adapt; add site details and identification sources.
      </p>
    </section>
  );
};

const SurveyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const survey = useSurvey(id);
  const records = useSurveyRecords(id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (survey === undefined) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }
  if (survey === null) {
    return <p className={cn(card, 'text-sm text-gray-600')}>This survey no longer exists on this device.</p>;
  }

  const m = methodById(survey.method);
  const size = sampleSize(survey);
  const active = survey.status === 'active';
  const stamp = new Date().toISOString().slice(0, 10);
  const slug =
    survey.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'survey';

  return (
    <div className="pb-12 pt-4 max-w-5xl mx-auto space-y-6">
      <header className="px-2">
        <p className="text-[10px] uppercase text-emerald-700">{m.name}</p>
        <h2 className="text-3xl text-ink leading-tight">{survey.name}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {[
            survey.site.locality,
            new Date(survey.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
          ]
            .filter(Boolean)
            .join(' · ')}
          {' · '}
          <span className={active ? 'text-amber-800' : 'text-emerald-700'}>{active ? 'In progress' : 'Completed'}</span>
        </p>
      </header>

      <section className={card} aria-labelledby="design-h">
        <h3 id="design-h" className={h3}>
          Design
        </h3>
        <dl className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="sm:col-span-3">
            <dt className="text-[10px] uppercase text-gray-600">Protocol (samplingProtocol)</dt>
            <dd className="text-ink mt-0.5">{samplingProtocol(survey)}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-gray-600">Sample size</dt>
            <dd className="text-ink mt-0.5 tabular-nums">{size ? `${size.value} ${size.unit}` : '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase text-gray-600">Effort (samplingEffort)</dt>
            <dd className="text-ink mt-0.5">{samplingEffort(survey)}</dd>
          </div>
        </dl>
        {survey.notes && <p className="text-sm text-gray-600 mt-3">{survey.notes}</p>}
      </section>

      {survey.method === 'timed' && <TimerCard survey={survey} />}

      <div className="flex flex-wrap gap-2">
        {active && m.counts && (
          <Link to={`/entry?survey=${survey.id}`} className={primary}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Add record
          </Link>
        )}
        {active ? (
          <button type="button" onClick={() => finishSurvey(survey)} className={secondary}>
            <Flag className="w-4 h-4" aria-hidden="true" /> Finish survey
          </button>
        ) : (
          <button type="button" onClick={() => reopenSurvey(survey)} className={secondary}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Reopen
          </button>
        )}
        <Link to={`/surveys/new?repeat=${survey.id}`} className={secondary}>
          <Repeat className="w-4 h-4" aria-hidden="true" /> Repeat visit
        </Link>
      </div>

      {m.unitNoun && <UnitsCard survey={survey} records={records} />}

      {m.counts && records.length > 0 && (
        <section className={card} aria-labelledby="records-h">
          <h3 id="records-h" className={h3}>
            Records ({records.length})
          </h3>
          <ul className="divide-y divide-gray-100">
            {records.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/record/${r.id}`}
                  className="flex items-center justify-between gap-3 py-2 hover:text-emerald-700"
                >
                  <span className="min-w-0">
                    <span className="italic text-ink">{r.scientificName}</span>
                    <span className="block text-[11.5px] text-gray-600">
                      {[r.samplingUnitLabel, r.collectionNumber].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="text-[12px] tabular-nums text-gray-600 flex-shrink-0">
                    {r.organismQuantityType === 'presence'
                      ? 'present'
                      : r.organismQuantity != null
                        ? `${r.organismQuantity} fruit bod${r.organismQuantity === 1 ? 'y' : 'ies'}`
                        : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ResultsCard survey={survey} records={records} />
      <MethodsCard survey={survey} records={records} />

      <section className={card} aria-labelledby="export-h">
        <h3 id="export-h" className={h3}>
          Export (Darwin Core)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          A sampling-event dataset as GBIF expects it: an event table (the survey and each completed sampling unit) and
          an occurrence table linked to it by eventID.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadText(toEventsCsv(survey), `mycohub-${slug}-events-${stamp}.csv`)}
            className={secondary}
          >
            <Download className="w-4 h-4" aria-hidden="true" /> Events CSV
          </button>
          {m.counts && (
            <button
              type="button"
              disabled={records.length === 0}
              onClick={() => downloadText(toCsv(records), `mycohub-${slug}-occurrences-${stamp}.csv`)}
              className={secondary}
            >
              <Download className="w-4 h-4" aria-hidden="true" /> Occurrences CSV
            </button>
          )}
        </div>
      </section>

      <div className="flex justify-end">
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2 text-sm" role="alert">
            <span className="text-gray-700">Delete this survey? Its records are kept.</span>
            <button
              type="button"
              onClick={async () => {
                await deleteSurvey(survey.id);
                navigate('/surveys', { replace: true });
              }}
              className={`${btn} bg-rose-700 hover:bg-rose-800 text-white`}
            >
              Delete
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className={secondary}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className={`${btn} text-gray-600 hover:text-rose-700`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" /> Delete survey
          </button>
        )}
      </div>

      {survey.method === 'timed' && !active && (
        <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" aria-hidden="true" /> Searched for {fmt(elapsedMinutes(survey), 0)} min.
        </p>
      )}
    </div>
  );
};

export default SurveyDetailPage;
