import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import FieldEntryPage from './pages/entry/FieldEntryPage';
import SpeciesDBPage from './pages/species/SpeciesDBPage';
import CommunityPage from './pages/community/CommunityPage';
import ResearchDashboardPage from './pages/dashboard/ResearchDashboardPage';
import ChatPage from './pages/chat/ChatPage';
import SettingsPage from './pages/settings/SettingsPage';

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// HashRouter works from file://, Capacitor's WebView and any static host
// without server-side rewrites.
const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
