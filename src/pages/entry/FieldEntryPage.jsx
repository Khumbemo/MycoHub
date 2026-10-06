import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Camera,
  MapPin,
  Beaker,
  Microscope,
  Tag,
  Save,
  TreeDeciduous,
  Database,
  X,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader2,
  ImagePlus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { saveObservation, updateObservation, useLocalRecord } from '../../utils/observations';
import { emptyForm, formToFields, recordToForm, validate } from '../../utils/fieldForm';
import { canonicalName, matchName } from '../../utils/gbif';
import { formatSporeStats, parseSporeMeasurements, sporeStats } from '../../utils/microscopy';
import { compressImage } from '../../utils/images';
import { getCurrentFix, isNative, takeNativePhoto } from '../../utils/native';

// Tailwind only ships classes it can see in full, so section colors are listed explicitly.
const sectionColors = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  teal: 'bg-teal-50 text-teal-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  violet: 'bg-violet-50 text-violet-600',
};

const FormSection = ({ title, icon: Icon, children, color = 'emerald' }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-6">
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2 rounded-xl ${sectionColors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm">{title}</h3>
    </div>
    {children}
  </div>
);

const fieldClass =
  'w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner';
const labelClass = 'block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1';

const Input = ({ id, label, placeholder, value, onChange, type = 'text', inputMode, error, required, hint }) => (
  <div className="mb-5 last:mb-0 min-w-0">
    <label htmlFor={id} className={labelClass}>
      {label}
      {required && <span className="text-rose-500"> *</span>}
    </label>
    <input
      id={id}
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      className={`${fieldClass} ${error ? 'ring-2 ring-rose-400/60' : ''}`}
    />

    {error && (
      <p id={`${id}-error`} className="text-[11px] font-bold text-rose-600 mt-1 ml-1">
        {error}
      </p>
    )}
    {!error && hint && (
      <p id={`${id}-hint`} className="text-[11px] font-medium text-gray-500 mt-1 ml-1">
        {hint}
      </p>
    )}
  </div>
);

function Select({ id, label, options, value, onChange }) {
  return (
    <div className="mb-5 last:mb-0">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} font-bold text-gray-700 appearance-none`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const opts = (pairs) => pairs.map(([value, label]) => ({ value, label }));

const CONFIDENCE = opts([
  ['CERTAIN', 'Certain'],
  ['PROBABLE', 'Probable'],
  ['POSSIBLE', 'Possible'],
  ['GENUS_ONLY', 'Genus only'],
]);
const HYMENIUM = opts([
  ['Gills', 'Gills (lamellae)'],
  ['Pores', 'Pores (tubes)'],
  ['Teeth', 'Teeth / spines'],
  ['Smooth', 'Smooth'],
  ['Ridged', 'Ridged / false gills'],
]);
const SPACING = opts([
  ['Crowded', 'Crowded'],
  ['Close', 'Close'],
  ['Subdistant', 'Subdistant'],
  ['Distant', 'Distant'],
  ['N/A', 'Not applicable'],
]);
const MELZERS = opts([
  ['NOT_TESTED', 'Not tested'],
  ['AMYLOID', 'Amyloid (blue-black)'],
  ['DEXTRINOID', 'Dextrinoid (red-brown)'],
  ['INAMYLOID', 'Inamyloid (no reaction)'],
]);
const CLAMPS = opts([
  ['NOT_SEEN', 'Not examined'],
  ['PRESENT', 'Present'],
  ['RARE', 'Rare'],
  ['ABSENT', 'Absent'],
]);
const TROPHIC = opts([
  ['SAPROTROPHIC', 'Saprotrophic'],
  ['ECTOMYCORRHIZAL', 'Ectomycorrhizal'],
  ['PARASITIC', 'Parasitic'],
  ['ENDOPHYTIC', 'Endophytic'],
  ['LICHENIZED', 'Lichenized'],
]);
const SUBSTRATE = opts([
  ['DEAD_WOOD', 'Dead wood'],
  ['LIVING_WOOD', 'Living wood'],
  ['SOIL', 'Soil'],
  ['LITTER', 'Leaf / needle litter'],
  ['DUNG', 'Dung'],
  ['OTHER_FUNGUS', 'Other fungus'],
  ['INVERTEBRATE', 'Invertebrate'],
]);
const HABITAT = opts([
  ['BROADLEAF_WOODLAND', 'Broadleaf woodland'],
  ['CONIFEROUS_FOREST', 'Coniferous forest'],
  ['GRASSLAND', 'Grassland'],
  ['HEATH', 'Heath'],
  ['WETLAND', 'Wetland'],
  ['URBAN', 'Urban / parkland'],
]);

const PhotoThumb = ({ photo, onRemove }) => {
  const [url, setUrl] = useState();
  useEffect(() => {
    const u = URL.createObjectURL(photo.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo.blob]);
  return (
    <li className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
      {url && <img src={url} alt={photo.name} className="w-full h-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${photo.name}`}
        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </li>
  );
};

