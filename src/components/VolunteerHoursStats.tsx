
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Calculator } from "lucide-react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  volunteers?: string[];
}

interface VolunteerHours {
  name: string;
  totalHours: number;
  shiftsCount: number;
  averageHours: number;
}

const VolunteerHoursStats = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [volunteerStats, setVolunteerStats] = useState<VolunteerHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calculateTimeDifference = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    
    if (endHour < startHour || (endHour === 0 && startHour > 0)) {
      endHour += 24;
    }
    
    let diffHours = endHour - startHour;
    let diffMinutes = endMinute - startMinute;
    
    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }
    
    return diffHours + diffMinutes / 60;
  };

  useEffect(() => {
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let slotDateStr: string;
        
        if (data.date && typeof data.date.toDate === 'function') {
          slotDateStr = format(data.date.toDate(), 'yyyy-MM-dd');
        } else {
          slotDateStr = data.date as string;
        }
        
        return {
          id: docSnap.id,
          date: slotDateStr,
          start_time: data.start_time,
          end_time: data.end_time,
          volunteers: data.volunteers || []
        };
      });

      setTimeSlots(formattedSlots);
      calculateVolunteerStats(formattedSlots);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const calculateVolunteerStats = (slots: TimeSlot[]) => {
    const volunteerMap = new Map<string, { totalHours: number; shiftsCount: number }>();

    slots.forEach(slot => {
      if (slot.volunteers && slot.volunteers.length > 0) {
        const slotHours = calculateTimeDifference(slot.start_time, slot.end_time);
        
        slot.volunteers.forEach(volunteer => {
          const current = volunteerMap.get(volunteer) || { totalHours: 0, shiftsCount: 0 };
          volunteerMap.set(volunteer, {
            totalHours: current.totalHours + slotHours,
            shiftsCount: current.shiftsCount + 1
          });
        });
      }
    });

    const stats: VolunteerHours[] = Array.from(volunteerMap.entries())
      .map(([name, data]) => ({
        name,
        totalHours: Math.round(data.totalHours * 10) / 10,
        shiftsCount: data.shiftsCount,
        averageHours: Math.round((data.totalHours / data.shiftsCount) * 10) / 10
      }))
      .sort((a, b) => b.totalHours - a.totalHours);

    setVolunteerStats(stats);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2 w-48"></div>
              <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalVolunteers = volunteerStats.length;
  const totalHoursWorked = volunteerStats.reduce((sum, volunteer) => sum + volunteer.totalHours, 0);
  const averageHoursPerVolunteer = totalVolunteers > 0 ? Math.round((totalHoursWorked / totalVolunteers) * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            Estatísticas de Horas dos Voluntários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{totalVolunteers}</div>
              <div className="text-sm text-gray-600">Voluntários Ativos</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{Math.round(totalHoursWorked * 10) / 10}h</div>
              <div className="text-sm text-gray-600">Total de Horas</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calculator className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{averageHoursPerVolunteer}h</div>
              <div className="text-sm text-gray-600">Média por Voluntário</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ranking de Horas por Voluntário</CardTitle>
        </CardHeader>
        <CardContent>
          {volunteerStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum voluntário encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {volunteerStats.map((volunteer, index) => (
                <div
                  key={volunteer.name}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {volunteer.name} - <span className="text-blue-600 font-bold">{volunteer.totalHours}h</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {volunteer.shiftsCount} {volunteer.shiftsCount === 1 ? 'turno' : 'turnos'} • 
                        Média: {volunteer.averageHours}h por turno
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-2xl text-blue-600">
                      {volunteer.totalHours}h
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Acumulado
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VolunteerHoursStats;
