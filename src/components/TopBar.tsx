import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, UserCog, KeyRound } from "lucide-react";
import { useState, useCallback } from "react";
import ProfileUpdateDialog from "./ProfileUpdateDialog";
import PasswordChangeDialog from "./PasswordChangeDialog";

const TopBar = () => {
  const navigate = useNavigate();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  console.log("TopBar - User data:", userData);

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white">
            <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
              <UserCog className="mr-2 h-4 w-4" />
              Alterar Cadastro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Alterar Senha
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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