/** GBIF name-check result with an action to adopt the suggested name. */
const NameCheck = ({ outcome, onUse }) => {
  if (outcome.kind === 'error')
    return <p className="text-xs font-bold text-amber-700 bg-amber-50 rounded-2xl p-3">{outcome.message}</p>;
  if (outcome.kind === 'none')
    return (
      <p className="text-xs font-bold text-amber-700 bg-amber-50 rounded-2xl p-3">
        No match in the GBIF Backbone Taxonomy. Check the spelling, or record it as entered.
      </p>
    );
  if (outcome.kind === 'not-fungus')
    return (
      <p className="text-xs font-bold text-rose-700 bg-rose-50 rounded-2xl p-3">
        GBIF matched this name in kingdom {outcome.kingdom}, not Fungi.
      </p>
    );

  const m = outcome.match;
  const accepted = canonicalName(m.acceptedName, m.rank);
  const matched = canonicalName(m.matchedName, m.rank);
  const classification = [m.phylum, m.class, m.order, m.family].filter(Boolean).join(' › ');

  let message;
  let suggest = null;
  if (m.matchType === 'HIGHERRANK') {
    message = (
      <>
        Only matched at {m.rank.toLowerCase()} level: <i>{m.matchedName}</i>.
      </>
    );
  } else if (m.status === 'SYNONYM' || m.status.endsWith('SYNONYM')) {
    message = (
      <>
        <i>{m.matchedName}</i> is a synonym. Accepted name: <i>{m.acceptedName}</i>.
      </>
    );
    suggest = accepted;
  } else if (m.matchType === 'FUZZY') {
    message = (
      <>
        No exact match. Closest name: <i>{m.matchedName}</i> ({m.confidence}% confidence).
      </>
    );
    suggest = matched;
  } else {
    message = (
      <>
        Accepted name: <i>{m.matchedName}</i>.
      </>
    );
  }

  return (
    <div className="text-xs font-bold text-emerald-800 bg-emerald-50 rounded-2xl p-3 space-y-1.5">
      <p className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
      </p>
      {classification && <p className="text-[11px] font-medium text-emerald-700 ml-6">{classification}</p>}
      {suggest && (
        <button type="button" onClick={() => onUse(suggest)} className="ml-6 underline decoration-dotted">
          Use “{suggest}”
        </button>
      )}
    </div>
  );
};

let photoCounter = 0;
const toPhoto = (blob, name) => ({ key: `p${++photoCounter}`, blob, name });

