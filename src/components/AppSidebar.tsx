import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { Clock, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PasswordChangeDialog from "./PasswordChangeDialog";
import ProfileUpdateDialog from "./ProfileUpdateDialog";
import { useState } from "react";
import { CustomUser } from "@/types/user";

const AppSidebar = () => {
  const navigate = useNavigate();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const user = auth.currentUser as CustomUser | null;

  const userData = user ? {
    id: user.uid,
    email: user.email || '',
    warName: user.warName || '',
    rank: user.rank || '',
    registration: user.registration || ''
  } : null;

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 p-4">
      {user && (
        <div>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <span className="text-sm font-semibold text-blue-700">{user.rank}</span>
                  <span className="text-sm text-gray-700"> {user.warName}</span>
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
                    <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
                      Alterar Senha
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                      Alterar Cadastro
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <a
              href="/hours"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Clock className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-700">Horas</span>
            </a>
          </div>

          {user && userData && (
            <>
              <PasswordChangeDialog
                open={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
                userId={user.uid}
                currentPassword={user.password || ''}
              />
              <ProfileUpdateDialog
                open={isProfileDialogOpen}
                onOpenChange={setIsProfileDialogOpen}
                userData={userData}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AppSidebar;