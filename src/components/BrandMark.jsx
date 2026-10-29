import { cn } from '../utils/cn';

/** MycoHub mark: a stylised fly agaric on a moss tile. */
const BrandMark = ({ className }) => (
  <span
    className={cn(
      'w-9 h-9 bg-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm',
      className,
    )}
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" className="w-[62%] h-[62%]">
      <path d="M2.5 12.2C2.5 6.9 6.8 3.5 12 3.5s9.5 3.4 9.5 8.7c-2.8.9-16.2.9-19 0z" fill="#C8372D" />
      <circle cx="8" cy="8.2" r="1.15" fill="#F7F6F2" />
      <circle cx="12.3" cy="6.2" r="1.25" fill="#F7F6F2" />
      <circle cx="16.2" cy="8.8" r="1" fill="#F7F6F2" />
      <circle cx="10.6" cy="10" r=".8" fill="#F7F6F2" />
      <path d="M10 13.3h4l.7 6.6c.06.6-.4 1.1-1 1.1h-3.4c-.6 0-1.06-.5-1-1.1z" fill="#F7F6F2" />
    </svg>
  </span>
);

export default BrandMark;
