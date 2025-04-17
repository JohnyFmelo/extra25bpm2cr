import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HoursDonutChart } from "@/components/hours/HoursDonutChart";
import { HoursData } from "@/types/hours";
import { MapPin, DollarSign, AlertTriangle, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserHoursDisplayProps {
  data: HoursData;
  onClose: () => void;
}

export const UserHoursDisplay = ({
  data,
  onClose
}: UserHoursDisplayProps) => {
  const [userRank, setUserRank] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [calendarData, setCalendarData] = useState<{[key: number]: {source: string, hours: number}[]}>({});

  const totalHours = data["Total Geral"] ? parseFloat(data["Total Geral"].replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;

  const parseWorkDays = (workDaysStr: string | undefined, source: string) => {
    if (!workDaysStr) return [];
    return workDaysStr.split('|').map(day => {
      const trimmed = day.trim();
      if (!trimmed) return null;
      
      // Extract day and hours
      const dayMatch = trimmed.match(/(\d+)[\/:](\d+)h/);
      if (!dayMatch) return null;
      
      const dayNumber = parseInt(dayMatch[1], 10);
      const hours = parseInt(dayMatch[2], 10);
      
      return { day: dayNumber, hours, source };
    }).filter(Boolean);
  };

  useEffect(() => {
    // Parse work days from all sources
    const bpmDays = parseWorkDays(data["Horas 25° BPM"], "25° BPM");
    const saiopDays = parseWorkDays(data["Saiop"], "Saiop");
    const sinfraDays = parseWorkDays(data["Sinfra"], "Sinfra");
    
    const allDays = [...bpmDays, ...saiopDays, ...sinfraDays];
    
    // Organize days by day number
    const dayMap = {};
    allDays.forEach(entry => {
      if (!entry) return;
      if (!dayMap[entry.day]) {
        dayMap[entry.day] = [];
      }
      dayMap[entry.day].push({ source: entry.source, hours: entry.hours });
    });
    
    setCalendarData(dayMap);

    // Calculate total hours for each source
    const bpmTotalHours = bpmDays.reduce((total, day) => total + (day?.hours || 0), 0);
    const saiopTotalHours = saiopDays.reduce((total, day) => total + (day?.hours || 0), 0);
    const sinfraTotalHours = sinfraDays.reduce((total, day) => total + (day?.hours || 0), 0);
    
    const sumOfSectionHours = bpmTotalHours + saiopTotalHours + sinfraTotalHours;
    const hasHourDiscrepancy = Math.abs(totalHours - sumOfSectionHours) > 0.1;
    setHasDiscrepancy(hasHourDiscrepancy);
  }, [data]);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("registration", "==", data.Matricula.toString()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserRank(userData.rank || "");
        } else {
          const localUserData = JSON.parse(localStorage.getItem('user') || '{}');
          setUserRank(localUserData?.rank || "");
        }
      } catch (error) {
        console.error("Error fetching user data from Firebase:", error);
        const localUserData = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRank(localUserData?.rank || "");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [data.Matricula]);

  const determineHourlyRate = (rank: string) => {
    if (!rank) return 41.13;
    const lowerRank = rank.toLowerCase();
    if (lowerRank.includes('cb') || lowerRank.includes('sd')) {
      return 41.13;
    } else if (lowerRank.includes('sgt') || lowerRank.includes('sub')) {
      return 56.28;
    } else if (lowerRank.includes('ten') || lowerRank.includes('cap') || lowerRank.includes('maj') || lowerRank.includes('cel')) {
      return 87.02;
    }
    return 41.13;
  };

  const hourlyRate = determineHourlyRate(userRank);
  const totalValue = totalHours * hourlyRate;

  const getSourceColor = (source) => {
    switch (source) {
      case "25° BPM":
        return "bg-blue-100 text-blue-700";
      case "Saiop":
        return "bg-amber-100 text-amber-700";
      case "Sinfra":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getSourceTotals = () => {
    const totals = {
      "25° BPM": 0,
      "Saiop": 0,
      "Sinfra": 0
    };

    Object.values(calendarData).forEach(dayEntries => {
      dayEntries.forEach(entry => {
        if (totals[entry.source] !== undefined) {
          totals[entry.source] += entry.hours;
        }
      });
    });

    return totals;
  };

  const sourceTotals = getSourceTotals();

  const renderCalendar = () => {
    const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const totalDays = 31; // Assuming a month with 31 days max
    const weeks = [];
    
    // Render calendar header
    const header = (
      <div className="grid grid-cols-7 gap-1 mb-1">
        {daysOfWeek.map((day, index) => (
          <div key={`header-${index}`} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>
    );
    
    // Render calendar days
    let currentWeek = [];
    for (let i = 1; i <= totalDays; i++) {
      const dayData = calendarData[i] || [];
      const hasDayData = dayData.length > 0;
      
      const dayContent = (
        <div 
          key={`day-${i}`} 
          className={`relative rounded-lg text-center p-1 ${
            hasDayData ? "bg-gray-50 shadow-sm border border-gray-100" : ""
          }`}
        >
          <div className="text-xs font-medium text-gray-700">{i}</div>
          {dayData.map((entry, idx) => (
            <div 
              key={`entry-${i}-${idx}`} 
              className={`text-xs font-medium mt-1 py-1 px-2 rounded ${getSourceColor(entry.source)}`}
            >
              {entry.hours}h
            </div>
          ))}
        </div>
      );
      
      currentWeek.push(dayContent);
      
      if (currentWeek.length === 7 || i === totalDays) {
        // Fill in remaining days if needed
        while (currentWeek.length < 7) {
          currentWeek.push(<div key={`empty-${weeks.length}-${currentWeek.length}`}></div>);
        }
        
        weeks.push(
          <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-1 mb-1">
            {currentWeek}
          </div>
        );
        
        currentWeek = [];
      }
    }
    
    return (
      <div className="calendar border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
        {header}
        {weeks}
      </div>
    );
  };

  const renderSourceLegend = () => {
    const sources = [
      { name: "25° BPM", color: "bg-blue-100 text-blue-700 border-blue-200" },
      { name: "Saiop", color: "bg-amber-100 text-amber-700 border-amber-200" },
      { name: "Sinfra", color: "bg-green-100 text-green-700 border-green-200" }
    ];
    
    return (
      <div className="flex flex-wrap gap-2 justify-around mt-3">
        {sources.map(source => (
          <div key={source.name} className={`flex items-center rounded-md px-3 py-1 ${source.color} border`}>
            <MapPin className="h-3 w-3 mr-1" />
            <span className="text-xs font-medium">{source.name}</span>
            <span className="text-xs font-bold ml-1">
              {sourceTotals[source.name]}h
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-4 my-0">
      <h2 className="text-center font-bold text-xl">{data.Nome}</h2>
      
      <HoursDonutChart totalHours={totalHours} />
      
      {hasDiscrepancy && (
        <Alert variant="default" className="border-yellow-400 bg-yellow-50 text-amber-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-amber-800">Atenção</AlertTitle>
          <AlertDescription className="text-amber-700">
            Existe uma discrepância entre o total de horas ({totalHours}h) e a soma dos dias trabalhados ({Object.values(sourceTotals).reduce((a, b) => a + b, 0)}h).
            Procure a administração.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="bg-slate-50 border-slate-100 shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Dias Trabalhados
          </h3>
          
          {renderCalendar()}
          {renderSourceLegend()}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-100 shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-primary" />
            Resumo Financeiro
          </h3>
          
          <div className="text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Graduação:</span>
              <span className="font-medium">{userRank || "Não informada"}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor por hora:</span>
              <span className="font-medium">R$ {hourlyRate.toFixed(2).replace('.', ',')}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Horas trabalhadas:</span>
              <span className="font-medium">{totalHours}h</span>
            </div>
            
            <Separator className="my-2 bg-blue-200/50" />
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Valor Estimado:</span>
              <span className="text-emerald-600 font-semibold text-lg">R$ {totalValue.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full mt-4" onClick={onClose}>
        Fechar
      </Button>
    </div>
  );
};
