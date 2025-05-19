
import React, { useEffect } from "react";
import { Clock, Calendar, MapPinned, Scale, Settings, Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  
  useEffect(() => {
    // Update active tab based on current route
    if (location.pathname === "/") {
      if (activeTab === "hours") {
        onTabChange("main");
      }
    } else if (location.pathname === "/hours") {
      onTabChange("hours");
    }
  }, [location.pathname, activeTab, onTabChange]);
  
  const handleHoursClick = () => {
    navigate("/hours");
  };
  
  const handleMainClick = () => {
    onTabChange("main");
    navigate("/");
  };
  
  return (
    <TooltipProvider>
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-gray-100 flex justify-around items-center z-40 rounded-t-xl my-0 py-[6px]">
        <BottomMenuItem 
          icon={<Home className="h-5 w-5" />} 
          label="Início" 
          onClick={handleMainClick} 
          active={location.pathname === "/" && activeTab === "main"} 
        />
        <BottomMenuItem 
          icon={<Clock className="h-5 w-5" />} 
          label="Horas" 
          onClick={handleHoursClick} 
          active={location.pathname === "/hours"} 
        />
        <BottomMenuItem 
          icon={<Calendar className="h-5 w-5" />} 
          label="Extra" 
          onClick={() => {
            onTabChange("extra");
            navigate("/");
          }} 
          active={activeTab === "extra"} 
        />
        <BottomMenuItem 
          icon={<MapPinned className="h-5 w-5" />} 
          label="Viagens" 
          onClick={() => {
            onTabChange("travel");
            navigate("/");
          }} 
          active={activeTab === "travel"} 
        />
        {isAdmin && (
          <BottomMenuItem 
            icon={<Scale className="h-5 w-5" />} 
            label="TCO" 
            onClick={() => {
              onTabChange("tco");
              navigate("/");
            }} 
            active={activeTab === "tco"} 
          />
        )}
        <BottomMenuItem 
          icon={<Settings className="h-5 w-5" />} 
          label="Config" 
          onClick={() => {
            onTabChange("settings");
            navigate("/");
          }} 
          active={activeTab === "settings"} 
        />
      </div>
    </TooltipProvider>
  );
};

export default BottomMenuBar;
