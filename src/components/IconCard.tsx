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
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow space-y-2"
    >
      <Icon className="h-8 w-8 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
};

export default IconCard;