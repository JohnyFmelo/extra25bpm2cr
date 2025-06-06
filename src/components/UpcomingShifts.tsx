
import React, { useState, useEffect } from "react";
import { format, parseISO, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserService, canUserViewTimeSlot } from "@/hooks/useUserService";

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  volunteers?: string[];
  description?: string;
  allowed_military_types?: string[];
}

const UpcomingShifts = () => {
  const [shifts, setShifts] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userService, isLoading: userLoading } = useUserService();
  
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  
  useEffect(() => {
    if (!volunteerName || userLoading) {
      setIsLoading(false);
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection);
    
    const unsubscribe = onSnapshot(q, snapshot => {
      const upcomingShifts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((slot: any) => {
        // Verificar se o usuário pode ver este horário baseado na categoria
        if (!canUserViewTimeSlot(slot.allowed_military_types, userService)) {
          return false;
        }

        // Check if the user is in the volunteers array
        const isUserVolunteer = slot.volunteers?.includes(volunteerName);
        if (!isUserVolunteer) return false;

        // Check if the date is today or in the future
        const slotDate = parseISO(slot.date);
        return isAfter(slotDate, today) || format(slotDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      }).sort((a: any, b: any) => {
        // Sort by date, then by start_time
        const dateA = new Date(a.date + 'T' + a.start_time);
        const dateB = new Date(b.date + 'T' + b.start_time);
        return dateA.getTime() - dateB.getTime();
      });

      setShifts(upcomingShifts.slice(0, 3) as TimeSlot[]);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [volunteerName, userService, userLoading]);
  
  const formatDateLabel = (dateString: string) => {
    const date = parseISO(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Hoje';
    } else if (format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return 'Amanhã';
    } else {
      return format(date, "EEEE", {
        locale: ptBR
      }).charAt(0).toUpperCase() + format(date, "EEEE", {
        locale: ptBR
      }).slice(1);
    }
  };
  
  if (isLoading || userLoading) {
    return <div className="text-center p-4">Carregando próximos serviços...</div>;
  }
  
  if (shifts.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Próximas extraordinárias</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shifts.map(shift => (
          <TooltipProvider key={shift.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-indigo-500" />
                        <span className="font-medium text-gray-800">
                          {formatDateLabel(shift.date)} - {format(parseISO(shift.date), 'dd/MM')}
                        </span>
                      </div>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 text-xs rounded-full font-medium">
                        Extra
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      <span>
                        {shift.start_time.slice(0, 5)} às {shift.end_time.slice(0, 5)}
                      </span>
                    </div>
                    
                    {shift.description && (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        {shift.description}
                      </div>
                    )}

                    {shift.allowed_military_types && shift.allowed_military_types.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Categorias: {shift.allowed_military_types.join(', ')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-gray-800 text-white">
                <p>Serviço extra agendado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

export default UpcomingShifts;
