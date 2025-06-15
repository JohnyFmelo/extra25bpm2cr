
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
      <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
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
    <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
              <Calendar className="h-6 w-6" />
              Próximas Extraordinárias
            </h3>
            <p className="text-emerald-100 text-sm">Seus próximos serviços extras</p>
          </div>
          <div className="bg-white/20 rounded-full p-2">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-6">
        <div className="space-y-3">
          {shifts.map(shift => (
            <div
              key={shift.id}
              className="bg-white/15 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="bg-white/25 rounded-lg p-3 text-center min-w-[60px]">
                  <div className="text-lg font-bold leading-none">
                    {format(parseISO(shift.date), 'dd')}
                  </div>
                  <div className="text-xs text-emerald-100 mt-1">
                    {format(parseISO(shift.date), 'MMM', { locale: ptBR })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg mb-1">
                    {formatDateLabel(shift.date)}
                  </div>
                  <div className="flex items-center gap-2 text-emerald-100 text-sm mb-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {shift.start_time.slice(0, 5)} às {shift.end_time.slice(0, 5)}
                    </span>
                  </div>
                  {shift.description && (
                    <div className="text-sm text-emerald-100 italic leading-relaxed">
                      {shift.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingShifts;
