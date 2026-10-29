import { useEffect, useState } from 'react';
import { NavLink, useOutlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  PlusSquare,
  BookOpen,
  Users,
  Activity,
  Settings,
  ArrowLeft,
  MessageCircle,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { startAutoSync, useSyncState } from '../../utils/sync';
import { RAIL_QUERY, useMediaQuery } from '../../utils/layout';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import SafetyDisclaimer from '../SafetyDisclaimer';

// `label` is the short name for the phone tab bar and the rail; `title` is used
// in the full sidebar on wide screens.
const navItems = [
  { to: '/', icon: Home, label: 'Dash', title: 'Dashboard' },
  { to: '/research', icon: Activity, label: 'Labs', title: 'Research Lab' },
  { to: '/entry', icon: PlusSquare, label: 'Entry', title: 'New Record' },
  { to: '/species', icon: BookOpen, label: 'Taxa', title: 'Taxonomy' },
  { to: '/chat', icon: MessageCircle, label: 'Ask', title: 'Ask MycoAssistant' },
  { to: '/community', icon: Users, label: 'Review', title: 'Review' },
];

const isActivePath = (pathname, to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

const subPageTitle = (pathname) => {
  const [first, second] = pathname.split('/').filter(Boolean);
  if (first === 'settings') return 'Settings & Profile';
  if (first === 'record') return 'Record';
  if (first === 'entry' && second) return 'Edit Record';
  return undefined;
};

const Logo = ({ className }) => (
  <div
    className={cn(
      'w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0',
      className,
    )}
  >
    <span className="text-white font-black text-[10px] tracking-widest">MH</span>
  </div>
);

/** Offline / syncing chips, shown in the phone header and the sidebar. */
const StatusChips = ({ compact = false }) => {
  const { isOffline } = useAuth();
  const sync = useSyncState();
  return (
    <>
      {isOffline && (
        <span
          title="Offline session: records stay on this device"
          className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
        >
          <CloudOff className="w-3 h-3 flex-shrink-0" /> {!compact && 'Offline'}
        </span>
      )}
      {sync.running && (
        <span
          className="flex items-center gap-1 text-emerald-700 text-[10px] font-black uppercase tracking-widest"
          role="status"
          title="Syncing"
        >
          <RefreshCw className="w-3 h-3 animate-spin flex-shrink-0" /> {!compact && 'Syncing'}
        </span>
      )}
    </>
  );
};

const TopHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const subTitle = subPageTitle(location.pathname);
  const goBack = () => {
    // react-router keeps the history index in history.state.idx
    const idx = window.history.state?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/');
  };

  return (
    <header
      className={cn(
        'sticky top-[env(safe-area-inset-top,0px)] z-40 bg-white/80 backdrop-blur-md px-4 py-3 flex justify-between items-center mx-3 mt-3 rounded-2xl shadow-sm',
        'short:py-1.5 short:mt-1.5',
        // On rail and wide layouts the sidebar carries the logo and status,
        // so the header only appears on sub-pages, for the back button.
        !subTitle && 'rail:hidden',
        'rail:mx-4 sm:rail:mx-6 wide:mx-8',
      )}
    >
      {subTitle ? (
        <>
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            aria-label="Back"
            className="p-2.5 -ml-1 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
          <span className="font-black text-sm text-gray-800 tracking-tight flex-1 text-center uppercase">
            {subTitle}
          </span>
          <div className="w-10" />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo />
            <div className="min-w-0">
              <span className="font-black text-lg text-gray-800 tracking-tight leading-none block">MycoHub</span>
              <span className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest">
                Research v1.0
              </span>
            </div>
            <span className="ml-1 flex items-center gap-2">
              <StatusChips />
            </span>
          </div>
          <motion.button
            whileHover={{ rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all rounded-xl"
          >
            <Settings className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        </>
      )}
    </header>
  );
};

/** Phone portrait: floating tab bar at the bottom. */
const BottomNav = () => {
  const location = useLocation();

  return (
    <div className="rail:hidden fixed bottom-0 left-0 right-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] z-50 flex justify-center pointer-events-none">
      <nav
        aria-label="Main"
        className="pointer-events-auto bg-white/90 backdrop-blur-md border border-gray-100 flex justify-around items-center h-14 w-full max-w-md rounded-full px-1 shadow-xl"
      >
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = isActivePath(location.pathname, to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-label={label}
              className="relative flex flex-col items-center justify-center flex-1 min-w-0 h-11"
            >
              <AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-emerald-50 rounded-2xl -z-10 shadow-sm"
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </AnimatePresence>
              <Icon
                className={cn('w-5 h-5 mb-0.5 transition-colors', active ? 'text-emerald-600' : 'text-gray-500')}
                strokeWidth={2.5}
              />
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-widest transition-colors',
                  active ? 'text-emerald-600' : 'text-gray-500',
                )}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

const railLink = (active) =>
  cn(
    'flex items-center rounded-2xl transition-colors',
    // rail: icon over a short label, a 56 px target
    'flex-col justify-center gap-1 w-14 h-14 short:h-11 short:w-12 short:gap-0',
    // wide: icon beside the full title
    'wide:flex-row wide:justify-start wide:gap-3 wide:w-full wide:h-11 wide:px-3',
    active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
  );

/** Tablets and landscape phones: icon rail. Laptops and up: labelled sidebar. */
const SideNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        'hidden rail:flex fixed inset-y-0 left-0 z-40 flex-col items-center bg-white/90 backdrop-blur-md border-r border-gray-100',
        'w-[calc(5rem+env(safe-area-inset-left,0px))] pl-[env(safe-area-inset-left,0px)]',
        'pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))]',
        'short:pt-[calc(0.5rem+env(safe-area-inset-top,0px))] short:pb-2',
        'wide:w-64 wide:items-stretch wide:px-4',
      )}
    >
      <NavLink to="/" aria-label="MycoHub home" className="flex items-center gap-3 mb-6 short:mb-2 wide:px-2">
        <Logo className="short:w-8 short:h-8" />
        <span className="hidden wide:block min-w-0">
          <span className="font-black text-lg text-gray-800 tracking-tight leading-none block">MycoHub</span>
          <span className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest">Research v1.0</span>
        </span>
      </NavLink>

      <nav
        aria-label="Main"
        className="flex flex-col items-center gap-1.5 short:gap-0.5 wide:items-stretch flex-1 min-h-0 overflow-y-auto no-scrollbar"
      >
        {navItems.map(({ to, icon: Icon, label, title }) => {
          const active = isActivePath(location.pathname, to);
          return (
            <NavLink key={to} to={to} end={to === '/'} title={title} aria-label={title} className={railLink(active)}>
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
              <span className="text-[10px] font-black uppercase tracking-wider short:hidden wide:hidden">{label}</span>
              <span className="hidden wide:inline text-sm font-bold">{title}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-2 mt-2 wide:items-stretch">
        <div className="flex flex-col items-center gap-1 wide:flex-row wide:px-2">
          <span className="wide:hidden flex flex-col items-center gap-1">
            <StatusChips compact />
          </span>
          <span className="hidden wide:flex items-center gap-2">
            <StatusChips />
          </span>
        </div>
        <NavLink to="/settings" title="Settings" aria-label="Settings" className={({ isActive }) => railLink(isActive)}>
          <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
          <span className="hidden wide:flex flex-col min-w-0 text-left leading-tight">
            <span className="text-sm font-bold text-gray-800 truncate">{user?.displayName ?? 'Settings'}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
              {user?.role?.toLowerCase()}
            </span>
          </span>
        </NavLink>
      </div>
    </aside>
  );
};

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Capture the routed element per render so a page that is animating out keeps
  // showing itself instead of rendering the new route (a plain <Outlet /> would).
  const outlet = useOutlet();
  const [direction, setDirection] = useState(0);
  const { user } = useAuth();
  const hasRail = useMediaQuery(RAIL_QUERY);

  // Background sync: on start, when back online, when reopened, and every few minutes.
  useEffect(() => startAutoSync(), [user?.id]);

  const currentIndex = navItems.findIndex((item) => isActivePath(location.pathname, item.to));

  // Swipe between tabs on phones only, and not on pages with text entry where it
  // fights scrolling and selection.
  const swipeEnabled = !hasRail && !['/entry', '/chat', '/record'].some((p) => location.pathname.startsWith(p));

  const handleDragEnd = (_event, info) => {
    const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
    if (isInput) return;

    const swipeThreshold = 80;
    if (currentIndex === -1) return;

    if (info.offset.x < -swipeThreshold && currentIndex < navItems.length - 1) {
      setDirection(1);
      navigate(navItems[currentIndex + 1].to);
    } else if (info.offset.x > swipeThreshold && currentIndex > 0) {
      setDirection(-1);
      navigate(navItems[currentIndex - 1].to);
    }
  };

  return (
    <div
      className={cn(
        'min-h-dvh font-sans selection:bg-emerald-200 bg-gray-50/50',
        'rail:pl-[calc(5rem+env(safe-area-inset-left,0px))] wide:pl-64',
      )}
    >
      {hasRail && <SideNav />}
      <div className="flex flex-col min-h-dvh pb-[var(--nav-bottom)] pr-[env(safe-area-inset-right,0px)]">
        <SafetyDisclaimer />
        <TopHeader />
        <main
          className={cn(
            'flex-1 w-full mx-auto overflow-x-clip',
            'max-w-screen-xl px-4 pt-4 pb-8 sm:px-6 rail:pt-6 short:pt-3 wide:px-8',
          )}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={location.pathname}
              custom={direction}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              drag={swipeEnabled ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.05}
              onDragEnd={handleDragEnd}
              className="w-full h-full touch-pan-y"
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {!hasRail && <BottomNav />}
    </div>
  );
};

export default MainLayout;
