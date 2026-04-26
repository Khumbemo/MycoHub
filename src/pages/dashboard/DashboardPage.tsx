import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Map as MapIcon, Clock, CheckCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2">
    <div className={+`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`+}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-2xl font-black text-gray-800">{value}</span>
  </div>
);

const DashboardPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-4">Field Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={TrendingUp}
            label="Total Obs"
            value="1,284"
            color="bg-emerald-500"
          />
          <StatCard
            icon={CheckCircle}
            label="Verified"
            value="856"
            color="bg-teal-500"
          />
          <StatCard
            icon={MapIcon}
            label="Regions"
            value="12"
            color="bg-cyan-500"
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value="42"
            color="bg-amber-500"
          />
        </div>
      </section>

      <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm">Recent Activity</h3>
          <button className="text-emerald-600 font-bold text-xs uppercase tracking-widest">View All</button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-black text-xs">IMG</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 text-sm">Amanita muscaria</h4>
                <p className="text-[10px] text-gray-400 font-medium italic">Verified by Dr. Fungi • 2h ago</p>
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="h-48 bg-gray-200 rounded-[2rem] relative overflow-hidden shadow-inner flex items-center justify-center">
         <MapIcon className="w-12 h-12 text-gray-400 opacity-50" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
         <span className="absolute bottom-4 left-6 text-white font-black text-xs uppercase tracking-widest">Interactive Distribution Map</span>
      </section>
    </div>
  );
};

export default DashboardPage;
