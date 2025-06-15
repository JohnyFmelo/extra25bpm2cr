
import React, { useState, useEffect } from "react";
import { format, parseISO, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Calendar, TrendingUp } from "lucide-react";

// Update interface to match Firestore document structure
interface TimeSlot {
  id?: string;
  date: string; // Changed from Date to string to match Firestore
  start_time: string; // Updated to match Firestore field name
  end_time: string; // Updated to match Firestore field name
  volunteers?: string[];
  description?: string;
}

const UpcomingShifts = () => {
  const [shifts, setShifts] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  
  useEffect(() => {
    if (!volunteerName) {
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

      // Type assertion to ensure TypeScript knows these objects match the TimeSlot interface
      setShifts(upcomingShifts.slice(0, 5) as TimeSlot[]);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [volunteerName]);
  
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
  
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded mb-2"></div>
            <div className="h-6 bg-white/20 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-8 bg-white/20 rounded"></div>
              <div className="h-8 bg-white/20 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (shifts.length === 0) {
    return null;
  }
  
  return (
    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-white/90" />
              Próximas Extraordinárias
            </h3>
            <p className="text-sm text-white/80">Seus próximos serviços extras</p>
          </div>
          <TrendingUp className="h-8 w-8 text-white/60" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="bg-white/10 rounded-lg p-4">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {shifts.map(shift => (
              <div
                key={shift.id}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {format(parseISO(shift.date), 'dd')}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">
                    {formatDateLabel(shift.date)} - {format(parseISO(shift.date), 'dd/MM')}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {shift.start_time.slice(0, 5)} às {shift.end_time.slice(0, 5)}
                    </span>
                  </div>
                  {shift.description && (
                    <span className="text-xs text-white/70 mt-1 italic break-words">
                      {shift.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingShifts;
