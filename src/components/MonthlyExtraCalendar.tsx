import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchUserHours } from "@/services/hoursService";
import { WorkedDaysCalendar } from "@/components/hours/WorkedDaysCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const monthNames = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MonthlyExtraCalendar = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [workedDays, setWorkedDays] = useState<any[]>([]);
  const {
    toast
  } = useToast();
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const currentMonth = new Date().getMonth();
    const currentMonthName = monthNames[currentMonth];
    const fetchExtraData = async () => {
      if (!userData?.registration) {
        setLoading(false);
        return;
      }
      try {
        const result = await fetchUserHours(currentMonthName, userData.registration);
        if (result && result.length > 0) {
          setData(result[0]);
          parseWorkedDays(result[0]);
        }
      } catch (error) {
        console.error("Error fetching extra shifts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExtraData();
  }, []);
  const parseWorkDays = (workDaysStr: string | undefined, location: 'bpm' | 'saiop' | 'sinfra') => {
    if (!workDaysStr) return [];
    return workDaysStr.split('|').map(day => {
      const [dayNumber, hoursWithH] = day.trim().split('/');
      if (!hoursWithH) {
        return {
          day: dayNumber || '',
          hours: '',
          location
        };
      }
      return {
        day: dayNumber || '',
        hours: hoursWithH.replace('h', ''),
        location
      };
    }).filter(day => day.day);
  };
  const parseWorkedDays = (data: any) => {
    if (!data) return;
    const bpmDays = parseWorkDays(data["Horas 25° BPM"], 'bpm');
    const saiopDays = parseWorkDays(data["Saiop"], 'saiop');
    const sinfraDays = parseWorkDays(data["Sinfra"], 'sinfra');
    const allWorkedDays = [...bpmDays, ...saiopDays, ...sinfraDays];
    setWorkedDays(allWorkedDays);
  };

  // Get the current month in the format needed for the calendar
  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getMonth() + 1}/${now.getFullYear()}`;
  };
  const totalHours = data && data["Total Geral"] ? parseFloat(data["Total Geral"].replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;
  if (loading) {
    return <Card className="shadow-sm border border-gray-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 animate-pulse">
            <div className="flex items-center mb-4">
              <div className="h-5 w-5 rounded-full bg-gray-200 mr-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="h-24 bg-gray-200/80 rounded"></div>
          </div>
        </CardContent>
      </Card>;
  }
  if (!data || workedDays.length === 0) {
    return null;
  }
  return <Card className="shadow-sm border border-gray-100 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center mb-4">
            <CalendarDays className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Extras do Mês Atual</h2>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 px-0 py-0">
            <WorkedDaysCalendar monthYear={getCurrentMonthYear()} workedDays={workedDays} total={totalHours.toString()} isAdmin={false} />
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default MonthlyExtraCalendar;