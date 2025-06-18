
import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Hours from "./pages/Hours";
import RankingTCO from "./pages/RankingTCO";
import TopBar from "./components/TopBar";
import BottomMenuBar from "./components/BottomMenuBar";
import { useUserBlockListener } from "./hooks/useUserBlockListener";
import { UserProvider, useUser } from "@/context/UserContext";
import { useVersioning } from "./hooks/useVersioning";
import ImprovementsDialog from "./components/ImprovementsDialog";
import NewNotificationDialog from "./components/NewNotificationDialog";
import ReplyNotificationDialog from "./components/ReplyNotificationDialog";
import { Notification } from "./components/notifications/NotificationsList";

// Protected Route component
const ProtectedRoute = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const user = localStorage.getItem('user');
  
  // Use o hook para escutar bloqueios
  useUserBlockListener();
  
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
  const { user } = useUser();
  const { 
    shouldShowImprovements, 
    currentSystemVersion, 
    improvements, 
    updateUserVersion,
    setShouldShowImprovements 
  } = useVersioning();

  const handleImprovementsClose = () => {
    updateUserVersion();
    setShouldShowImprovements(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 mb-20 py-0 lg:px-0">
        {children}
      </main>
      <BottomMenuBar activeTab={activeTab} onTabChange={onTabChange} isAdmin={user?.userType === 'admin'} isVolunteer={user?.isVolunteer} />
      
      <ImprovementsDialog
        open={shouldShowImprovements}
        onOpenChange={handleImprovementsClose}
        version={currentSystemVersion}
        improvements={improvements}
      />
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState<string>("main");
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  const [replyToNotification, setReplyToNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail as Notification;
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      // Don't show notification if the user is the sender
      if (currentUser.id && notification.senderId === currentUser.id) {
        return;
      }
      
      setNewNotification(notification);
    };

    window.addEventListener('newNotification', handleNewNotification as EventListener);
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
    };
  }, []);

  const handleReply = (notification: Notification) => {
    setNewNotification(null);
    setReplyToNotification(notification);
  };

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

  return (
    <UserProvider>
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
            
            <NewNotificationDialog
              open={!!newNotification}
              onClose={() => setNewNotification(null)}
              notification={newNotification}
              onReply={handleReply}
            />
            <ReplyNotificationDialog
              open={!!replyToNotification}
              onClose={() => setReplyToNotification(null)}
              originalNotification={replyToNotification}
            />
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </UserProvider>
  );
};

export default App;
