import { AlertTriangle } from 'lucide-react';

const SafetyDisclaimer = () => {
  return (
    <div
      role="note"
      className="relative z-30 bg-red-600 text-white px-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 shadow-lg flex items-center justify-center gap-3 short:py-1 short:gap-2 rail:rounded-b-2xl rail:mx-4 sm:rail:mx-6 wide:mx-8"
    >
      <AlertTriangle className="w-5 h-5 short:w-4 short:h-4 animate-pulse flex-shrink-0" aria-hidden="true" />
      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest short:tracking-wide text-center leading-tight">
        Safety Alert: Edibility assessments are for reference ONLY. NEVER consume wild fungi based on this database.
        Expert in-person verification required.
      </p>
    </div>
  );
};

export default SafetyDisclaimer;
