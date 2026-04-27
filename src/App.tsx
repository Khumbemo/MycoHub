import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';

// Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import FieldEntryPage from './pages/entry/FieldEntryPage';
import SpeciesDBPage from './pages/species/SpeciesDBPage';
import CommunityPage from './pages/community/CommunityPage';
import ResearchDashboardPage from './pages/dashboard/ResearchDashboardPage';
import ChatPage from './pages/chat/ChatPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, user } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent shadow-md"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Placeholder components for remaining modules
const ResearchPage = () => <div className="p-12 text-center font-black text-gray-300 uppercase tracking-widest leading-relaxed">Research & Labs Module<br/><span className="text-[10px] text-gray-200">Phenology · Richness · GIS</span></div>;
const SettingsPage = () => <div className="p-12 text-center font-black text-gray-300 uppercase tracking-widest leading-relaxed">Settings & Profile<br/><span className="text-[10px] text-gray-200">ORCID ID: 0000-0002-1825-0097</span></div>;
import LoginPage from './pages/auth/LoginPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="entry" element={<FieldEntryPage />} />
        <Route path="species" element={<SpeciesDBPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="research" element={<ResearchDashboardPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
