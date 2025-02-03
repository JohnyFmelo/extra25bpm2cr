import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">{user.email}</p>
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
            {user.userType === "admin" ? "Administrador" : "Usuário"}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4 space-y-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Modo Claro
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Modo Escuro
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            // Add profile update dialog logic here
          }}
        >
          Alterar Cadastro
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            // Add password change dialog logic here
          }}
        >
          Alterar Senha
        </Button>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}