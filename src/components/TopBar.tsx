
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import { useState, useEffect } from "react";
import ProfileUpdateDialog from "./ProfileUpdateDialog";
import PasswordChangeDialog from "./PasswordChangeDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

const TopBar = () => {
  const navigate = useNavigate();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(true);
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const toggleAdminMode = () => {
    const newMode = !isAdminMode;
    setIsAdminMode(newMode);
    
    // Atualiza o localStorage mantendo os outros dados do usuário
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUserData = {
      ...userData,
      tempUserType: newMode ? 'admin' : 'user'
    };
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    
    toast({
      title: newMode ? "Modo Administrador ativado" : "Modo Usuário ativado",
      description: `Você está agora no modo ${newMode ? 'administrador' : 'usuário'}.`,
    });
  };

  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = userData.userType === 'admin';

  // Sincroniza o estado inicial com o localStorage
  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdminMode(storedUserData.tempUserType !== 'user');
  }, []);

  return (
    <header className="bg-primary shadow-md">
      <div className="flex h-16 items-center px-6 gap-4 max-w-7xl mx-auto">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-primary-foreground">
            {userData.rank} {userData.warName}
          </h2>
        </div>
        
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-light"
            onClick={toggleAdminMode}
            title={isAdminMode ? "Mudar para modo usuário" : "Mudar para modo administrador"}
          >
            {isAdminMode ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            <span className="sr-only">
              {isAdminMode ? "Mudar para modo usuário" : "Mudar para modo administrador"}
            </span>
          </Button>
        )}

        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary-foreground hover:bg-primary-light"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-5 w-5" />
          <span className="sr-only">Atualizar página</span>
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary-foreground hover:bg-primary-light"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Sair</span>
        </Button>

        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
              <AlertDialogDescription>
                Sair do sistema?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Sair</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
      </div>
    </header>
  );
};

export default TopBar;

