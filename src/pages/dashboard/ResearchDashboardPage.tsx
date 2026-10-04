import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, ClipboardList, Binary, Sigma } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocalRecords, shannonIndex, speciesCounts } from '../../utils/observations';

// Tailwind only ships classes it can see in full, so metric colors are listed explicitly.
const metricColors = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
} as const;

const LabMetric: React.FC<{ label: string; value: string | number; icon: LucideIcon; color: keyof typeof metricColors; hint?: string }> = ({ label, value, icon: Icon, color, hint }) => (
  <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 min-w-0">
    <div className={`p-3 rounded-2xl shadow-sm ${metricColors[color]}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</span>
      <span className="text-xl font-black text-gray-800 tabular-nums">{value}</span>
      {hint && <span className="block text-[9px] font-bold text-gray-400 mt-0.5">{hint}</span>}
    </div>
  </div>
);

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const ResearchDashboardPage: React.FC = () => {
  const records = useLocalRecords();
  const list = useMemo(() => records ?? [], [records]);

  const { richness, shannon, evenness, monthly, top } = useMemo(() => {
    const counts = speciesCounts(list);
    const values = [...counts.values()];
    const h = shannonIndex(values);
    const s = counts.size;
    const months = new Array(12).fill(0) as number[];
    for (const r of list) months[new Date(r.timestamp).getMonth()]++;
    return {
      richness: s,
      shannon: h,
      // Pielou's evenness J' = H' / ln S (undefined for S < 2)
      evenness: s > 1 ? h / Math.log(s) : null,
      monthly: months,
      top: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [list]);

  const maxMonth = Math.max(1, ...monthly);

  return (
    <div className="pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Research Lab</h2>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1">Diversity metrics from your records</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        <LabMetric label="Shannon Diversity H′" value={shannon.toFixed(2)} icon={Binary} color="emerald" hint="−Σ pᵢ ln pᵢ over species counts" />
        <div className="grid grid-cols-2 gap-4">
          <LabMetric label="Species Richness S" value={richness} icon={FlaskConical} color="blue" />
          <LabMetric label="Records" value={list.length} icon={ClipboardList} color="purple" />
        </div>
        <LabMetric label="Pielou Evenness J′" value={evenness === null ? '—' : evenness.toFixed(2)} icon={Sigma} color="amber" hint={evenness === null ? 'Needs at least 2 species' : 'H′ / ln S, from 0 to 1'} />
      </div>

      <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden mb-8">
        <div className="relative z-10">
          <h3 className="text-xl font-black tracking-tight mb-2 italic">Phenology</h3>
          <p className="text-xs text-gray-400 font-bold mb-6">Records per month of collection</p>

          <div className="flex items-end gap-2 h-32 mb-2">
            {monthly.map((n, i) => (
              <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1">
                {n > 0 && <span className="text-[8px] font-black text-emerald-300 tabular-nums">{n}</span>}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(n / maxMonth) * 85}%` }}
                  className="w-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] min-h-[3px]"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 text-[8px] font-black text-gray-500 uppercase">
            {MONTHS.map((m, i) => <span key={i} className="flex-1 text-center">{m}</span>)}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-[60px] -ml-24 -mb-24" />
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Most recorded taxa</h4>
        {top.length === 0 && (
          <p className="bg-white p-6 rounded-[2rem] border border-gray-100 text-sm font-bold text-gray-500">
            Save field records to see diversity metrics. Each distinct scientific name counts as one taxon.
          </p>
        )}
        {top.map(([name, n]) => (
          <div key={name} className="bg-white p-5 rounded-[2rem] border border-gray-100 flex justify-between items-center gap-4">
            <span className="font-black italic text-gray-800 truncate">{name}</span>
            <span className="text-xs font-black text-emerald-600 tabular-nums flex-shrink-0">
              {n} · {((n / list.length) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResearchDashboardPage;
