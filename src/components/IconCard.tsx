import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface IconCardProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

const IconCard = ({ icon: Icon, label, onClick }: IconCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (label === "Horas") {
      navigate("/hours");
    } else if (label === "Escala") {
      navigate("/schedule");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all space-y-3 group hover:bg-primary hover:text-primary-foreground"
    >
      <Icon className="h-10 w-10 text-primary group-hover:text-primary-foreground transition-colors" />
      <span className="text-base font-medium">{label}</span>
    </button>
  );
};

export default IconCard;