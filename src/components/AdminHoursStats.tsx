
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Download, Calendar, TrendingUp } from "lucide-react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  volunteers?: string[];
}

interface MonthlyStats {
  month: string;
  totalHours: number;
  totalShifts: number;
  volunteersCount: number;
}

const AdminHoursStats = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
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
      calculateMonthlyStats(formattedSlots);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const calculateMonthlyStats = (slots: TimeSlot[]) => {
    const monthlyMap = new Map<string, { totalHours: number; totalShifts: number; volunteers: Set<string> }>();

    slots.forEach(slot => {
      if (slot.volunteers && slot.volunteers.length > 0) {
        const slotDate = parseISO(slot.date);
        const monthKey = format(slotDate, 'yyyy-MM');
        const slotHours = calculateTimeDifference(slot.start_time, slot.end_time);
        
        const current = monthlyMap.get(monthKey) || { 
          totalHours: 0, 
          totalShifts: 0, 
          volunteers: new Set<string>() 
        };
        
        slot.volunteers.forEach(volunteer => {
          current.volunteers.add(volunteer);
          current.totalHours += slotHours;
        });
        
        current.totalShifts += slot.volunteers.length;
        monthlyMap.set(monthKey, current);
      }
    });

    const stats: MonthlyStats[] = Array.from(monthlyMap.entries())
      .map(([monthKey, data]) => ({
        month: format(parseISO(`${monthKey}-01`), 'MMMM yyyy', { locale: ptBR }),
        totalHours: Math.round(data.totalHours * 10) / 10,
        totalShifts: data.totalShifts,
        volunteersCount: data.volunteers.size
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    setMonthlyStats(stats);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Mês', 'Total de Horas', 'Total de Turnos', 'Número de Voluntários'],
      ...monthlyStats.map(stat => [
        stat.month,
        stat.totalHours.toString(),
        stat.totalShifts.toString(),
        stat.volunteersCount.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estatisticas_horas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2 w-48"></div>
            <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentMonthStats = monthlyStats.find(stat => 
    stat.month.includes(format(new Date(), 'MMMM yyyy', { locale: ptBR }))
  );

  return (
    <div className="space-y-6">
      {/* Estatísticas do Mês Atual */}
      {currentMonthStats && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Estatísticas de {currentMonthStats.month}
              </div>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{currentMonthStats.totalHours}h</div>
                <div className="text-sm text-gray-600">Total de Horas</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{currentMonthStats.totalShifts}</div>
                <div className="text-sm text-gray-600">Total de Turnos</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{currentMonthStats.volunteersCount}</div>
                <div className="text-sm text-gray-600">Voluntários Únicos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado disponível</p>
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyStats.map((stat, index) => (
                <div
                  key={stat.month}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">{stat.month}</h3>
                    <p className="text-sm text-gray-500">
                      {stat.volunteersCount} voluntário{stat.volunteersCount !== 1 ? 's' : ''} participaram
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-blue-600">{stat.totalHours}h</div>
                    <div className="text-sm text-gray-500">{stat.totalShifts} turnos</div>
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

export default AdminHoursStats;
