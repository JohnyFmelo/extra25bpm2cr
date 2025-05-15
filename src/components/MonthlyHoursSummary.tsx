
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, TrendingUp, CalendarClock, Calendar } from "lucide-react";
import { collection, query, onSnapshot, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import supabase from "@/lib/supabaseClient";
import { Progress } from "@/components/ui/progress";

interface LocationHours {
  bpm: number;
  saiop: number;
  sinfra: number;
  workDays: {
    day: string;
    location: string;
    hours: string;
  }[];
}

const MonthlyHoursSummary = () => {
  const [hoursData, setHoursData] = useState<{
    totalHours: string | null;
    monthlyTarget: string | null;
    location: LocationHours;
  }>({
    totalHours: null,
    monthlyTarget: null,
    location: {
      bpm: 0,
      saiop: 0,
      sinfra: 0,
      workDays: []
    }
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
          .select('Nome, "Total Geral", META, "Horas 25° BPM", Saiop, Sinfra')
          .ilike('Nome', `%${userData.warName}%`);
        
        if (error) {
          console.error('Error fetching hours data:', error);
          setIsLoading(false);
          return;
        }
        
        const locationHours = {
          bpm: 0,
          saiop: 0,
          sinfra: 0,
          workDays: [] as { day: string; location: string; hours: string }[]
        };
        
        // Parse work days from the data
        if (data && data.length > 0) {
          // Parse BPM hours
          if (data[0]['Horas 25° BPM']) {
            const bpmDays = data[0]['Horas 25° BPM'].split('|').filter(Boolean);
            bpmDays.forEach((day: string) => {
              const [dayNum, hoursWithH] = day.trim().split('/');
              if (dayNum && hoursWithH) {
                const hours = hoursWithH.replace('h', '');
                locationHours.bpm += parseFloat(hours);
                locationHours.workDays.push({
                  day: dayNum,
                  location: 'bpm',
                  hours
                });
              }
            });
          }
          
          // Parse SAIOP hours
          if (data[0]['Saiop']) {
            const saiopDays = data[0]['Saiop'].split('|').filter(Boolean);
            saiopDays.forEach((day: string) => {
              const [dayNum, hoursWithH] = day.trim().split('/');
              if (dayNum && hoursWithH) {
                const hours = hoursWithH.replace('h', '');
                locationHours.saiop += parseFloat(hours);
                locationHours.workDays.push({
                  day: dayNum,
                  location: 'saiop',
                  hours
                });
              }
            });
          }
          
          // Parse SINFRA hours
          if (data[0]['Sinfra']) {
            const sinfraDays = data[0]['Sinfra'].split('|').filter(Boolean);
            sinfraDays.forEach((day: string) => {
              const [dayNum, hoursWithH] = day.trim().split('/');
              if (dayNum && hoursWithH) {
                const hours = hoursWithH.replace('h', '');
                locationHours.sinfra += parseFloat(hours);
                locationHours.workDays.push({
                  day: dayNum,
                  location: 'sinfra',
                  hours
                });
              }
            });
          }
          
          // Sort workDays by day number
          locationHours.workDays.sort((a, b) => parseInt(a.day) - parseInt(b.day));
          
          setHoursData({
            totalHours: data[0]['Total Geral'] || '0',
            monthlyTarget: data[0]['META'] || '120',
            location: locationHours
          });
        }
        
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
  
  const totalHoursNum = parseFloat(hoursData.totalHours.replace(',', '.'));
  const targetHoursNum = hoursData.monthlyTarget ? parseFloat(hoursData.monthlyTarget.replace(',', '.')) : 120;
  const progressPercent = Math.min(Math.round((totalHoursNum / targetHoursNum) * 100), 100);
  
  const formatHours = (hours: number) => {
    return hours.toFixed(1).replace('.0', '');
  };
  
  const currentMonthName = format(new Date(), 'MMMM', { locale: ptBR });
  const getLocationColor = (location: string) => {
    if (location === 'bpm') return 'bg-purple-100 text-purple-800';
    if (location === 'saiop') return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };
  
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
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Progresso</span>
            <span className="text-sm font-medium text-gray-700">{progressPercent}%</span>
          </div>
          <Progress 
            value={progressPercent} 
            className="h-2.5 bg-gray-200" 
            indicatorClassName={progressPercent >= 100 ? 'bg-emerald-500' : 'bg-teal-500'} 
          />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0h</span>
            <span>Meta: {hoursData.monthlyTarget}h</span>
          </div>
        </div>
        
        {/* Location breakdown */}
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
        
        {/* Daily breakdown */}
        {hoursData.location.workDays.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">Dias Trabalhados</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {hoursData.location.workDays.map((day, index) => (
                <div 
                  key={index} 
                  className={`px-2 py-1 rounded-md text-xs font-medium ${getLocationColor(day.location)}`}
                >
                  Dia {day.day}: {day.hours}h
                </div>
              ))}
            </div>
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
