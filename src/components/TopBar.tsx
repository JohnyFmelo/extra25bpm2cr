import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { useSidebar } from "./ui/sidebar";

const TopBar = () => {
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      <header className="bg-primary shadow-md">
        <div className="flex h-16 items-center px-6 gap-4 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-light"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-primary-foreground">
              {userData.rank} {userData.warName}
            </h2>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground hover:bg-primary-light"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      </header>

      <AppSidebar />
    </>
  );
};

export default TopBar;