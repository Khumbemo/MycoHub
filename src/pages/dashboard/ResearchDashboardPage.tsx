import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, FlaskConical, ClipboardList, Microchip, Binary } from 'lucide-react';

const LabMetric = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-2xl bg-${color}-50 text-${color}-600 shadow-sm shadow-${color}-200/50`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
        <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</span>
        <span className="text-xl font-black text-gray-800">{value}</span>
    </div>
  </div>
);

const ResearchDashboardPage: React.FC = () => {
  return (
    <div className="pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Research Lab</h2>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1">Site-Level Diversity Metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        <LabMetric label="Shannon Diversity Index" value="3.42" icon={Binary} color="emerald" />
        <div className="grid grid-cols-2 gap-4">
            <LabMetric label="Species Richness" value="128" icon={FlaskConical} color="blue" />
            <LabMetric label="DwC Submissions" value="842" icon={ClipboardList} color="purple" />
        </div>
      </div>

      <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden mb-8">
          <div className="relative z-10">
              <h3 className="text-xl font-black tracking-tight mb-2 italic">Phenology Analysis</h3>
              <p className="text-xs text-gray-400 font-bold mb-6">Fruiting distribution across seasons</p>

              <div className="flex items-end gap-3 h-32 mb-4">
                  {[40, 70, 90, 60, 30, 20, 50, 80, 100, 70, 40, 20].map((h, i) => (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        key={i}
                        className="flex-1 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      />
                  ))}
              </div>
              <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase tracking-widest px-1">
                  <span>Jan</span>
                  <span>Jun</span>
                  <span>Dec</span>
              </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-[60px] -ml-24 -mb-24" />
      </div>

      <div className="space-y-4">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Recent Lab Assignments</h4>
          {[1, 2].map((i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center group active:scale-95 transition-all">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <Microchip className="w-6 h-6" />
                      </div>
                      <div>
                          <span className="block text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Assigned Task</span>
                          <span className="font-black text-gray-800 tracking-tight">DNA Sequence Sync #{i}</span>
                      </div>
                  </div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
          ))}
      </div>
    </div>
  );
};

export default ResearchDashboardPage;
