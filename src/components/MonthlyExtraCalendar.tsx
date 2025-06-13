
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchUserHours } from "@/services/hoursService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const monthNames = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const MonthlyExtraCalendar = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [workedDays, setWorkedDays] = useState<any[]>([]);
  const { toast } = useToast();

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
    
    // Sort by day number
    allWorkedDays.sort((a, b) => parseInt(a.day) - parseInt(b.day));
    
    setWorkedDays(allWorkedDays);
  };

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'bpm':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'saiop':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sinfra':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLocationName = (location: string) => {
    switch (location) {
      case 'bpm':
        return '25° BPM';
      case 'saiop':
        return 'SAIOP';
      case 'sinfra':
        return 'SINFRA';
      default:
        return location;
    }
  };

  const totalHours = data && data["Total Geral"] ? parseFloat(data["Total Geral"].replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;

  if (loading) {
    return (
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-gray-200"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || workedDays.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-primary" />
          Dias Trabalhados - {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {workedDays.map((day, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 ${getLocationColor(day.location)} transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold">
                  {day.day}
                </span>
                <MapPin className="h-4 w-4" />
              </div>
              <div className="text-sm font-medium mb-1">
                {getLocationName(day.location)}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3" />
                <span>{day.hours}h</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total do mês:</span>
            <span className="text-lg font-bold text-primary">{totalHours}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyExtraCalendar;
