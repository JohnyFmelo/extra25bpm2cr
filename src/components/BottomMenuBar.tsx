
import React from "react";
import { Clock, Calendar, MapPinned, Scale, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
  active = false,
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center py-2 px-4 relative",
      active ? "text-primary" : "text-gray-500 hover:text-primary"
    )}
    aria-label={label}
  >
    {badge !== undefined && badge > 0 && (
      <span className="absolute top-0 right-1 flex items-center justify-center w-4 h-4 bg-green-500 text-white text-xs font-bold rounded-full">
        {badge}
      </span>
    )}
    {icon}
    <span className="text-xs mt-1">{label}</span>
  </button>
);

interface BottomMenuBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

const BottomMenuBar: React.FC<BottomMenuBarProps> = ({
  activeTab,
  onTabChange,
  isAdmin,
}) => {
  const navigate = useNavigate();

  const handleHoursClick = () => {
    navigate("/hours");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 flex justify-around items-center">
      <BottomMenuItem
        icon={<Clock className="h-6 w-6" />}
        label="Horas"
        onClick={handleHoursClick}
        active={false}
      />
      <BottomMenuItem
        icon={<Calendar className="h-6 w-6" />}
        label="Extra"
        onClick={() => onTabChange("extra")}
        active={activeTab === "extra"}
      />
      <BottomMenuItem
        icon={<MapPinned className="h-6 w-6" />}
        label="Viagens"
        onClick={() => onTabChange("travel")}
        active={activeTab === "travel"}
      />
      {isAdmin && (
        <BottomMenuItem
          icon={<Scale className="h-6 w-6" />}
          label="TCO"
          onClick={() => onTabChange("tco")}
          active={activeTab === "tco"}
        />
      )}
      <BottomMenuItem
        icon={<Settings className="h-6 w-6" />}
        label="Config"
        onClick={() => onTabChange("settings")}
        active={activeTab === "settings"}
      />
    </div>
  );
};

export default BottomMenuBar;
