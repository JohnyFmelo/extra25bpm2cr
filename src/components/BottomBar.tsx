
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, MapPinned, Scale, Home, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BottomBarProps {
  onHoursClick: () => void;
  onExtraClick: () => void;
  onTravelClick: () => void;
  onTcoClick: () => void;
  onEditorClick: () => void;
}

const BottomBar = ({ onHoursClick, onExtraClick, onTravelClick, onTcoClick, onEditorClick }: BottomBarProps) => {
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
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-3 bg-[#1A1F2C]/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-around z-50 gap-2 border border-gray-700/30">
      <button 
        onClick={onHoursClick} 
        className="flex flex-col items-center justify-center w-12 h-full text-[#8E9196] hover:text-primary transition-colors"
        aria-label="Horas"
      >
        <Clock className="h-6 w-6" />
        <span className="text-xs mt-1">Horas</span>
      </button>
      
      <button 
        onClick={onExtraClick} 
        className="flex flex-col items-center justify-center w-12 h-full text-[#8E9196] hover:text-primary transition-colors"
        aria-label="Extra"
      >
        <Calendar className="h-6 w-6" />
        <span className="text-xs mt-1">Extra</span>
      </button>
      
      <div className="relative">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white -mt-8 border-4 border-[#1A1F2C] shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Home"
        >
          <Home className="h-8 w-8" />
        </button>
      </div>
      
      <button 
        onClick={onTravelClick} 
        className="flex flex-col items-center justify-center w-12 h-full text-[#8E9196] hover:text-primary transition-colors"
        aria-label="Viagens"
      >
        <MapPinned className="h-6 w-6" />
        <span className="text-xs mt-1">Viagens</span>
      </button>
      
      <button 
        onClick={handleTcoClick} 
        className="flex flex-col items-center justify-center w-12 h-full text-[#8E9196] hover:text-primary transition-colors"
        aria-label="TCO"
      >
        <Scale className="h-6 w-6" />
        <span className="text-xs mt-1">TCO</span>
      </button>
    </div>
  );
};

export default BottomBar;
