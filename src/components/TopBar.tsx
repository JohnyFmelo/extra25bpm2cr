import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationsList from "./NotificationsList";

const TopBar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Extra 25° BPM</h2>
        </div>
        <NotificationsList />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {user.warName || "Usuário"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;