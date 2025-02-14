
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogOut, RefreshCw, User, Key, Info } from "lucide-react";
import ProfileUpdateDialog from "./ProfileUpdateDialog";
import PasswordChangeDialog from "./PasswordChangeDialog";
import InformationDialog from "./InformationDialog";
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
  const [showInformationDialog, setShowInformationDialog] = useState(false);
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
      sixAM.setDate(sixAM.getDate() + 1);
    }
    return sixAM.getTime() - now.getTime();
  };

  useEffect(() => {
    const timeToSixAM = calculateTimeToSixAM();
    const timeoutId = setTimeout(handleRefresh, timeToSixAM);
    return () => clearTimeout(timeoutId);
  }, []);

  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <header className="bg-primary shadow-md">
      <div className="flex h-16 items-center px-6 gap-4 max-w-7xl mx-auto">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-light">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 mt-4">
              <Button
                variant="ghost"
                className="justify-start gap-2"
                onClick={() => setShowProfileDialog(true)}
              >
                <User className="h-5 w-5" />
                Alterar Cadastro
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2"
                onClick={() => setShowPasswordDialog(true)}
              >
                <Key className="h-5 w-5" />
                Alterar Senha
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2"
                onClick={() => setShowInformationDialog(true)}
              >
                <Info className="h-5 w-5" />
                Informações
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-5 w-5" />
                Atualizar
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="h-5 w-5" />
                Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex-1">
          <h2 className="text-lg font-semibold text-primary-foreground">
            {userData.rank} {userData.warName}
          </h2>
        </div>
      </div>

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

      {showInformationDialog && (
        <InformationDialog
          open={showInformationDialog}
          onOpenChange={setShowInformationDialog}
          isAdmin={userData.userType === "admin"}
        />
      )}
    </header>
  );
};

export default TopBar;
