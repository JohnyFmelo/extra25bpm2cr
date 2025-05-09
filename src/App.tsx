
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppRoutes from '@/routes';
import { AuthProvider } from '@/contexts/AuthContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { UnreadMessagesProvider } from '@/contexts/UnreadMessagesContext';
import SupabaseSetup from '@/components/SupabaseSetup';

function App() {
  const [router] = useState(() => createBrowserRouter(AppRoutes));
  
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <TeamProvider>
          <NotificationProvider>
            <UnreadMessagesProvider>
              <RouterProvider router={router} />
              <Toaster />
              <SupabaseSetup />
            </UnreadMessagesProvider>
          </NotificationProvider>
        </TeamProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
