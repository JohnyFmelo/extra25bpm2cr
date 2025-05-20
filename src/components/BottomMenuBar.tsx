
import React from "react";
import { Clock, Calendar, MapPinned, Scale, Settings, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

interface BottomMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
  active?: boolean;
}

const BottomMenuItem: React.FC<BottomMenuItemProps> = ({
  icon,
  label,
  onClick,
  badge,
  active = false
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          onClick={onClick} 
          className={cn(
            "flex flex-col items-center justify-center py-2 px-2 relative transition-all", 
            active 
              ? "text-primary after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:w-1/3 after:h-0.5 after:bg-primary after:transform after:-translate-x-1/2" 
              : "text-gray-500 hover:text-primary-light"
          )} 
          aria-label={label}
        >
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 right-1 flex items-center justify-center w-4 h-4 bg-highlight text-white text-xs font-bold rounded-full">
              {badge}
            </span>
          )}
          <div className={cn(
            "p-2 rounded-full mb-1 transition-colors", 
            active ? "bg-primary/10" : "bg-transparent group-hover:bg-primary/5"
          )}>
            {icon}
          </div>
          <span className="text-xs font-medium">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface BottomMenuBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

const BottomMenuBar: React.FC<BottomMenuBarProps> = ({
  activeTab,
  onTabChange,
  isAdmin
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isCurrentPage = (path: string): boolean => {
    return location.pathname === path;
  };
  
  const handleTabChange = (tab: string) => {
    if (tab === "main") {
      navigate("/");
    } else if (tab === "hours") {
      navigate("/hours");
    } else if (tab === "tco") {
      if (isAdmin) {
        navigate("/", { state: { activeTab: tab } });
      } else {
        // Show notification for non-admin users
        toast({
          variant: "warning",
          title: "Funcionalidade Restrita",
          description: "O módulo TCO está em desenvolvimento e disponível apenas para administradores."
        });
        return;
      }
    } else {
      // For tabs that don't have dedicated pages yet, navigate to home with state
      navigate("/", { state: { activeTab: tab } });
    }
    
    onTabChange(tab);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-gray-100 flex justify-center z-40">
      <div className="flex justify-around items-center w-full max-w-5xl mx-auto rounded-t-xl py-[6px]">
        <BottomMenuItem 
          icon={<Home className="h-5 w-5" />} 
          label="Início" 
          onClick={() => handleTabChange("main")} 
          active={activeTab === "main" || isCurrentPage("/")} 
        />
        <BottomMenuItem 
          icon={<Clock className="h-5 w-5" />} 
          label="Horas" 
          onClick={() => handleTabChange("hours")} 
          active={activeTab === "hours" || isCurrentPage("/hours")} 
        />
        <BottomMenuItem 
          icon={<Calendar className="h-5 w-5" />} 
          label="Extra" 
          onClick={() => handleTabChange("extra")} 
          active={activeTab === "extra"} 
        />
        <BottomMenuItem 
          icon={<MapPinned className="h-5 w-5" />} 
          label="Viagens" 
          onClick={() => handleTabChange("travel")} 
          active={activeTab === "travel"} 
        />
        {/* Now showing TCO for all users */}
        <BottomMenuItem 
          icon={<Scale className="h-5 w-5" />} 
          label="TCO" 
          onClick={() => handleTabChange("tco")} 
          active={activeTab === "tco"} 
        />
        <BottomMenuItem 
          icon={<Settings className="h-5 w-5" />} 
          label="Config" 
          onClick={() => handleTabChange("settings")} 
          active={activeTab === "settings"} 
        />
      </div>
    </div>
  );
};

export default BottomMenuBar;
