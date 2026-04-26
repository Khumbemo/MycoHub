import React from 'react';
import { Search, Info, ExternalLink, GitBranch, AlertCircle } from 'lucide-react';

const SpeciesCard = ({ name, author, status, common }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-4">
    <div className="flex justify-between items-start mb-2">
      <div>
        <h3 className="text-lg font-black italic text-gray-800 leading-tight">{name}</h3>
        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{author}</p>
      </div>
      <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${status === 'VALID' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
        {status}
      </div>
    </div>
    {common && <p className="text-xs font-bold text-gray-500 mb-4">{common}</p>}
    <div className="flex gap-2">
        <button className="flex-1 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 p-2 rounded-xl transition-all flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Details</span>
        </button>
        <button className="bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 p-2 rounded-xl transition-all">
            <ExternalLink className="w-4 h-4" />
        </button>
    </div>
  </div>
);

const SpeciesDBPage: React.FC = () => {
  return (
    <div className="pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Taxonomy Backbone</h2>
        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Index Fungorum Sync: Online
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search Scientific Name / IF Number..."
          className="w-full bg-white border-none rounded-[2rem] py-4 pl-14 pr-6 text-sm font-bold shadow-sm focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 mb-8">
          <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest">Nomenclature Update</h4>
          </div>
          <p className="text-xs font-bold text-amber-700 leading-relaxed">
            The genus <span className="italic">Cantharellus</span> has recently seen significant taxonomic revisions.
            Ensure your local cache is synchronized before critical field assignments.
          </p>
      </div>

      <div className="space-y-4">
        <SpeciesCard
          name="Amanita muscaria"
          author="(L.) Lam."
          status="VALID"
          common="Fly Agaric"
        />
        <SpeciesCard
          name="Cantharellus cibarius"
          author="Fr."
          status="VALID"
          common="Chanterelle"
        />
        <div className="opacity-60 grayscale-[0.5]">
            <SpeciesCard
              name="Agaricus muscarius"
              author="L."
              status="INVALID"
              common="Basionym for A. muscaria"
            />
            <div className="flex items-center gap-2 ml-6 -mt-2 mb-6">
                <GitBranch className="w-4 h-4 text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synonymized under A. muscaria</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SpeciesDBPage;
