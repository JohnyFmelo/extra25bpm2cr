
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

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Layout component to handle common layout elements
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

// Route-specific wrapper that can pass location state to components
const IndexWrapper = () => {
  const location = useLocation();
  const activeTab = location.state?.activeTab || 'main';
  
  return (
    <Layout>
      <Index initialActiveTab={activeTab} />
    </Layout>
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
                    <IndexWrapper />
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
