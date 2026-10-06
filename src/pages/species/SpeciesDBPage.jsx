import React, { useMemo, useState } from 'react';
import { Search, ExternalLink, GitBranch, AlertTriangle, ChevronDown } from 'lucide-react';
import { SPECIES } from '../../data/species';

const SpeciesCard = ({ species: s }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="text-lg font-black italic text-gray-800 leading-tight">{s.scientificName}</h3>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{s.authorCitation}</p>
        </div>
        <div className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-600 flex-shrink-0">
          {s.nomenclaturalStatus === 'VALID' ? 'Accepted' : s.nomenclaturalStatus}
        </div>
      </div>
      {s.commonName && <p className="text-xs font-bold text-gray-500 mb-3">{s.commonName}</p>}
      {s.toxicity && (
        <p className="flex items-center gap-2 text-[10px] font-black text-rose-600 bg-rose-50 rounded-xl px-3 py-2 mb-3 uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {s.toxicity}
        </p>
      )}
      {open && (
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-xs mb-4 bg-gray-50 rounded-2xl p-4">
          {['phylum', 'class', 'order', 'family', 'genus'].map((rank) => (
            <React.Fragment key={rank}>
              <dt className="font-black text-gray-500 uppercase tracking-widest text-[10px] pt-0.5">{rank}</dt>
              <dd className="font-bold text-gray-700">{s.taxonomy[rank]}</dd>
            </React.Fragment>
          ))}
          {s.synonyms.length > 0 && (
            <>
              <dt className="font-black text-gray-500 uppercase tracking-widest text-[10px] pt-0.5">Synonyms</dt>
              <dd className="font-bold text-gray-700">
                {s.synonyms.map((syn) => (
                  <span key={syn} className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-gray-500" />
                    <i>{syn}</i>
                  </span>
                ))}
              </dd>
            </>
          )}
        </dl>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex-1 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 p-2 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{open ? 'Hide' : 'Classification'}</span>
        </button>
        <a
          href={`https://www.gbif.org/species/search?q=${encodeURIComponent(s.scientificName)}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${s.scientificName} on GBIF`}
          className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 p-2 rounded-xl transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
        >
          GBIF <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

const SpeciesDBPage = () => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SPECIES;
    return SPECIES.filter((s) =>
      [s.scientificName, s.commonName ?? '', s.taxonomy.family, s.taxonomy.order, ...s.synonyms].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  }, [query]);

  return (
    <div className="pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Taxonomy Reference</h2>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">
          Offline list · {SPECIES.length} taxa · authorities per Species Fungorum
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
        <label htmlFor="species-search" className="sr-only">
          Search species
        </label>
        <input
          id="species-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Scientific name, common name, family, synonym…"
          className="w-full bg-white border-none rounded-[2rem] py-4 pl-14 pr-6 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div className="space-y-4">
        {results.map((s) => (
          <SpeciesCard key={s.id} species={s} />
        ))}
        {results.length === 0 && (
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 text-sm font-bold text-gray-500">
            No match in the offline list.{' '}
            <a
              className="text-emerald-600 underline"
              href={`https://www.gbif.org/species/search?q=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noreferrer"
            >
              Search GBIF for “{query}”
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeciesDBPage;