const FieldEntryPage = () => {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const existing = useLocalRecord(editId);
  const isEdit = !!editId;

  const [form, setForm] = useState(() => emptyForm(user?.displayName ?? ''));
  const [photos, setPhotos] = useState([]);
  const [taxonomy, setTaxonomy] = useState();
  const [nameCheck, setNameCheck] = useState(null);
  const [checkingName, setCheckingName] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loadedId, setLoadedId] = useState(null);

  // Load the record once when editing.
  if (isEdit && existing && loadedId !== existing.id) {
    setLoadedId(existing.id);
    setForm(recordToForm(existing));
    setPhotos(existing.photos.map((b, i) => toPhoto(b, `Photo ${i + 1}`)));
    setTaxonomy(existing.taxonomy);
  }

  const spores = useMemo(() => {
    const { spores } = parseSporeMeasurements(form.sporeMeasurements);
    return sporeStats(spores);
  }, [form.sporeMeasurements]);

  if (isEdit && existing === null) {
    return (
      <p className="bg-white p-6 rounded-[2rem] text-sm font-bold text-gray-600">
        This record no longer exists on this device.
      </p>
    );
  }
  if (isEdit && existing && user && existing.userId !== user.id && !existing.userId.startsWith('local-')) {
    return (
      <p className="bg-white p-6 rounded-[2rem] text-sm font-bold text-gray-600">
        Only the collector who made this record can edit it. You can add an identification from the record page.
      </p>
    );
  }

  const set = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (key === 'scientificName') {
      setNameCheck(null);
      setTaxonomy(undefined);
    }
  };

  const fillCurrentLocation = async () => {
    setLocating(true);
    try {
      const fix = await getCurrentFix();
      setForm((prev) => ({
        ...prev,
        latitude: fix.latitude.toFixed(6),
        longitude: fix.longitude.toFixed(6),
        coordinateUncertainty: String(fix.accuracy),
      }));
      setErrors((prev) => ({ ...prev, latitude: undefined, longitude: undefined, coordinateUncertainty: undefined }));
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Location unavailable.' });
    } finally {
      setLocating(false);
    }
  };

  const checkName = async () => {
    setCheckingName(true);
    const outcome = await matchName(form.scientificName);
    setNameCheck(outcome);
    setTaxonomy(outcome.kind === 'match' ? outcome.match : undefined);
    setCheckingName(false);
  };

  const addPhotos = async (files, names) => {
    setProcessingPhotos(true);
    const compressed = await Promise.all(files.map(compressImage));
    setPhotos((prev) => [...prev, ...compressed.map((b, i) => toPhoto(b, names[i]))]);
    setProcessingPhotos(false);
  };

  const takePhoto = async () => {
    try {
      const file = await takeNativePhoto();
      if (file) await addPhotos([file], [file.name]);
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Camera unavailable.' });
    }
  };

  const handleSave = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setNotice({ kind: 'error', text: 'Some required fields are missing or invalid.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!user) return;

    setSaving(true);
    setNotice(null);
    try {
      const fields = { ...formToFields(form), taxonomy, photos: photos.map((p) => p.blob) };
      if (isEdit && existing) {
        await updateObservation(existing.id, fields);
        navigate(`/record/${existing.id}`);
        return;
      }
      const { synced } = await saveObservation({ ...fields, userId: user.id });
      setNotice(
        synced
          ? { kind: 'ok', text: `Saved ${form.collectionNumber} and synced to the cloud.` }
          : {
              kind: 'warn',
              text: `Saved ${form.collectionNumber} on this device. It will sync automatically when you're signed in and online.`,
            },
      );
      setForm(emptyForm(form.collectorName));
      setPhotos([]);
      setTaxonomy(undefined);
      setNameCheck(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error(e);
      setNotice({ kind: 'error', text: 'Could not save: local storage on this device is unavailable or full.' });
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && existing === undefined) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="pb-12 pt-4">
      <div className="flex justify-between items-end gap-4 mb-6 px-2">
        <div className="min-w-0">
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter leading-none">
            {isEdit ? 'Edit Record' : 'Scientific Record'}
          </h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-2">Darwin Core field terms</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving || processingPhotos}
          className="bg-emerald-600 disabled:opacity-60 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-emerald-600/30 flex-shrink-0"
        >
          <Save className="w-4 h-4" />
          <span className="font-black text-xs uppercase tracking-widest">{saving ? 'Saving…' : 'Save'}</span>
        </motion.button>
      </div>

      {notice && (
        <div
          role="status"
          className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-xs font-bold ${
            notice.kind === 'ok'
              ? 'bg-emerald-50 text-emerald-700'
              : notice.kind === 'warn'
                ? 'bg-amber-50 text-amber-800'
                : 'bg-rose-50 text-rose-700'
          }`}
        >
          {notice.kind === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="flex-1">{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <FormSection title="Collection Metadata" icon={Database} color="blue">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="collectorName"
            label="Collector (recordedBy)"
            placeholder="Jane Mycologist"
            value={form.collectorName}
            onChange={set('collectorName')}
            error={errors.collectorName}
            required
          />
          <Input
            id="collectionNumber"
            label="Collection # (recordNumber)"
            placeholder="JM-2026-04"
            value={form.collectionNumber}
            onChange={set('collectionNumber')}
            error={errors.collectionNumber}
            required
          />
        </div>
        <Input
          id="eventDate"
          label="Date collected (eventDate)"
          type="date"
          value={form.eventDate}
          onChange={set('eventDate')}
          error={errors.eventDate}
          required
        />
        <Input
          id="locality"
          label="Site / Locality"
          placeholder="Black Rock Forest, NY"
          value={form.locality}
          onChange={set('locality')}
          hint="Use the same site name on every visit; Research Lab groups records by it."
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="latitude"
            label="Latitude (WGS84)"
            placeholder="41.378"
            inputMode="decimal"
            value={form.latitude}
            onChange={set('latitude')}
            error={errors.latitude}
          />
          <Input
            id="longitude"
            label="Longitude (WGS84)"
            placeholder="-74.004"
            inputMode="decimal"
            value={form.longitude}
            onChange={set('longitude')}
            error={errors.longitude}
          />
        </div>
        <Input
          id="coordinateUncertainty"
          label="Uncertainty (m)"
          placeholder="e.g. 15"
          inputMode="decimal"
          value={form.coordinateUncertainty}
          onChange={set('coordinateUncertainty')}
          error={errors.coordinateUncertainty}
          hint="coordinateUncertaintyInMeters: radius that contains the true location. Filled from GPS accuracy."
        />

        <button
          type="button"
          onClick={fillCurrentLocation}
          disabled={locating}
          className="w-full mt-1 bg-blue-50 text-blue-700 p-3 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest disabled:opacity-60"
        >
          <MapPin className="w-4 h-4" />
          {locating ? 'Locating…' : 'Use current location'}
        </button>
      </FormSection>

      <FormSection title="Taxonomy" icon={Tag}>
        <Input
          id="scientificName"
          label="Scientific Name"
          placeholder="e.g. Amanita muscaria"
          value={form.scientificName}
          onChange={set('scientificName')}
          error={errors.scientificName}
          required
        />
        <div className="-mt-2 mb-5 space-y-3">
          <button
            type="button"
            onClick={checkName}
            disabled={checkingName || !form.scientificName.trim()}
            className="w-full bg-emerald-50 text-emerald-700 p-3 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest disabled:opacity-60"
          >
            {checkingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Check name with GBIF
          </button>
          {nameCheck && (
            <NameCheck
              outcome={nameCheck}
              onUse={(name) => {
                setForm((prev) => ({ ...prev, scientificName: name }));
                setNameCheck(null);
                setTaxonomy(undefined);
              }}
            />
          )}
          {!nameCheck && taxonomy && (
            <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-2xl p-3">
              GBIF: {[taxonomy.order, taxonomy.family].filter(Boolean).join(' › ')} · taxonKey {taxonomy.taxonKey}
            </p>
          )}
        </div>
        <Select
          id="identificationConfidence"
          label="Confidence Level"
          options={CONFIDENCE}
          value={form.identificationConfidence}
          onChange={set('identificationConfidence')}
        />
      </FormSection>

      <FormSection title="Photographs" icon={Camera} color="emerald">
        <div className="flex gap-2">
          {isNative() && (
            <button
              type="button"
              onClick={takePhoto}
              className="flex-1 bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest"
            >
              <Camera className="w-4 h-4" /> Take photo
            </button>
          )}
          <label
            htmlFor="photos"
            className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center justify-center gap-2 cursor-pointer text-gray-500 text-[11px] font-black uppercase tracking-widest"
          >
            <ImagePlus className="w-4 h-4" /> {isNative() ? 'Choose files' : 'Add photos'}
          </label>
        </div>
        <input
          id="photos"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            void addPhotos(
              files,
              files.map((f) => f.name),
            );
          }}
        />

        <p className="text-[11px] font-medium text-gray-500 mt-3">
          Habitat, cap, hymenium, stipe and a scale bar. Photos are resized to 2048 px to save space.
        </p>
        {processingPhotos && <p className="text-[11px] font-bold text-emerald-700 mt-2">Processing photos…</p>}
        {photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <PhotoThumb
                key={p.key}
                photo={p}
                onRemove={() => setPhotos((prev) => prev.filter((x) => x.key !== p.key))}
              />
            ))}
          </ul>
        )}
      </FormSection>

      <FormSection title="Morphology: Pileus & Hymenium" icon={Microscope} color="amber">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="capDiameterMm"
            label="Cap Diameter (mm)"
            placeholder="40-120"
            value={form.capDiameterMm}
            onChange={set('capDiameterMm')}
          />
          <Input
            id="capShape"
            label="Cap Shape"
            placeholder="Convex to plane"
            value={form.capShape}
            onChange={set('capShape')}
          />
        </div>
        <Input
          id="capColor"
          label="Cap Color (Munsell/Kornerup)"
          placeholder="7.5R 4/12"
          value={form.capColor}
          onChange={set('capColor')}
        />
        <div className="h-px bg-gray-100 my-4" />
        <Select
          id="hymeniumType"
          label="Hymenium Type"
          options={HYMENIUM}
          value={form.hymeniumType}
          onChange={set('hymeniumType')}
        />
        <Select
          id="gillSpacing"
          label="Gill Spacing"
          options={SPACING}
          value={form.gillSpacing}
          onChange={set('gillSpacing')}
        />
        <Input
          id="attachment"
          label="Attachment"
          placeholder="Free, adnexed, adnate, decurrent…"
          value={form.attachment}
          onChange={set('attachment')}
        />
      </FormSection>

      <FormSection title="Context & Reactions" icon={Beaker} color="rose">
        <Input id="odor" label="Odor" placeholder="Farinaceous, anise, etc." value={form.odor} onChange={set('odor')} />
        <Input
          id="bruising"
          label="Bruising Reaction"
          placeholder="Yellowing within 2 min"
          value={form.bruising}
          onChange={set('bruising')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input id="koh" label="KOH Reaction" placeholder="Negative" value={form.koh} onChange={set('koh')} />
          <Input id="feso4" label="FeSO4" placeholder="Olive-green" value={form.feso4} onChange={set('feso4')} />
        </div>
        <div className="bg-red-50 p-4 rounded-2xl mt-4">
          <span className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">
            Safety Advisory
          </span>
          <p className="text-[11px] font-bold text-red-600 mb-3">
            Never taste a specimen that could be an Amanita, Galerina or other deadly genus. If tasting, chew a tiny
            piece and spit it out. Never swallow.
          </p>
          <Input
            id="taste"
            label="Taste (scientific only)"
            placeholder="Mild, acrid…"
            value={form.taste}
            onChange={set('taste')}
          />
        </div>
      </FormSection>

      <FormSection title="Microscopy" icon={Microscope} color="violet">
        <Input
          id="sporePrintColor"
          label="Spore Print Colour"
          placeholder="White, pink, rusty brown…"
          value={form.sporePrintColor}
          onChange={set('sporePrintColor')}
        />
        <div className="mb-5">
          <label htmlFor="sporeMeasurements" className={labelClass}>
            Spore measurements (µm, length × width)
          </label>
          <textarea
            id="sporeMeasurements"
            rows={3}
            placeholder="9.5 x 7, 10 x 7.5, 8.5 x 6.5 …"
            value={form.sporeMeasurements}
            onChange={(e) => set('sporeMeasurements')(e.target.value)}
            aria-invalid={!!errors.sporeMeasurements}
            className={`${fieldClass} font-mono ${errors.sporeMeasurements ? 'ring-2 ring-rose-400/60' : ''}`}
          />

          {errors.sporeMeasurements && (
            <p className="text-[11px] font-bold text-rose-600 mt-1 ml-1">{errors.sporeMeasurements}</p>
          )}
          {spores && (
            <p
              className="mt-2 text-[11px] font-bold text-violet-800 bg-violet-50 rounded-2xl p-3 font-mono"
              aria-live="polite"
            >
              {formatSporeStats(spores)}
            </p>
          )}
          <p className="text-[11px] font-medium text-gray-500 mt-1 ml-1">
            Measure at least 20 mature spores, for example from a spore print, for a reliable range.
          </p>
        </div>
        <Select
          id="melzers"
          label="Melzer's Reagent"
          options={MELZERS}
          value={form.melzers}
          onChange={set('melzers')}
        />
        <Select
          id="clampConnections"
          label="Clamp Connections"
          options={CLAMPS}
          value={form.clampConnections}
          onChange={set('clampConnections')}
        />
      </FormSection>

      <FormSection title="Ecological Data" icon={TreeDeciduous} color="teal">
        <Select
          id="trophicMode"
          label="Trophic Mode"
          options={TROPHIC}
          value={form.trophicMode}
          onChange={set('trophicMode')}
        />
        <Select
          id="substrate"
          label="Substrate"
          options={SUBSTRATE}
          value={form.substrate}
          onChange={set('substrate')}
        />
        <Input
          id="hostSpecies"
          label="Host / Associated Plant"
          placeholder="e.g. Fagus grandifolia"
          value={form.hostSpecies}
          onChange={set('hostSpecies')}
        />
        <Select
          id="habitatType"
          label="Habitat Type"
          options={HABITAT}
          value={form.habitatType}
          onChange={set('habitatType')}
        />
      </FormSection>

      <FormSection title="Voucher Specimen" icon={Database} color="indigo">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="preserved"
              type="checkbox"
              checked={form.preserved}
              onChange={(e) => set('preserved')(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
            />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Preserved</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="dnaExtracted"
              type="checkbox"
              checked={form.dnaExtracted}
              onChange={(e) => set('dnaExtracted')(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
            />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">DNA Extracted</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="herbariumCode"
            label="Herbarium Code"
            placeholder="NY, MICH, etc."
            value={form.herbariumCode}
            onChange={set('herbariumCode')}
          />
          <Input
            id="accessionNumber"
            label="Accession #"
            placeholder="MH-2026-42"
            value={form.accessionNumber}
            onChange={set('accessionNumber')}
          />
        </div>
      </FormSection>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={saving || processingPhotos}
        className="w-full bg-emerald-600 disabled:opacity-60 text-white p-4 rounded-3xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30"
      >
        <Save className="w-4 h-4" />
        <span className="font-black text-xs uppercase tracking-widest">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Record'}
        </span>
      </motion.button>
    </div>
  );
};

export default FieldEntryPage;
