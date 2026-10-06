import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';

// Other pages load on first visit, keeping the start-up bundle small.
const FieldEntryPage = lazy(() => import('./pages/entry/FieldEntryPage'));
const SpeciesDBPage = lazy(() => import('./pages/species/SpeciesDBPage'));
const CommunityPage = lazy(() => import('./pages/community/CommunityPage'));
const ResearchDashboardPage = lazy(() => import('./pages/dashboard/ResearchDashboardPage'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const RecordPage = lazy(() => import('./pages/record/RecordPage'));

const Spinner = () => (
  <div className="min-h-[40vh] flex items-center justify-center" role="status" aria-label="Loading">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { loading, user } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen">
        <Spinner />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const page = (el) => <Suspense fallback={<Spinner />}>{el}</Suspense>;

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<DashboardPage />} />
      <Route path="entry" element={page(<FieldEntryPage />)} />
      <Route path="entry/:id" element={page(<FieldEntryPage />)} />
      <Route path="record/:id" element={page(<RecordPage />)} />
      <Route path="species" element={page(<SpeciesDBPage />)} />
      <Route path="community" element={page(<CommunityPage />)} />
      <Route path="research" element={page(<ResearchDashboardPage />)} />
      <Route path="chat" element={page(<ChatPage />)} />
      <Route path="settings" element={page(<SettingsPage />)} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// HashRouter works from file://, Capacitor's WebView and any static host
// without server-side rewrites.
const App = () => (
  <AuthProvider>
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  </AuthProvider>
);

export default App;
