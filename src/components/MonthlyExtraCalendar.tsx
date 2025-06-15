
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchUserHours } from "@/services/hoursService";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarDays, Clock, MapPin, TrendingUp } from "lucide-react";
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
        return 'bg-purple-600 text-white';
      case 'saiop':
        return 'bg-green-500 text-white';
      case 'sinfra':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-white/20 text-white';
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
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
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
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-white/90" />
              Dias Trabalhados - {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <p className="text-sm text-white/80">Seus serviços extras do mês</p>
          </div>
          <TrendingUp className="h-8 w-8 text-white/60" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Stats Row */}
        <div className="flex justify-between items-center mb-4 bg-white/10 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold">{workedDays.length}</div>
            <div className="text-xs text-white/80">Dias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalHours}h</div>
            <div className="text-xs text-white/80">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalHours > 0 ? (totalHours / workedDays.length).toFixed(1) : 0}h</div>
            <div className="text-xs text-white/80">Média/dia</div>
          </div>
        </div>

        {/* Worked Days List */}
        <div className="bg-white/10 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3 text-center">📅 DIAS TRABALHADOS</h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {workedDays.map((day, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getLocationColor(day.location)}`}>
                  {day.day}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">
                    {getLocationName(day.location)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{day.hours}h trabalhadas</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyExtraCalendar;
