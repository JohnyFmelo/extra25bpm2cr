import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { useState } from "react";
import { ProfileUpdateDialog } from "./ProfileUpdateDialog";
import { PasswordChangeDialog } from "./PasswordChangeDialog";

const TopBar = () => {
  const navigate = useNavigate();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
              Alterar Cadastro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
              Alterar Senha
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ProfileUpdateDialog
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
        />
        <PasswordChangeDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
        />
      </div>
    </header>
  );
};

export default TopBar;