
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  LogOut,
  User,
  Lock,
  Info,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
import ProfileUpdateDialog from "./ProfileUpdateDialog";
import PasswordChangeDialog from "./PasswordChangeDialog";
import InformationDialog from "./InformationDialog";

export function AppSidebar() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showInformationDialog, setShowInformationDialog] = useState(false);

  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      <div
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } h-screen bg-primary fixed left-0 top-0 transition-all duration-300 ease-in-out flex flex-col`}
      >
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-primary-foreground hover:bg-primary-light"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="px-4 py-6">
          {!isCollapsed && (
            <>
              <h2 className="text-xl font-bold text-primary-foreground mb-1">
                {userData.rank}
              </h2>
              <h3 className="text-lg font-semibold text-primary-foreground mb-4">
                {userData.warName}
              </h3>
              <p className="text-sm text-primary-foreground/80 mb-2">
                {userData.email}
              </p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary-light text-primary-foreground">
                {userData.userType === "admin" ? "Administrador" : "Usuário"}
              </span>
            </>
          )}
        </div>

        <Separator className="bg-primary-light my-4" />

        <div className="flex-1 px-2">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-primary-foreground hover:bg-primary-light"
              onClick={() => setShowProfileDialog(true)}
            >
              <User className="h-4 w-4 mr-2" />
              {!isCollapsed && "Alterar Cadastro"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-primary-foreground hover:bg-primary-light"
              onClick={() => setShowPasswordDialog(true)}
            >
              <Lock className="h-4 w-4 mr-2" />
              {!isCollapsed && "Alterar Senha"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-primary-foreground hover:bg-primary-light"
              onClick={() => setShowInformationDialog(true)}
            >
              <Info className="h-4 w-4 mr-2" />
              {!isCollapsed && "Informações"}
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-primary-foreground hover:bg-primary-light"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!isCollapsed && "Sair"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
            <AlertDialogDescription>Sair do sistema?</AlertDialogDescription>
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
    </>
  );
}
