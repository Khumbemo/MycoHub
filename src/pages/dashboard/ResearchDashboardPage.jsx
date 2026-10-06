import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, ClipboardList, Binary, Sigma, Telescope, MapPin } from 'lucide-react';
import { useLocalRecords } from '../../utils/observations';
import { chao1, groupBySite, rarefactionCurve, shannonIndex, speciesCounts } from '../../utils/stats';
import RarefactionChart from '../../components/RarefactionChart';

// Tailwind only ships classes it can see in full, so metric colors are listed explicitly.
const metricColors = {
  emerald: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  amber: 'bg-amber-50 text-amber-700',
  teal: 'bg-teal-50 text-teal-700',
};

const LabMetric = ({ label, value, icon: Icon, color, hint }) => (
  <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 min-w-0">
    <div className={`p-3 rounded-2xl shadow-sm ${metricColors[color]}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
        {label}
      </span>
      <span className="text-xl font-black text-gray-800 tabular-nums">{value}</span>
      {hint && <span className="block text-[11px] font-bold text-gray-500 mt-0.5">{hint}</span>}
    </div>
  </div>
);

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const ALL = '__all__';

const ResearchDashboardPage = () => {
  const records = useLocalRecords();
  const all = useMemo(() => records ?? [], [records]);
  const [site, setSite] = useState(ALL);

  const sites = useMemo(() => {
    const groups = groupBySite(all);
    return [...groups.entries()]
      .filter(([key]) => key)
      .map(([key, recs]) => ({ key, label: recs[0].locality.trim(), count: recs.length }))
      .sort((a, b) => b.count - a.count);
  }, [all]);

  const list = useMemo(
    () => (site === ALL ? all : all.filter((r) => r.locality.trim().toLowerCase() === site)),
    [all, site],
  );

  const m = useMemo(() => {
    const counts = speciesCounts(list);
    const values = [...counts.values()];
    const h = shannonIndex(values);
    const s = counts.size;
    const c1 = chao1(values);
    const months = new Array(12).fill(0);
    for (const r of list) months[new Date(r.timestamp).getMonth()]++;
    const visits = new Set(list.map((r) => `${r.locality.trim().toLowerCase()}|${r.timestamp.slice(0, 10)}`)).size;
    return {
      richness: s,
      shannon: h,
      // Pielou's evenness J' = H' / ln S (undefined for S < 2)
      evenness: s > 1 ? h / Math.log(s) : null,
      chao1: c1,
      completeness: c1 > 0 ? s / c1 : null,
      singletons: values.filter((v) => v === 1).length,
      curve: rarefactionCurve(values, 40),
      monthly: months,
      visits,
      top: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [list]);

  const maxMonth = Math.max(1, ...m.monthly);
  const named = list.filter((r) => r.scientificName.trim()).length;

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Research Lab</h2>
        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.2em] mt-1">
          Diversity metrics from your records
        </p>
      </div>

      <div className="mb-6">
        <label
          htmlFor="site"
          className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1"
        >
          Site
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <select
            id="site"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-gray-700 appearance-none shadow-sm"
          >
            <option value={ALL}>All sites ({all.length} records)</option>
            {sites.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label} ({s.count})
              </option>
            ))}
          </select>
        </div>
        <p className="text-[11px] font-medium text-gray-500 mt-1.5 ml-1">
          {m.visits} visit{m.visits === 1 ? '' : 's'} (site × date). Pooling sites mixes communities; compare sites one
          at a time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <LabMetric label="Species Richness S" value={m.richness} icon={FlaskConical} color="blue" />
          <LabMetric label="Records" value={named} icon={ClipboardList} color="purple" />
        </div>
        <LabMetric
          label="Chao1 Estimated Richness"
          value={m.richness ? m.chao1.toFixed(1) : '—'}
          icon={Telescope}
          color="teal"
          hint={
            m.completeness !== null
              ? `Sampled ${(m.completeness * 100).toFixed(0)}% of estimated species · ${m.singletons} singleton${m.singletons === 1 ? '' : 's'}`
              : 'S + f1(f1 − 1) / 2(f2 + 1)'
          }
        />

        <LabMetric
          label="Shannon Diversity H′"
          value={m.shannon.toFixed(2)}
          icon={Binary}
          color="emerald"
          hint="−Σ pᵢ ln pᵢ over species counts"
        />
        <LabMetric
          label="Pielou Evenness J′"
          value={m.evenness === null ? '—' : m.evenness.toFixed(2)}
          icon={Sigma}
          color="amber"
          hint={m.evenness === null ? 'Needs at least 2 species' : 'H′ / ln S, from 0 to 1'}
        />
      </div>

      {m.curve.length > 1 && (
        <section className="bg-white p-6 rounded-[2rem] border border-gray-100 mb-8">
          <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm">Species accumulation</h3>
          <p className="text-[11px] font-bold text-gray-500 mb-3">
            A curve still climbing at its end means more species remain to be found.
          </p>
          <RarefactionChart points={m.curve} chao1={m.chao1} />
        </section>
      )}

      <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden mb-8">
        <div className="relative z-10">
          <h3 className="text-xl font-black tracking-tight mb-2 italic">Phenology</h3>
          <p className="text-xs text-gray-500 font-bold mb-6">Records per month of collection</p>

          <div className="flex items-end gap-2 h-32 mb-2">
            {m.monthly.map((n, i) => (
              <div
                key={i}
                className="flex-1 h-full flex flex-col justify-end items-center gap-1"
                title={`${MONTH_NAMES[i]}: ${n} record${n === 1 ? '' : 's'}`}
              >
                {n > 0 && <span className="text-[10px] font-black text-emerald-300 tabular-nums">{n}</span>}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(n / maxMonth) * 85}%` }}
                  className="w-full bg-emerald-500 rounded-full min-h-[3px]"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 text-[10px] font-black text-gray-500 uppercase" aria-hidden="true">
            {MONTHS.map((mo, i) => (
              <span key={i} className="flex-1 text-center">
                {mo}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">Most recorded taxa</h4>
        {m.top.length === 0 && (
          <p className="bg-white p-6 rounded-[2rem] border border-gray-100 text-sm font-bold text-gray-600">
            Save field records to see diversity metrics. Each distinct scientific name counts as one taxon.
          </p>
        )}
        {m.top.map(([name, n]) => (
          <div
            key={name}
            className="bg-white p-5 rounded-[2rem] border border-gray-100 flex justify-between items-center gap-4"
          >
            <span className="font-black italic text-gray-800 truncate">{name}</span>
            <span className="text-xs font-black text-emerald-700 tabular-nums flex-shrink-0">
              {n} · {((n / named) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      <p className="text-[11px] font-medium text-gray-500 mt-6 leading-relaxed">
        Fruit-body surveys detect only species fruiting during visits, so richness estimates need repeated visits across
        seasons and years. Chao1: Chao (1987), bias-corrected form. Rarefaction: Hurlbert (1971).
      </p>
    </div>
  );
};

export default ResearchDashboardPage;
