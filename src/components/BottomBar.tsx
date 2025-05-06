
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, MapPinned, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BottomBarProps {
  onHoursClick: () => void;
  onExtraClick: () => void;
  onTravelClick: () => void;
  onTcoClick: () => void;
}

const BottomBar = ({ onHoursClick, onExtraClick, onTravelClick, onTcoClick }: BottomBarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.userType === "admin";

  const handleTcoClick = () => {
    if (isAdmin) {
      onTcoClick();
    } else {
      toast({
        title: "Acesso Restrito",
        description: "Em desenvolvimento. Disponível apenas para administradores.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#1A1F2C] shadow-lg flex items-center justify-around z-50">
      <button 
        onClick={onHoursClick} 
        className="flex flex-col items-center justify-center w-1/4 h-full text-[#8E9196] hover:text-primary transition-colors"
      >
        <Clock className="h-6 w-6" />
        <span className="text-xs mt-1">Horas</span>
      </button>
      <button 
        onClick={onExtraClick} 
        className="flex flex-col items-center justify-center w-1/4 h-full text-[#8E9196] hover:text-primary transition-colors"
      >
        <Calendar className="h-6 w-6" />
        <span className="text-xs mt-1">Extra</span>
      </button>
      <button 
        onClick={onTravelClick} 
        className="flex flex-col items-center justify-center w-1/4 h-full text-[#8E9196] hover:text-primary transition-colors"
      >
        <MapPinned className="h-6 w-6" />
        <span className="text-xs mt-1">Viagens</span>
      </button>
      <button 
        onClick={handleTcoClick} 
        className="flex flex-col items-center justify-center w-1/4 h-full text-[#8E9196] hover:text-primary transition-colors"
      >
        <Scale className="h-6 w-6" />
        <span className="text-xs mt-1">TCO</span>
      </button>
    </div>
  );
};

export default BottomBar;
