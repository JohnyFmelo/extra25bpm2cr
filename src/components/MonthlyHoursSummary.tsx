
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, TrendingUp, CalendarClock } from "lucide-react";
import { collection, query, onSnapshot, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import supabase from "@/lib/supabaseClient";

const MonthlyHoursSummary = () => {
  const [hoursData, setHoursData] = useState<{
    totalHours: string | null;
    monthlyTarget: string | null;
    location?: {
      bpm?: number;
      saiop?: number;
      sinfra?: number;
    };
  }>({
    totalHours: null,
    monthlyTarget: null,
    location: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const userName = userData ? `${userData.rank} ${userData.warName}` : '';
  const currentMonth = format(new Date(), 'MMMM', { locale: ptBR }).toUpperCase();
  
  useEffect(() => {
    const fetchHoursData = async () => {
      if (!userName) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Define the table name based on current month
        type TableName = "JANEIRO" | "FEVEREIRO" | "MARCO" | "ABRIL" | "MAIO" | "JUNHO" | 
                        "JULHO" | "AGOSTO" | "SETEMBRO" | "OUTUBRO" | "NOVEMBRO" | "DEZEMBRO" | "ESCALA";
                      
        let tableName: TableName;
                      
        if (currentMonth === 'JANEIRO') tableName = "JANEIRO";
        else if (currentMonth === 'FEVEREIRO') tableName = "FEVEREIRO";
        else if (currentMonth === 'MARÇO') tableName = "MARCO";
        else if (currentMonth === 'ABRIL') tableName = "ABRIL";
        else if (currentMonth === 'MAIO') tableName = "MAIO";
        else if (currentMonth === 'JUNHO') tableName = "JUNHO";
        else if (currentMonth === 'JULHO') tableName = "JULHO";
        else if (currentMonth === 'AGOSTO') tableName = "AGOSTO";
        else if (currentMonth === 'SETEMBRO') tableName = "SETEMBRO";
        else if (currentMonth === 'OUTUBRO') tableName = "OUTUBRO";
        else if (currentMonth === 'NOVEMBRO') tableName = "NOVEMBRO";
        else tableName = "DEZEMBRO";
        
        // Query the database
        const { data, error } = await supabase
          .from(tableName)
          .select('Nome, "Total Geral", META')
          .ilike('Nome', `%${userData.warName}%`);
        
        if (error) {
          console.error('Error fetching hours data:', error);
          setIsLoading(false);
          return;
        }
        
        if (data && data.length > 0) {
          setHoursData({
            totalHours: data[0]['Total Geral'] || '0',
            monthlyTarget: data[0]['META'] || '120',
            location: {}
          });
        }
        
        // Get location breakdown from timeSlots
        const timeSlotsCollection = collection(db, 'timeSlots');
        const q = query(timeSlotsCollection);
        const snapshot = await getDocs(q);
        
        const locationHours = {
          bpm: 0,
          saiop: 0,
          sinfra: 0
        };
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.volunteers?.includes(userName)) {
            // Calculate hours from time slot
            const [startHour, startMinute] = data.start_time.split(':').map(Number);
            let [endHour, endMinute] = data.end_time.split(':').map(Number);
            if (endHour < startHour || (endHour === 0 && startHour > 0)) {
              endHour += 24; // Handle midnight crossing
            }
            let diffHours = endHour - startHour;
            let diffMinutes = endMinute - startMinute;
            if (diffMinutes < 0) {
              diffHours -= 1;
              diffMinutes += 60;
            }
            const totalHours = diffHours + diffMinutes / 60;
            
            // Assign to location (default to bpm if not specified)
            const location = data.location || 'bpm';
            locationHours[location] += totalHours;
          }
        });
        
        setHoursData(prev => ({
          ...prev,
          location: locationHours
        }));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchHoursData:', error);
        setIsLoading(false);
      }
    };
    
    fetchHoursData();
  }, [userName, currentMonth, userData?.warName]);
  
  if (isLoading) {
    return <div className="text-center p-4">Carregando dados de horas...</div>;
  }
  
  if (!hoursData.totalHours) {
    return null;
  }
  
  const totalHoursNum = parseFloat(hoursData.totalHours);
  const targetHoursNum = hoursData.monthlyTarget ? parseFloat(hoursData.monthlyTarget) : 120;
  const progressPercent = Math.min(Math.round((totalHoursNum / targetHoursNum) * 100), 100);
  
  const formatHours = (hours: number) => {
    return hours.toFixed(1).replace('.0', '');
  };
  
  const currentMonthName = format(new Date(), 'MMMM', { locale: ptBR });
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all mb-8 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <CalendarClock className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-800 capitalize">
              Horas de {currentMonthName}
            </h3>
          </div>
          <div className="flex items-center space-x-1 text-teal-700 bg-teal-100 rounded-full px-3 py-1 text-sm font-medium">
            <Clock className="h-4 w-4" />
            <span>{hoursData.totalHours}h</span>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Progresso</span>
            <span className="text-sm font-medium text-gray-700">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                progressPercent >= 100 ? 'bg-emerald-500' : 'bg-teal-500'
              }`} 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>0h</span>
            <span>Meta: {hoursData.monthlyTarget}h</span>
          </div>
        </div>
        
        {hoursData.location && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {hoursData.location.bpm > 0 && (
              <div className="p-2 bg-purple-100 rounded-lg text-center">
                <div className="text-xs text-purple-700 mb-1">25° BPM</div>
                <div className="font-semibold text-purple-800">{formatHours(hoursData.location.bpm)}h</div>
              </div>
            )}
            
            {hoursData.location.saiop > 0 && (
              <div className="p-2 bg-green-100 rounded-lg text-center">
                <div className="text-xs text-green-700 mb-1">SAIOP</div>
                <div className="font-semibold text-green-800">{formatHours(hoursData.location.saiop)}h</div>
              </div>
            )}
            
            {hoursData.location.sinfra > 0 && (
              <div className="p-2 bg-blue-100 rounded-lg text-center">
                <div className="text-xs text-blue-700 mb-1">SINFRA</div>
                <div className="font-semibold text-blue-800">{formatHours(hoursData.location.sinfra)}h</div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center text-xs text-gray-500 mt-3">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span>Atualizado com base em seus serviços extras</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyHoursSummary;
