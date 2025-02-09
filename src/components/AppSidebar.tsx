
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
        } h-screen bg-[#13293D] fixed left-0 top-0 transition-all duration-300 ease-in-out flex flex-col shadow-lg`}
      >
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white/80 hover:text-white hover:bg-[#247BA0]"
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
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {userData.rank}
              </h2>
              <h3 className="text-xl font-semibold text-white/90 mb-4">
                {userData.warName}
              </h3>
              <p className="text-sm text-white/70 mb-3 font-medium">
                {userData.email}
              </p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#247BA0] text-white">
                {userData.userType === "admin" ? "Administrador" : "Usuário"}
              </span>
            </>
          )}
        </div>

        <Separator className="bg-[#247BA0]/30 my-4" />

        <div className="flex-1 px-2">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-white/80 hover:text-white hover:bg-[#247BA0]"
              onClick={() => setShowProfileDialog(true)}
            >
              <User className="h-4 w-4 mr-2" />
              {!isCollapsed && "Alterar Cadastro"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white/80 hover:text-white hover:bg-[#247BA0]"
              onClick={() => setShowPasswordDialog(true)}
            >
              <Lock className="h-4 w-4 mr-2" />
              {!isCollapsed && "Alterar Senha"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white/80 hover:text-white hover:bg-[#247BA0]"
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
            className="w-full justify-start text-white/80 hover:text-white hover:bg-[#247BA0]"
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
