import { AlertTriangle } from 'lucide-react';

const SafetyDisclaimer = () => {
  return (
    <div
      role="note"
      className="relative z-30 bg-red-700 text-white px-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 flex items-center justify-center gap-2.5 short:py-1 rail:rounded-b-xl rail:mx-4 sm:rail:mx-6 wide:mx-8"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <p className="text-[12px] md:text-[13px] leading-snug text-center">
        <span className="uppercase text-[11px] mr-1.5 opacity-90">Safety</span>
        Edibility notes are for reference only. Never eat a wild mushroom identified with this app; get an expert to
        check it in person.
      </p>
    </div>
  );
};

export default SafetyDisclaimer;
