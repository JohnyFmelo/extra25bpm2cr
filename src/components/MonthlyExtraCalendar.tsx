
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchUserHours } from "@/services/hoursService";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarDays, Clock, Award, BarChart3 } from "lucide-react";
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
        return 'bg-purple-500 text-white border-purple-600';
      case 'saiop':
        return 'bg-green-500 text-white border-green-600';
      case 'sinfra':
        return 'bg-blue-500 text-white border-blue-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
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
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
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

  if (!data || workedDays.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
              <CalendarDays className="h-6 w-6" />
              Dias Trabalhados
            </h3>
            <p className="text-blue-100 text-sm">
              {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className="bg-white/20 rounded-full p-2">
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
            <div className="text-2xl font-bold mb-1">{workedDays.length}</div>
            <div className="text-xs text-blue-100">Dias</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
            <div className="text-2xl font-bold mb-1">{totalHours}h</div>
            <div className="text-xs text-blue-100">Total</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
            <div className="text-2xl font-bold mb-1">{totalHours > 0 ? (totalHours / workedDays.length).toFixed(1) : 0}h</div>
            <div className="text-xs text-blue-100">Média</div>
          </div>
        </div>

        {/* Worked Days List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {workedDays.map((day, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold border-2 ${getLocationColor(day.location)}`}>
                  {day.day}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base mb-1">
                    {getLocationName(day.location)}
                  </div>
                  <div className="flex items-center gap-2 text-blue-100 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{day.hours}h trabalhadas</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyExtraCalendar;
