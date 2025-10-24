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

  if (!session) {
    return <AuthPage />;
  }

  return (
    <AppProvider session={session}>
      <AppContent />
    </AppProvider>
  );
};

// This component handles the routing logic based on user profile state.
const AppContent: React.FC = () => {
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

  // Route to account setup if the user has a profile but no account.
  if (profile && !profile.account_id) {
    return <AccountSetupPage />;
  }

  // Route to set password if the user has an account but hasn't set their password yet (invited user).
  if (profile && profile.account_id && !profile.password_set_at) {
    return <SetPasswordPage />;
  }

  return (
    <Router>
      <Layout showInstallButton={!!installPromptEvent} handleInstallPrompt={handleInstallPrompt}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/operations" element={<OperationsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/transfers" element={<TransferLogPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};


export default App;
