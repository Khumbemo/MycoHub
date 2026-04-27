import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { user, login, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent shadow-md"></div>
      </div>
    );
  }

  // If already logged in, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-6 rotate-12">
            <span className="text-white font-black text-2xl tracking-widest -rotate-12">MH</span>
          </div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter mb-2">MycoHub</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Scientific Laboratory</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-gray-100">
          <h2 className="text-xl font-black text-gray-800 mb-6 text-center">Research Portal</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => login()}
            className="w-full bg-emerald-600 text-white p-4 rounded-3xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/30 group"
          >
            <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            <span className="font-black text-xs uppercase tracking-widest">Sign in with Google</span>
          </motion.button>

          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-loose">
              By entering, you agree to the <br/>
              <span className="text-emerald-500 underline cursor-pointer">Open Science Data Protocol</span>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
            v1.0.0-alpha • Powered by DwC Architecture
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
