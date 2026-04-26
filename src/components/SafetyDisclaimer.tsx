import React from 'react';
import { AlertTriangle } from 'lucide-react';

const SafetyDisclaimer: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white py-2 px-4 shadow-lg flex items-center justify-center gap-3">
      <AlertTriangle className="w-5 h-5 animate-pulse" />
      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center leading-tight">
        Safety Alert: Edibility assessments are for reference ONLY. NEVER consume wild fungi based on this database.
        Expert in-person verification required.
      </p>
    </div>
  );
};

export default SafetyDisclaimer;
