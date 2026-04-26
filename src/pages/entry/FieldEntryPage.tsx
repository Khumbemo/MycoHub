import React, { useState } from 'react';
import { Camera, MapPin, Beaker, Microscope, Tag, Save, TreeDeciduous, Database, Layers, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const FormSection = ({ title, icon: Icon, children, color = "emerald" }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-6">
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2 bg-${color}-50 text-${color}-600 rounded-xl`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm">{title}</h3>
    </div>
    {children}
  </div>
);

const Input = ({ label, placeholder, type = "text", helper }: any) => (
  <div className="mb-5 last:mb-0">
    <div className="flex justify-between items-center mb-1.5 ml-1">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      {helper && <Info className="w-3 h-3 text-gray-300 cursor-help" />}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
    />
  </div>
);

const Select = ({ label, options }: any) => (
  <div className="mb-5 last:mb-0">
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
    <select className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500/20 appearance-none shadow-inner">
      {options.map((opt: string) => <option key={opt}>{opt}</option>)}
    </select>
  </div>
);

const FieldEntryPage: React.FC = () => {
  return (
    <div className="pb-12 pt-4">
      <div className="flex justify-between items-end mb-8 px-2">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter leading-none">Scientific Record</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">DwC-Compliant Submission</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-emerald-600/30"
        >
          <Save className="w-4 h-4" />
          <span className="font-black text-xs uppercase tracking-widest">Publish</span>
        </motion.button>
      </div>

      <FormSection title="Collection Metadata" icon={Database} color="blue">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Collector Name" placeholder="Jane Mycologist" />
          <Input label="Collection #" placeholder="JM-2026-04" />
        </div>
        <Input label="Site / Locality" placeholder="Black Rock Forest, NY" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Latitude (WGS84)" placeholder="41.378" />
          <Input label="Longitude (WGS84)" placeholder="-74.004" />
        </div>
      </FormSection>

      <FormSection title="Taxonomy" icon={Tag}>
        <div className="bg-emerald-50/50 p-4 rounded-2xl mb-4 flex items-center gap-3">
            <Layers className="w-5 h-5 text-emerald-600" />
            <div className="flex-1">
                <span className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest">Automatic Hierarchy</span>
                <span className="text-xs font-bold text-emerald-600">Kingdom: Fungi → Phylum: Basidiomycota ...</span>
            </div>
        </div>
        <Input label="Scientific Name" placeholder="e.g. Amanita muscaria (L.) Lam." />
        <Select label="Confidence Level" options={['Certain', 'Probable', 'Possible', 'Genus-only']} />
      </FormSection>

      <FormSection title="Morphology: Pileus & Hymenium" icon={Microscope} color="amber">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Cap Diameter (mm)" placeholder="40-120" />
          <Input label="Cap Shape" placeholder="Convex to Plano" />
        </div>
        <Input label="Cap Color (Munsell/Kornerup)" placeholder="7.5R 4/12" />
        <div className="h-px bg-gray-100 my-4" />
        <Select label="Hymenium Type" options={['Gills', 'Pores', 'Teeth', 'Spines', 'Smooth', 'Ridged']} />
        <Select label="Gill Spacing" options={['Crowded', 'Close', 'Subdistant', 'Distant']} />
        <Input label="Attachment" placeholder="Adnate, Decurrent..." />
      </FormSection>

      <FormSection title="Context & Reactions" icon={Beaker} color="rose">
        <Input label="Odor" placeholder="Farinaceous, Anise, etc." />
        <Input label="Bruising Reaction" placeholder="Yellowing in 2 mins" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="KOH Reaction" placeholder="Negative" />
          <Input label="FeSO4" placeholder="Olive-green" />
        </div>
        <div className="bg-red-50 p-4 rounded-2xl mt-4">
            <span className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Safety Advisory</span>
            <Input label="Taste (Scientific only)" placeholder="Mild, Acrid..." />
        </div>
      </FormSection>

      <FormSection title="Ecological Data" icon={TreeDeciduous} color="teal">
        <Select label="Trophic Mode" options={['Saprotrophic', 'Ectomycorrhizal', 'Parasitic', 'Endophytic']} />
        <Select label="Substrate" options={['Dead Wood', 'Living Wood', 'Soil', 'Dung', 'Litter']} />
        <Input label="Host Species" placeholder="e.g. Fagus grandifolia" />
        <Select label="Habitat Type" options={['Broadleaf Woodland', 'Coniferous Forest', 'Grassland', 'Heath']} />
      </FormSection>

      <FormSection title="Voucher Specimen" icon={Database} color="indigo">
        <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Preserved</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">DNA Extracted</span>
            </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Herbarium Code" placeholder="NY, MICH, etc." />
          <Input label="Accession #" placeholder="MH-2026-42" />
        </div>
      </FormSection>
    </div>
  );
};

export default FieldEntryPage;
