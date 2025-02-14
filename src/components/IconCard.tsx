
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface IconCardProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  badge?: number;
  variant?: "default" | "floating";
}

const IconCard = ({ icon: Icon, label, onClick, badge, variant = "default" }: IconCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (label === "Horas") {
      navigate("/hours");
    }
  };

  if (variant === "floating") {
    return (
      <button
        onClick={handleClick}
        className="relative flex flex-col items-center gap-1 transition-colors hover:text-primary"
      >
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full">
            {badge}
          </span>
        )}
        <Icon className="h-6 w-6" />
        <span className="text-sm font-medium">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="relative flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all space-y-3 group hover:bg-primary hover:text-primary-foreground"
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full">
          {badge}
        </span>
      )}
      <Icon className="h-10 w-10 text-primary group-hover:text-primary-foreground transition-colors" />
      <span className="text-base font-medium">{label}</span>
    </button>
  );
};

export default IconCard;
