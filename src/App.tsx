
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Hours from "./pages/Hours";
import TopBar from "./components/TopBar";
import BottomMenuBar from "./components/BottomMenuBar";

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const path = location.pathname;
  let activeTab = "main";
  
  if (path === "/hours") {
    activeTab = "hours";
  }
  
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 pb-28">
          {children}
        </main>
        {user && <BottomMenuBar 
          activeTab={activeTab}
          onTabChange={(tab) => {
            window.location.href = tab === "hours" ? "/hours" : "/";
          }}
          isAdmin={user.userType === 'admin'} 
        />}
      </div>
    </div>
  );
};

const App = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  });

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Index />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hours" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Hours />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              {/* Redirect any unknown routes to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
