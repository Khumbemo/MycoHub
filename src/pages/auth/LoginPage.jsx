import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, UserCircle, CloudOff, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandMark from '../../components/BrandMark';
import MushroomPlate from '../../components/MushroomPlate';
import MyceliumField from '../../components/MyceliumField';
import { useBackground } from '../../utils/background';
import { cn } from '../../utils/cn';

const LoginPage = () => {
  const { user, login, loginGuest, loginEmergencyBypass, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();
  const bg = useBackground();
  const onPhoto = bg.mode === 'photo' && bg.photoUrl;

  // Redirect if logged in
  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-paper flex-col gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-emerald-600 border-t-transparent"></div>
        <p className="text-[11px] text-gray-500 uppercase">Opening the field notebook…</p>
      </div>
    );
  }

  const handleLogin = async (type) => {
    if (type === 'bypass') {
      loginEmergencyBypass();
      return;
    }

    setIsLoggingIn(true);
    setError(null);
    try {
      if (type === 'google') await login();
      else await loginGuest();
    } catch (error) {
      console.error('Login failure:', error);
      setError("Couldn't reach the sign-in service. You can continue offline; records will be saved on this device.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      className={cn(
        'relative min-h-dvh flex flex-col items-center justify-center p-6 short:py-4 font-sans overflow-hidden',
        'pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]',
        onPhoto ? 'bg-ink' : 'bg-paper',
      )}
    >
      {bg.mode === 'mycelium' && <MyceliumField className="absolute inset-0 w-full h-full pointer-events-none" />}
      {onPhoto && (
        <>
          <img src={bg.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          {/* keeps the brand text legible on any photo */}
          <div className="absolute inset-0 bg-gradient-to-br from-ink/85 via-ink/55 to-ink/30" />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-sm short:max-w-3xl short:grid short:grid-cols-2 short:gap-8 short:items-center lg:max-w-5xl lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:items-center"
      >
        <div className="flex flex-col items-center text-center mb-8 short:mb-0 lg:mb-0 lg:items-start lg:text-left">
          <div className="flex items-center gap-3 mb-4 short:mb-2">
            <BrandMark className="w-11 h-11 short:w-9 short:h-9" />
            <span className={cn('text-[11px] uppercase', onPhoto ? 'text-emerald-100' : 'text-emerald-700')}>
              Field mycology
            </span>
          </div>
          <h1
            className={cn(
              'text-5xl lg:text-7xl short:text-4xl leading-none mb-3 short:mb-1',
              onPhoto ? 'text-white' : 'text-ink',
            )}
          >
            MycoHub
          </h1>
          <p className={cn('max-w-sm text-[15px] leading-snug', onPhoto ? 'text-white/85' : 'text-gray-600')}>
            Record collections in Darwin Core, verify identifications with your peers, and track diversity by site.
          </p>

          {(bg.mode === 'illustration' || bg.mode === 'mycelium') && (
            <>
              <MushroomPlate
                labels={false}
                className="w-full max-w-[18rem] mt-6 short:hidden lg:hidden"
                title="Botanical plate of the fly agaric, Amanita muscaria"
              />
              <MushroomPlate
                className="hidden lg:block w-full max-w-xl mt-8 -ml-2"
                title="Botanical plate of the fly agaric, Amanita muscaria, with labelled parts"
              />
            </>
          )}
        </div>

        <div className="bg-white p-7 short:p-5 rounded-2xl shadow-xl border border-gray-200/70">
          <h2 className="text-2xl text-ink mb-1">Sign in</h2>
          <p className="text-sm text-gray-600 mb-6 short:mb-3">Sync your records and join identifications.</p>
          <div className="space-y-3">
            <button
              onClick={() => handleLogin('google')}
              disabled={isLoggingIn}
              className="disabled:opacity-60 w-full bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-3.5 rounded-xl flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] transition-all"
            >
              <LogIn className="w-[18px] h-[18px]" />
              <span className="text-xs uppercase">{isLoggingIn ? 'Connecting…' : 'Sign in with Google'}</span>
            </button>

            <button
              onClick={() => handleLogin('guest')}
              disabled={isLoggingIn}
              className="disabled:opacity-60 w-full bg-white border border-gray-300 hover:border-emerald-600 hover:text-emerald-800 text-gray-800 px-4 py-3.5 rounded-xl text-xs uppercase active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <UserCircle className="w-[18px] h-[18px]" />
              <span>Continue as Guest</span>
            </button>

            <div className="relative py-3 flex items-center gap-4">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-[10px] text-gray-500 uppercase">No connection?</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <button
              onClick={() => handleLogin('bypass')}
              className="w-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 px-4 py-3.5 rounded-xl text-xs uppercase active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <CloudOff className="w-[18px] h-[18px]" />
              <span>Continue Offline</span>
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 text-sm text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-xl leading-snug"
            >
              {error}
            </p>
          )}

          <p className="mt-5 flex gap-2 text-[12.5px] text-gray-600 leading-snug">
            <Info className="w-4 h-4 flex-shrink-0 mt-px text-gray-500" />
            Cloud sync needs a signed-in account. Offline records are stored on this device only.
          </p>
        </div>

        <p
          className={cn(
            'mt-8 short:mt-3 col-span-2 text-center text-[10px] uppercase',
            onPhoto ? 'text-white/70' : 'text-gray-500',
          )}
        >
          v1.0.0-alpha · Darwin Core terms
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
