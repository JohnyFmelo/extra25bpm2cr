
import React, { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface PresenceControlProps {
  volunteerName: string;
  timeSlotId: string;
  date: string;
  onPresenceChange: (volunteerName: string, isPresent: boolean) => void;
  initialStatus?: boolean | null;
}

const PresenceControl = ({ 
  volunteerName, 
  timeSlotId, 
  date,
  onPresenceChange,
  initialStatus = null 
}: PresenceControlProps) => {
  const [presenceStatus, setPresenceStatus] = useState<boolean | null>(initialStatus);
  const { toast } = useToast();

  const handleToggle = () => {
    const newStatus = presenceStatus === true ? false : true;
    setPresenceStatus(newStatus);
    onPresenceChange(volunteerName, newStatus);
    
    toast({
      title: newStatus ? "Marcado como Presente" : "Marcado como Faltou",
      description: `${volunteerName} foi marcado como ${newStatus ? 'presente' : 'faltou'}.`,
      variant: newStatus ? "default" : "destructive"
    });
  };

  const getButtonText = () => {
    if (presenceStatus === true) return "PRESENTE";
    if (presenceStatus === false) return "FALTOU";
    return "MARCAR";
  };

  const getButtonVariant = () => {
    if (presenceStatus === true) return "default";
    if (presenceStatus === false) return "destructive";
    return "outline";
  };

  const getButtonClassName = () => {
    if (presenceStatus === true) {
      return "bg-green-500 hover:bg-green-600 text-white border-green-500";
    }
    if (presenceStatus === false) {
      return "bg-red-500 hover:bg-red-600 text-white border-red-500";
    }
    return "hover:bg-gray-50";
  };

  return (
    <Button
      size="sm"
      variant={getButtonVariant()}
      onClick={handleToggle}
      className={`h-7 px-3 text-xs font-medium ${getButtonClassName()}`}
    >
      {getButtonText()}
    </Button>
  );
};

export default PresenceControl;
