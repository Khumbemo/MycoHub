import React from 'react';
import { AlertTriangle } from 'lucide-react';

const SafetyDisclaimer: React.FC = () => {
  return (
    <div role="note" className="relative z-[60] bg-red-600 text-white py-2 px-4 shadow-lg flex items-center justify-center gap-3">
      <AlertTriangle className="w-5 h-5 animate-pulse" />
      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center leading-tight">
        Safety Alert: Edibility assessments are for reference ONLY. NEVER consume wild fungi based on this database.
        Expert in-person verification required.
      </p>
    </div>
  );
};

export default SafetyDisclaimer;
