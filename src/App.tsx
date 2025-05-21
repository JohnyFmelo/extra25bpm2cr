import React, { useState, useEffect } from "react";
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
const ProtectedRoute = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Layout component to handle common layout elements
const Layout = ({
  children,
  activeTab,
  onTabChange
}: {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 py-[38px]">
        {children}
      </main>
      <BottomMenuBar activeTab={activeTab} onTabChange={onTabChange} isAdmin={user?.userType === 'admin'} />
    </div>;
};
const App = () => {
  const [activeTab, setActiveTab] = useState<string>("main");
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        // 5 minutes
        retry: 1
      }
    }
  });
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  return <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute>
                    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
                      <Index initialActiveTab={activeTab} />
                    </Layout>
                  </ProtectedRoute>} />
              <Route path="/hours" element={<ProtectedRoute>
                    <Layout activeTab="hours" onTabChange={handleTabChange}>
                      <Hours />
                    </Layout>
                  </ProtectedRoute>} />
              {/* Redirect any unknown routes to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>;
};
export default App;