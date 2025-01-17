import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Settings, Lock, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PasswordChangeDialog from "./PasswordChangeDialog";
import ProfileUpdateDialog from "./ProfileUpdateDialog";

const AppSidebar = () => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border bg-blue-600 p-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Extra+</h2>
      </SidebarHeader>
      <SidebarContent>
        {user && (
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-700">{user.rank}</span>
                  <span className="text-sm text-gray-700">{user.warName}</span>
                </div>
              </div>
              {user.userType === 'admin' && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Administrador
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-700">Configuração</span>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Settings className="h-5 w-5 text-gray-600" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                      <Lock className="mr-2 h-4 w-4" />
                      <span>Alterar Senha</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                      <UserCog className="mr-2 h-4 w-4" />
                      <span>Atualizar Cadastro</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>

      {user && (
        <>
          <PasswordChangeDialog
            open={showPasswordDialog}
            onOpenChange={setShowPasswordDialog}
            userId={user.id}
            currentPassword={user.password}
          />
          <ProfileUpdateDialog
            open={showProfileDialog}
            onOpenChange={setShowProfileDialog}
            userData={{
              id: user.id,
              email: user.email,
              warName: user.warName,
              rank: user.rank,
              registration: user.registration || "",
            }}
          />
        </>
      )}
    </Sidebar>
  );
};

export default AppSidebar;