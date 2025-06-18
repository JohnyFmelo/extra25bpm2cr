
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Check, X } from "lucide-react";
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

  const handlePresenceToggle = (isPresent: boolean) => {
    setPresenceStatus(isPresent);
    onPresenceChange(volunteerName, isPresent);
    
    toast({
      title: isPresent ? "Marcado como Presente" : "Marcado como Faltou",
      description: `${volunteerName} foi marcado como ${isPresent ? 'presente' : 'faltou'}.`,
      variant: isPresent ? "default" : "destructive"
    });
  };

  const getStatusIndicator = () => {
    if (presenceStatus === true) {
      return <div className="w-3 h-3 bg-green-500 rounded-full" />;
    } else if (presenceStatus === false) {
      return <div className="w-3 h-3 bg-red-500 rounded-full" />;
    }
    return <div className="w-3 h-3 bg-gray-300 rounded-full" />;
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusIndicator()}
      <div className="flex gap-1">
        <Button
          size="sm"
          variant={presenceStatus === true ? "default" : "outline"}
          onClick={() => handlePresenceToggle(true)}
          className={`h-7 px-2 text-xs ${
            presenceStatus === true 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "hover:bg-green-50 hover:text-green-600 hover:border-green-200"
          }`}
        >
          <Check className="h-3 w-3" />
          Presente
        </Button>
        <Button
          size="sm"
          variant={presenceStatus === false ? "destructive" : "outline"}
          onClick={() => handlePresenceToggle(false)}
          className={`h-7 px-2 text-xs ${
            presenceStatus === false 
              ? "bg-red-600 hover:bg-red-700" 
              : "hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          }`}
        >
          <X className="h-3 w-3" />
          Faltou
        </Button>
      </div>
    </div>
  );
};

export default PresenceControl;
