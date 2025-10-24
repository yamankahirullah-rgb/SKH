import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import OperationsPage from './pages/OperationsPage';
import InventoryPage from './pages/InventoryPage';
import TransferLogPage from './pages/TransferLogPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import AuthPage from './pages/AuthPage';
import AuditLogPage from './pages/AuditLogPage';
import AccountSetupPage from './pages/AccountSetupPage';
import SetPasswordPage from './pages/SetPasswordPage';
import { supabase } from './supabase/client';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
      </div>
    );
  }

  // Use the Router as the top-level component to provide routing context everywhere.
  return (
    <Router>
      {!session ? (
        <AuthPage />
      ) : (
        <AppProvider session={session}>
          <MainRoutes />
        </AppProvider>
      )}
    </Router>
  );
};

// This new component lives within the Router and AppProvider context.
// It handles the conditional logic for what page to show.
const MainRoutes: React.FC = () => {
  const { profile, loading } = useAppContext();
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPrompt = () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then((choice: { outcome: string }) => {
        if (choice.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setInstallPromptEvent(null);
      });
    }
  };
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
      </div>
    );
  }

  // Render specific pages if user setup is not complete.
  // These components can now safely use hooks like useNavigate because they are rendered within the Router context.
  if (profile && !profile.account_id) {
    return <AccountSetupPage />;
  }

  if (profile && profile.account_id && !profile.password_set_at) {
    return <SetPasswordPage />;
  }

  // If the user is fully set up, render the main application layout and routes.
  return (
    <Layout showInstallButton={!!installPromptEvent} handleInstallPrompt={handleInstallPrompt}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/operations" element={<OperationsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/transfers" element={<TransferLogPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/audit-log" element={<AuditLogPage />} />
        {/* Add a catch-all route to redirect to dashboard if no other route matches */}
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </Layout>
  );
};


export default App;
