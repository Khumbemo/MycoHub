import React, { useState } from 'react';
import { Camera, MapPin, Beaker, Microscope, Tag, Save, TreeDeciduous, Database, Layers, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saveObservation } from '../../utils/observations';
import type { HabitatType, IdentificationConfidence, SubstrateType, TrophicMode } from '../../types';
import { emptyForm, parseCoord, validate, type Errors, type FormState } from '../../utils/fieldForm';

// Tailwind only ships classes it can see in full, so section colors are listed explicitly.
const sectionColors = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  teal: 'bg-teal-50 text-teal-600',
  indigo: 'bg-indigo-50 text-indigo-600',
} as const;

const FormSection: React.FC<{ title: string; icon: LucideIcon; color?: keyof typeof sectionColors; children: React.ReactNode }> = ({ title, icon: Icon, children, color = 'emerald' }) => (
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

const fieldClass = 'w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner';

const Input: React.FC<{
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  error?: string;
  required?: boolean;
}> = ({ id, label, placeholder, value, onChange, type = 'text', inputMode, error, required }) => (
  <div className="mb-5 last:mb-0 min-w-0">
    <label htmlFor={id} className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
      {label}{required && <span className="text-rose-500"> *</span>}
    </label>
    <input
      id={id}
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
      className={`${fieldClass} ${error ? 'ring-2 ring-rose-400/60' : ''}`}
    />
    {error && <p className="text-[10px] font-bold text-rose-600 mt-1 ml-1">{error}</p>}
  </div>
);

function Select<T extends string>({ id, label, options, value, onChange }: {
  id: string;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <label htmlFor={id} className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`${fieldClass} font-bold text-gray-700 appearance-none`}
      >
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

const opts = <T extends string>(pairs: [T, string][]) => pairs.map(([value, label]) => ({ value, label }));

const CONFIDENCE = opts<IdentificationConfidence>([['CERTAIN', 'Certain'], ['PROBABLE', 'Probable'], ['POSSIBLE', 'Possible'], ['GENUS_ONLY', 'Genus only']]);
const HYMENIUM = opts([['Gills', 'Gills (lamellae)'], ['Pores', 'Pores (tubes)'], ['Teeth', 'Teeth / spines'], ['Smooth', 'Smooth'], ['Ridged', 'Ridged / false gills']]);
const SPACING = opts([['Crowded', 'Crowded'], ['Close', 'Close'], ['Subdistant', 'Subdistant'], ['Distant', 'Distant'], ['N/A', 'Not applicable']]);
const TROPHIC = opts<TrophicMode>([['SAPROTROPHIC', 'Saprotrophic'], ['ECTOMYCORRHIZAL', 'Ectomycorrhizal'], ['PARASITIC', 'Parasitic'], ['ENDOPHYTIC', 'Endophytic'], ['LICHENIZED', 'Lichenized']]);
const SUBSTRATE = opts<SubstrateType>([['DEAD_WOOD', 'Dead wood'], ['LIVING_WOOD', 'Living wood'], ['SOIL', 'Soil'], ['LITTER', 'Leaf / needle litter'], ['DUNG', 'Dung'], ['OTHER_FUNGUS', 'Other fungus'], ['INVERTEBRATE', 'Invertebrate']]);
const HABITAT = opts<HabitatType>([['BROADLEAF_WOODLAND', 'Broadleaf woodland'], ['CONIFEROUS_FOREST', 'Coniferous forest'], ['GRASSLAND', 'Grassland'], ['HEATH', 'Heath'], ['WETLAND', 'Wetland'], ['URBAN', 'Urban / parkland']]);

const FieldEntryPage: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(() => emptyForm(user?.displayName ?? ''));
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'warn' | 'error'; text: string } | null>(null);

  const set = <K extends keyof FormState>(key: K) => (value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const fillCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setNotice({ kind: 'error', text: 'This device does not provide location. Enter coordinates by hand.' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(5),
          longitude: pos.coords.longitude.toFixed(5),
        }));
        setLocating(false);
      },
      () => {
        setNotice({ kind: 'error', text: 'Location permission was denied or unavailable. Enter coordinates by hand.' });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const handlePublish = async () => {
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
      const { eventDate, latitude, longitude, ...rest } = form;
      const { synced } = await saveObservation({
        ...rest,
        userId: user.id,
        timestamp: new Date(eventDate + 'T12:00:00').toISOString(),
        latitude: parseCoord(latitude, 90) ?? null,
        longitude: parseCoord(longitude, 180) ?? null,
        photos,
      });
      setNotice(synced
        ? { kind: 'ok', text: `Saved ${form.collectionNumber} and synced to the cloud.` }
        : { kind: 'warn', text: `Saved ${form.collectionNumber} on this device. It has not been synced to the cloud.` });
      setForm(emptyForm(form.collectorName));
      setPhotos([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error(e);
      setNotice({ kind: 'error', text: 'Could not save: local storage on this device is unavailable.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-12 pt-4">
      <div className="flex justify-between items-end gap-4 mb-6 px-2">
        <div className="min-w-0">
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter leading-none">Scientific Record</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Darwin Core field terms</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handlePublish}
          disabled={saving}
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
            notice.kind === 'ok' ? 'bg-emerald-50 text-emerald-700' : notice.kind === 'warn' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {notice.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          <span className="flex-1">{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X className="w-4 h-4" /></button>
        </div>
      )}

      <FormSection title="Collection Metadata" icon={Database} color="blue">
        <div className="grid grid-cols-2 gap-4">
          <Input id="collectorName" label="Collector (recordedBy)" placeholder="Jane Mycologist" value={form.collectorName} onChange={set('collectorName')} error={errors.collectorName} required />
          <Input id="collectionNumber" label="Collection # (recordNumber)" placeholder="JM-2026-04" value={form.collectionNumber} onChange={set('collectionNumber')} error={errors.collectionNumber} required />
        </div>
        <Input id="eventDate" label="Date collected (eventDate)" type="date" value={form.eventDate} onChange={set('eventDate')} error={errors.eventDate} required />
        <Input id="locality" label="Site / Locality" placeholder="Black Rock Forest, NY" value={form.locality} onChange={set('locality')} />
        <div className="grid grid-cols-2 gap-4">
          <Input id="latitude" label="Latitude (WGS84)" placeholder="41.378" inputMode="decimal" value={form.latitude} onChange={set('latitude')} error={errors.latitude} />
          <Input id="longitude" label="Longitude (WGS84)" placeholder="-74.004" inputMode="decimal" value={form.longitude} onChange={set('longitude')} error={errors.longitude} />
        </div>
        <button
          type="button"
          onClick={fillCurrentLocation}
          disabled={locating}
          className="w-full mt-1 bg-blue-50 text-blue-700 p-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
        >
          <MapPin className="w-4 h-4" />
          {locating ? 'Locating…' : 'Use current location'}
        </button>
      </FormSection>

      <FormSection title="Taxonomy" icon={Tag}>
        <div className="bg-emerald-50/50 p-4 rounded-2xl mb-4 flex items-center gap-3">
          <Layers className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest">Naming</span>
            <span className="text-xs font-bold text-emerald-600">Binomial with authority, e.g. Amanita muscaria (L.) Lam.</span>
          </div>
        </div>
        <Input id="scientificName" label="Scientific Name" placeholder="e.g. Amanita muscaria" value={form.scientificName} onChange={set('scientificName')} error={errors.scientificName} required />
        <Select id="identificationConfidence" label="Confidence Level" options={CONFIDENCE} value={form.identificationConfidence} onChange={set('identificationConfidence')} />
      </FormSection>

      <FormSection title="Photographs" icon={Camera} color="emerald">
        <label htmlFor="photos" className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer text-gray-400">
          <Camera className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Add photos (habitat, cap, hymenium, stipe)</span>
        </label>
        <input
          id="photos"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            setPhotos((prev) => [...prev, ...files]);
            e.target.value = '';
          }}
        />
        {photos.length > 0 && (
          <ul className="mt-4 space-y-2">
            {photos.map((p, i) => (
              <li key={`${p.name}-${i}`} className="flex items-center justify-between gap-2 bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold text-gray-600">
                <span className="truncate">{p.name}</span>
                <button onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} aria-label={`Remove ${p.name}`}>
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </FormSection>

      <FormSection title="Morphology: Pileus & Hymenium" icon={Microscope} color="amber">
        <div className="grid grid-cols-2 gap-4">
          <Input id="capDiameterMm" label="Cap Diameter (mm)" placeholder="40-120" value={form.capDiameterMm} onChange={set('capDiameterMm')} />
          <Input id="capShape" label="Cap Shape" placeholder="Convex to plane" value={form.capShape} onChange={set('capShape')} />
        </div>
        <Input id="capColor" label="Cap Color (Munsell/Kornerup)" placeholder="7.5R 4/12" value={form.capColor} onChange={set('capColor')} />
        <div className="h-px bg-gray-100 my-4" />
        <Select id="hymeniumType" label="Hymenium Type" options={HYMENIUM} value={form.hymeniumType} onChange={set('hymeniumType')} />
        <Select id="gillSpacing" label="Gill Spacing" options={SPACING} value={form.gillSpacing} onChange={set('gillSpacing')} />
        <Input id="attachment" label="Attachment" placeholder="Free, adnexed, adnate, decurrent…" value={form.attachment} onChange={set('attachment')} />
      </FormSection>

      <FormSection title="Context & Reactions" icon={Beaker} color="rose">
        <Input id="odor" label="Odor" placeholder="Farinaceous, anise, etc." value={form.odor} onChange={set('odor')} />
        <Input id="bruising" label="Bruising Reaction" placeholder="Yellowing within 2 min" value={form.bruising} onChange={set('bruising')} />
        <div className="grid grid-cols-2 gap-4">
          <Input id="koh" label="KOH Reaction" placeholder="Negative" value={form.koh} onChange={set('koh')} />
          <Input id="feso4" label="FeSO4" placeholder="Olive-green" value={form.feso4} onChange={set('feso4')} />
        </div>
        <div className="bg-red-50 p-4 rounded-2xl mt-4">
          <span className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Safety Advisory</span>
          <p className="text-[10px] font-bold text-red-500 mb-3">Never taste a specimen that could be an Amanita, Galerina or other deadly genus. If tasting, chew a tiny piece and spit it out. Never swallow.</p>
          <Input id="taste" label="Taste (scientific only)" placeholder="Mild, acrid…" value={form.taste} onChange={set('taste')} />
        </div>
      </FormSection>

      <FormSection title="Ecological Data" icon={TreeDeciduous} color="teal">
        <Select id="trophicMode" label="Trophic Mode" options={TROPHIC} value={form.trophicMode} onChange={set('trophicMode')} />
        <Select id="substrate" label="Substrate" options={SUBSTRATE} value={form.substrate} onChange={set('substrate')} />
        <Input id="hostSpecies" label="Host / Associated Plant" placeholder="e.g. Fagus grandifolia" value={form.hostSpecies} onChange={set('hostSpecies')} />
        <Select id="habitatType" label="Habitat Type" options={HABITAT} value={form.habitatType} onChange={set('habitatType')} />
      </FormSection>

      <FormSection title="Voucher Specimen" icon={Database} color="indigo">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input id="preserved" type="checkbox" checked={form.preserved} onChange={(e) => set('preserved')(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Preserved</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input id="dnaExtracted" type="checkbox" checked={form.dnaExtracted} onChange={(e) => set('dnaExtracted')(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">DNA Extracted</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input id="herbariumCode" label="Herbarium Code" placeholder="NY, MICH, etc." value={form.herbariumCode} onChange={set('herbariumCode')} />
          <Input id="accessionNumber" label="Accession #" placeholder="MH-2026-42" value={form.accessionNumber} onChange={set('accessionNumber')} />
        </div>
      </FormSection>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handlePublish}
        disabled={saving}
        className="w-full bg-emerald-600 disabled:opacity-60 text-white p-4 rounded-3xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30"
      >
        <Save className="w-4 h-4" />
        <span className="font-black text-xs uppercase tracking-widest">{saving ? 'Saving…' : 'Save Record'}</span>
      </motion.button>
    </div>
  );
};

export default FieldEntryPage;
