import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import Account from './components/Account'
import Home from './pages/Home';
import TCOForm from './components/tco/TCOForm';
import TCOmeus from './components/tco/TCOmeus';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { initializeSupabase } from './lib/initializeSupabase';

// Initialize Supabase resources on app load
initializeSupabase();

function App() {
  const [selectedTco, setSelectedTco] = useState(null);
  const session = useSession()
  const supabase = useSupabaseClient()
  const { toast } = useToast()

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
  )
}

export default App
