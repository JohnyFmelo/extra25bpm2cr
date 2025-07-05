import { Button } from "@/components/ui/button";
import { MessageSquare, BellDot, Bell, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import ProfileUpdateDialog from "./ProfileUpdateDialog";
import PasswordChangeDialog from "./PasswordChangeDialog";
import NotificationsDialog from "./NotificationsDialog";
import { useNotifications } from "./notifications/NotificationsList";
import Messages from "./Messages";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useVersioning } from "@/hooks/useVersioning";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
const TopBar = () => {
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showMessagesDialog, setShowMessagesDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const unreadCount = useNotifications();
  const { currentSystemVersion } = useVersioning();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast({
          title: "Erro ao sair",
          description: "Ocorreu um erro ao tentar sair.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
        className: "bg-blue-500 text-white",
      });

      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

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
  return <header className="bg-gradient-to-r from-primary-dark via-primary to-primary-light sticky top-0 z-50 shadow-md">
      <div className="flex h-16 items-center px-6 gap-4 max-w-7xl mx-auto">
        <div className="flex-1 flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-white">
              {user?.rank} {user?.warName}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-white/80">{getServiceDisplay(user?.service, user?.userType)}</p>
              {user?.rgpm && <span className="text-xs text-white/60">• RGPM: {user?.rgpm}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentSystemVersion && <div className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">
              v{currentSystemVersion}
            </div>}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          
          {user?.userType === "admin"}
        </div>
        
        {showProfileDialog && <ProfileUpdateDialog open={showProfileDialog} onOpenChange={setShowProfileDialog} userData={user} />}
        
        {showPasswordDialog && <PasswordChangeDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} userId={user?.id} currentPassword="" />}
        
        {showNotificationsDialog && <NotificationsDialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog} />}
        
        {showMessagesDialog && <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
              <div className="p-4 bg-gradient-to-r from-primary-dark to-primary rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Enviar Recado</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowMessagesDialog(false)} className="text-white hover:bg-white/10">
                    X
                  </Button>
                </div>
              </div>
              <div className="max-h-[80vh] overflow-auto">
                <Messages onClose={() => setShowMessagesDialog(false)} />
              </div>
            </div>
          </div>}
      </div>
    </header>;
};
export default TopBar;