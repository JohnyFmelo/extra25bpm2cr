
import { Button } from "@/components/ui/button";
import { MessageSquare, BellDot, Bell, User } from "lucide-react";
import { useState, useEffect } from "react";
import ProfileUpdateDialog from "./ProfileUpdateDialog";
import PasswordChangeDialog from "./PasswordChangeDialog";
import NotificationsDialog from "./NotificationsDialog";
import { useNotifications } from "./NotificationsList";
import Messages from "./Messages";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TopBar = () => {
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showMessagesDialog, setShowMessagesDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const [userData, setUserData] = useState(() => 
    JSON.parse(localStorage.getItem('user') || '{}')
  );

  const unreadCount = useNotifications();
  
  // Listen for user data updates
  useEffect(() => {
    const handleUserDataUpdate = (event: CustomEvent) => {
      setUserData(event.detail);
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, []);
  
  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Get service display text
  const getServiceDisplay = (service: string, userType: string) => {
    if (service) {
      return service;
    }
    // Fallback to userType if service is not available
    return userType === "admin" ? "Administrador" : "Usuário";
  };

  return (
    <header className="bg-gradient-to-r from-primary-dark via-primary to-primary-light sticky top-0 z-50 shadow-md">
      <div className="flex h-16 items-center px-6 gap-4 max-w-7xl mx-auto">
        <div className="flex-1 flex items-center gap-3">
          <Avatar className="h-9 w-9 bg-primary-dark/50 text-white border-2 border-white/20">
            <AvatarFallback>{getInitials(userData.warName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-white">
              {userData.rank} {userData.warName}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-white/80">{getServiceDisplay(userData.service, userData.userType)}</p>
              {userData.rgpm && (
                <span className="text-xs text-white/60">• RGPM: {userData.rgpm}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowNotificationsDialog(true)}
            className="text-white hover:bg-white/10 relative"
          >
            {unreadCount > 0 ? (
              <>
                <BellDot className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-highlight text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            ) : (
              <Bell className="h-5 w-5" />
            )}
            <span className="sr-only">Notificações</span>
          </Button>
          
          {userData.userType === "admin" && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowMessagesDialog(prev => !prev)}
              className="text-white hover:bg-white/10"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="sr-only">Enviar Recado</span>
            </Button>
          )}
        </div>
        
        {showProfileDialog && (
          <ProfileUpdateDialog
            open={showProfileDialog}
            onOpenChange={setShowProfileDialog}
            userData={userData}
          />
        )}
        
        {showPasswordDialog && (
          <PasswordChangeDialog
            open={showPasswordDialog}
            onOpenChange={setShowPasswordDialog}
            userId={userData.id}
            currentPassword={userData.password}
          />
        )}
        
        {showNotificationsDialog && (
          <NotificationsDialog 
            open={showNotificationsDialog}
            onOpenChange={setShowNotificationsDialog}
          />
        )}
        
        {showMessagesDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
              <div className="p-4 bg-gradient-to-r from-primary-dark to-primary rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Enviar Recado</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMessagesDialog(false)}
                    className="text-white hover:bg-white/10"
                  >
                    X
                  </Button>
                </div>
              </div>
              <div className="max-h-[80vh] overflow-auto">
                <Messages onClose={() => setShowMessagesDialog(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
