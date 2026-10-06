import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, UserCircle, Zap, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { user, login, loginGuest, loginEmergencyBypass, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();

  // Redirect if logged in
  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent shadow-md"></div>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse">
          Initializing Lab...
        </p>
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
    <div className="min-h-screen bg-emerald-50/30 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-6">
            <span className="text-white font-black text-2xl tracking-widest">MH</span>
          </div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter mb-1">MycoHub</h1>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em]">Scientific Laboratory</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
          <div className="space-y-4">
            <button
              onClick={() => handleLogin('google')}
              disabled={isLoggingIn}
              className="disabled:opacity-60 w-full bg-emerald-600 text-white p-4 rounded-3xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <LogIn className="w-5 h-5" />
              <span className="font-black text-xs uppercase tracking-widest">
                {isLoggingIn ? 'Connecting…' : 'Sign in with Google'}
              </span>
            </button>

            <button
              onClick={() => handleLogin('guest')}
              disabled={isLoggingIn}
              className="disabled:opacity-60 w-full bg-white border-2 border-emerald-50 text-emerald-600 p-4 rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <UserCircle className="w-5 h-5" />
              <span>Continue as Guest</span>
            </button>

            <div className="relative py-4 flex items-center gap-4">
              <div className="h-px bg-gray-100 flex-1" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">No connection?</span>
              <div className="h-px bg-gray-100 flex-1" />
            </div>

            <button
              onClick={() => handleLogin('bypass')}
              className="w-full bg-amber-500 text-white p-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>Continue Offline</span>
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-6 text-xs font-bold text-amber-700 bg-amber-50 p-4 rounded-2xl leading-snug">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center gap-2 text-rose-500 bg-rose-50 p-4 rounded-2xl">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider leading-tight">
              Cloud sync needs a signed-in account. Offline records are stored on this device only.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
          v1.0.0-Alpha • Darwin Core terms
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
