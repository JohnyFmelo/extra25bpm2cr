
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw } from "lucide-react";
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

const TopBar = () => {
  const navigate = useNavigate();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Função para calcular o tempo restante até as 06:00
  const calculateTimeToSixAM = () => {
    const now = new Date();
    const sixAM = new Date(now);
    sixAM.setHours(6, 0, 0, 0);
    if (now >= sixAM) {
      sixAM.setDate(sixAM.getDate() + 1); // Se já passou das 06:00, agende para o próximo dia
    }
    return sixAM.getTime() - now.getTime();
  };

  // UseEffect para agendar a atualização às 06:00
  useEffect(() => {
    const timeToSixAM = calculateTimeToSixAM();
    const timeoutId = setTimeout(handleRefresh, timeToSixAM);

    // Limpar o timeout quando o componente for desmontado
    return () => clearTimeout(timeoutId);
  }, []);

  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <header className="bg-primary shadow-md">
      <div className="flex h-16 items-center px-6 gap-4 max-w-7xl mx-auto">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-primary-foreground">
            {userData.rank} {userData.warName}
          </h2>
        </div>
        
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
