import React from 'react';
import { ShieldCheck, MessageSquare, CheckCircle2, AlertOctagon, UserCircle2 } from 'lucide-react';

const VerificationTicket = ({ obsName, collector, status, agreement }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-4 overflow-hidden relative">
    {status === 'RESEARCH_GRADE' && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1.5 rounded-bl-2xl flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Research Grade</span>
        </div>
    )}

    <div className="flex gap-4 mb-6">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
            <UserCircle2 className="w-8 h-8 text-gray-300" />
        </div>
        <div>
            <h4 className="font-black italic text-gray-800 leading-tight">{obsName}</h4>
            <p className="text-[10px] font-bold text-gray-400 mt-1">Observed by {collector}</p>
        </div>
    </div>

    <div className="bg-gray-50/50 p-4 rounded-2xl mb-6">
        <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identification Log</span>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{agreement} Agreements</span>
        </div>
        <div className="space-y-3">
            {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-gray-700">Dr. Mycologist (Identifier) confirmed ID</span>
                </div>
            ))}
        </div>
    </div>

    <div className="flex gap-2">
        <button className="flex-1 bg-emerald-600 text-white p-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
            <CheckCircle2 className="w-4 h-4" />
            Agree
        </button>
        <button className="flex-1 bg-white border border-gray-100 text-gray-400 p-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
            <AlertOctagon className="w-4 h-4" />
            Flag
        </button>
        <button className="bg-gray-50 text-gray-400 p-3 rounded-xl">
            <MessageSquare className="w-4 h-4" />
        </button>
    </div>
  </div>
);

const CommunityPage: React.FC = () => {
  return (
    <div className="pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Verification Pipeline</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Expert-Led Peer Review</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
              <span className="text-2xl font-black text-emerald-600">42</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Pending Review</span>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
              <span className="text-2xl font-black text-blue-600">8</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Expert Curations</span>
          </div>
      </div>

      <div className="space-y-4">
        <VerificationTicket
          obsName="Omphalotus olearius"
          collector="Jane Doe"
          status="UNVERIFIED"
          agreement="1"
        />
        <VerificationTicket
          obsName="Pleurotus ostreatus"
          collector="John Smith"
          status="RESEARCH_GRADE"
          agreement="3"
        />
      </div>
    </div>
  );
};

export default CommunityPage;
