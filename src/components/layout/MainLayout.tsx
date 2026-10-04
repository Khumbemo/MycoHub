import React, { useState } from 'react';
import { NavLink, useOutlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusSquare, BookOpen, Users, Activity, Settings, ArrowLeft, MessageCircle, CloudOff } from 'lucide-react';
import type { PanInfo } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import SafetyDisclaimer from '../SafetyDisclaimer';

const TopHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isOffline } = useAuth();

  // Pages reached from the header rather than the bottom nav get a back button.
  const subPageTitles: Record<string, string> = {
    'settings': 'Settings & Profile',
  };

  const currentSubPath = location.pathname.split('/').filter(Boolean).join('/');
  const subTitle = subPageTitles[currentSubPath];
  const isSubPage = !!subTitle;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b-0 px-4 py-3 flex justify-between items-center mx-3 mt-3 rounded-2xl shadow-sm">
      {isSubPage && subTitle ? (
        <>
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            aria-label="Back to dashboard"
            className="p-2 -ml-1 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
          <span className="font-black text-sm text-gray-800 tracking-tight flex-1 text-center uppercase">{subTitle}</span>
          <div className="w-9" />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white font-black text-[10px] tracking-widest">MH</span>
            </div>
            <div>
              <span className="font-black text-lg text-gray-800 tracking-tight leading-none block">MycoHub</span>
              <span className="text-[8px] text-gray-400 font-mono font-bold uppercase tracking-widest">Research v1.0</span>
            </div>
            {isOffline && (
              <span className="ml-1 flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                <CloudOff className="w-3 h-3" /> Offline
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all rounded-xl"
          >
            <Settings className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        </>
      )}
    </header>
  );
};

const navItems = [
  { to: '/', icon: Home, label: 'Dash' },
  { to: '/research', icon: Activity, label: 'Labs' },
  { to: '/entry', icon: PlusSquare, label: 'Entry' },
  { to: '/species', icon: BookOpen, label: 'Taxa' },
  { to: '/chat', icon: MessageCircle, label: 'Ask' },
  { to: '/community', icon: Users, label: 'Review' },
];

const BottomNav = () => {
  const location = useLocation();

  const getIsActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] z-50 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto bg-white/90 backdrop-blur-md border border-gray-100 flex justify-around items-center h-14 w-full max-w-md rounded-full px-1 shadow-xl">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={label}
            className="relative flex flex-col items-center justify-center flex-1 min-w-0 h-11"
          >
            {() => (
              <>
                <AnimatePresence>
                  {getIsActive(to) && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-emerald-50 rounded-2xl -z-10 shadow-sm"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                    />
                  )}
                </AnimatePresence>
                <Icon
                  className={cn(
                    "w-5 h-5 mb-0.5 transition-colors duration-300",
                    getIsActive(to) ? "text-emerald-600" : "text-gray-400"
                  )}
                  strokeWidth={2.5}
                />
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest transition-colors duration-300",
                  getIsActive(to) ? "text-emerald-600" : "text-gray-400"
                )}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Capture the routed element per render so a page that is animating out keeps
  // showing itself instead of rendering the new route (a plain <Outlet /> would).
  const outlet = useOutlet();
  const [direction, setDirection] = useState(0);

  const currentIndex = navItems.findIndex(item => {
    if (item.to === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.to);
  });

  // Swipe between tabs, except on pages with text entry where it fights scrolling and selection.
  const swipeEnabled = !['/entry', '/chat'].includes(location.pathname);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
    <div className="min-h-screen pb-24 flex flex-col font-sans selection:bg-emerald-200 bg-gray-50/50">
      <SafetyDisclaimer />
      <div className="flex flex-col flex-1">
        <TopHeader />
        <main className="flex-1 max-w-md mx-auto px-4 pt-4 md:max-w-2xl lg:max-w-4xl w-full overflow-x-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={location.pathname}
              custom={direction}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
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
        <BottomNav />
      </div>
    </div>
  );
};

export default MainLayout;
