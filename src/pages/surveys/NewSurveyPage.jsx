import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  METHODS,
  defaultParams,
  generateUnits,
  methodById,
  normaliseParams,
  samplingProtocol,
} from '../../utils/methods';
import { createSurvey, useSurvey, useSurveys } from '../../utils/surveys';
import { getCurrentFix } from '../../utils/native';
import { parseCoord } from '../../utils/fieldForm';
import PlotMap from '../../components/PlotMap';
import { cn } from '../../utils/cn';

const fieldClass =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30';
const labelClass = 'block text-[10px] text-gray-600 uppercase mb-1.5';

const ParamField = ({ def, value, onChange }) => {
  const id = `param-${def.key}`;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>
        {def.label}
        {def.unit && <span className="normal-case"> ({def.unit})</span>}
      </label>
      {def.type === 'select' ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
          {def.options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={def.min}
          max={def.max}
          step={def.step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      )}
      {def.hint && <p className="text-[11px] text-gray-500 mt-1">{def.hint}</p>}
    </div>
  );
};

const NewSurveyForm = ({ template }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const surveys = useSurveys() ?? [];

  const [method, setMethod] = useState(template?.method ?? 'quadrat');
  const [params, setParams] = useState(() =>
    template ? normaliseParams(template.method, template.params) : defaultParams('quadrat'),
  );
  const [name, setName] = useState(template ? template.name : '');
  const [locality, setLocality] = useState(template?.site.locality ?? '');
  const [lat, setLat] = useState(template?.site.latitude != null ? String(template.site.latitude) : '');
  const [lng, setLng] = useState(template?.site.longitude != null ? String(template.site.longitude) : '');
  const [notes, setNotes] = useState('');
  const [repeatOf, setRepeatOf] = useState(template?.id ?? '');
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const chooseMethod = (id) => {
    setMethod(id);
    setParams(defaultParams(id));
    setRepeatOf('');
    setError(null);
  };

  const clean = normaliseParams(method, params);
  // Preview with a fixed seed; the saved survey uses its own id as the seed.
  const preview = useMemo(() => generateUnits(method, clean, 'preview'), [method, JSON.stringify(clean)]); // eslint-disable-line react-hooks/exhaustive-deps
  const latN = parseCoord(lat, 90);
  const lngN = parseCoord(lng, 180);
  const coordError = latN === undefined || lngN === undefined;
  const m = methodById(method);
  const sameMethod = surveys.filter((s) => s.method === method);

  const locate = async () => {
    setLocating(true);
    try {
      const fix = await getCurrentFix();
      setLat(fix.latitude.toFixed(6));
      setLng(fix.longitude.toFixed(6));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Location unavailable.');
    } finally {
      setLocating(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!user || preview.error || coordError) return;
    setSaving(true);
    const result = await createSurvey({
      userId: user.id,
      name: name || `${m.name}${locality ? `, ${locality}` : ''}`,
      method,
      params: clean,
      site: { locality, latitude: latN ?? null, longitude: lngN ?? null },
      repeatOf: repeatOf || null,
      notes,
    });
    setSaving(false);
    if (result.error) setError(result.error);
    else navigate(`/surveys/${result.id}`, { replace: true });
  };

  return (
    <form onSubmit={submit} className="pb-12 pt-4 max-w-4xl mx-auto space-y-6">
      <div className="px-2">
        <h2 className="text-3xl text-ink leading-none">{template ? 'Repeat survey' : 'New survey'}</h2>
        <p className="text-[10px] text-gray-500 uppercase mt-2">Choose a sampling design</p>
      </div>

      <fieldset className="bg-white border border-gray-200 rounded-2xl p-5">
        <legend className="sr-only">Method</legend>
        <div role="radiogroup" aria-label="Method" className="grid gap-2 sm:grid-cols-2">
          {METHODS.map((def) => {
            const selected = def.id === method;
            return (
              <button
                key={def.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => chooseMethod(def.id)}
                className={cn(
                  'text-left p-3.5 rounded-xl border transition-colors',
                  selected
                    ? 'border-emerald-700 ring-2 ring-emerald-700/25 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-emerald-600',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{def.name}</span>
                  {selected && <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />}
                </span>
                <span className="block text-[12.5px] text-gray-600 mt-1 leading-snug">{def.summary}</span>
                <span className="block text-[11.5px] text-gray-600 mt-1.5 leading-snug">
                  <span className="font-semibold">Best for:</span> {def.bestFor}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs text-gray-500 uppercase">Design</h3>
          <div className="grid grid-cols-2 gap-3">
            {m.params.map((def) => (
              <ParamField
                key={def.key}
                def={def}
                value={params[def.key] ?? ''}
                onChange={(v) => setParams((prev) => ({ ...prev, [def.key]: v }))}
              />
            ))}
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
            <p className="text-[10px] uppercase text-gray-500 mb-1">Protocol</p>
            <p className="text-sm text-ink" data-testid="protocol-preview">
              {samplingProtocol({ method, params: clean, units: preview.units ?? [] })}
            </p>
          </div>
          {preview.error && (
            <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              {preview.error}
            </p>
          )}
          {!preview.error && (method === 'quadrat' || method === 'soilcore') && clean.placement !== 'subjective' && (
            <PlotMap method={method} params={clean} units={preview.units} className="m-0" />
          )}
          {!preview.error && method === 'quadrat' && clean.placement === 'random' && (
            <p className="text-[11.5px] text-gray-500">
              Positions are drawn at random when you start; this preview shows a sample layout.
            </p>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs text-gray-500 uppercase">Site and details</h3>
          <div>
            <label htmlFor="survey-name" className={labelClass}>
              Survey name
            </label>
            <input
              id="survey-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${m.name}${locality ? `, ${locality}` : ''}`}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="survey-site" className={labelClass}>
              Site / locality
            </label>
            <input
              id="survey-site"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="Black Rock Forest, plot A"
              className={fieldClass}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Records made in this survey start with this site and its coordinates.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="survey-lat" className={labelClass}>
                Latitude
              </label>
              <input
                id="survey-lat"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="41.378"
                className={fieldClass}
                aria-invalid={latN === undefined}
              />
            </div>
            <div>
              <label htmlFor="survey-lng" className={labelClass}>
                Longitude
              </label>
              <input
                id="survey-lng"
                inputMode="decimal"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-74.004"
                className={fieldClass}
                aria-invalid={lngN === undefined}
              />
            </div>
          </div>
          {coordError && <p className="text-[12px] text-rose-700">Coordinates must be decimal degrees.</p>}
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="w-full bg-white border border-gray-300 hover:border-emerald-600 text-ink p-2.5 rounded-xl flex items-center justify-center gap-2 text-[11px] uppercase disabled:opacity-60"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {locating ? 'Locating…' : 'Use current location'}
          </button>
          {sameMethod.length > 0 && (
            <div>
              <label htmlFor="survey-repeat" className={labelClass}>
                Repeat visit of
              </label>
              <select
                id="survey-repeat"
                value={repeatOf}
                onChange={(e) => setRepeatOf(e.target.value)}
                className={fieldClass}
              >
                <option value="">None (a new site or design)</option>
                {sameMethod.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({new Date(s.startedAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Fruiting is irregular; repeat visits across seasons give a fuller picture.
              </p>
            </div>
          )}
          <div>
            <label htmlFor="survey-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="survey-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Weather, recent rain, vegetation…"
              className={fieldClass}
            />
          </div>
        </section>
      </div>

      {error && !preview.error && (
        <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !!preview.error || coordError}
          className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white px-6 py-3 rounded-xl text-xs uppercase"
        >
          {saving ? 'Starting…' : 'Start survey'}
        </button>
      </div>
    </form>
  );
};

/** /surveys/new, or /surveys/new?repeat=<id> to copy an earlier survey's design and site. */
const NewSurveyPage = () => {
  const [search] = useSearchParams();
  const repeatId = search.get('repeat');
  const template = useSurvey(repeatId);
  if (repeatId && template === undefined) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }
  return <NewSurveyForm key={repeatId ?? 'new'} template={repeatId ? template : null} />;
};

export default NewSurveyPage;
