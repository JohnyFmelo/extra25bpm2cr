
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@supabase/supabase-js';
import Account from './components/Account';
import Home from './pages/Home';
import TCOForm from './components/tco/TCOForm';
import TCOmeus from './components/tco/TCOmeus';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { initializeSupabase } from './lib/initializeSupabase';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://evsfhznfnifmqlpktbdr.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2c2Zoem5mbmlmbXFscGt0YmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNDY1MjMsImV4cCI6MjA1MjYyMjUyM30.5Khm1eXEsm8SCuN7VYEVRYSbKc0A-T_Xo4hUUvibkgM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Supabase resources on app load
initializeSupabase();

function App() {
  const [selectedTco, setSelectedTco] = useState(null);
  const [session, setSession] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Router>
        <div className="container" style={{ padding: '50px 0 100px 0' }}>
          {!session ? (
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google', 'github']}
              redirectTo={`${window.location.origin}/`}
            />
          ) : (
            <Routes>
              <Route path="/" element={<Home session={session} />} />
              <Route
                path="/account"
                element={<Account session={session} />}
              />
              <Route
                path="/tco/new"
                element={<TCOForm
                  userId={session?.user?.id}
                  toast={toast}
                />}
              />
              <Route
                path="/tco/meus"
                element={<TCOmeus
                  user={session.user}
                  toast={toast}
                  setSelectedTco={setSelectedTco}
                  selectedTco={selectedTco}
                />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          )}
        </div>
      </Router>
      <Toaster />
    </>
  );
}

export default App;
