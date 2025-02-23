import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Navigation from './components/Navigation';
import BillingForm from './components/BillingForm';
import BillingRecords from './components/BillingRecords';
import AccountSettings from './components/AccountSettings';
import Dashboard from './components/Dashboard';
import LoginForm from './components/auth/LoginForm';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation user={user} />
        <main className="py-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<BillingForm />} />
            <Route path="/records" element={<BillingRecords />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App