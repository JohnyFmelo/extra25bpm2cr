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
  tableName?: string; // Nome da tabela do Supabase
}

// Lista de feriados nacionais e estaduais (exemplo para 2025)
const HOLIDAYS_2025 = [
  { date: '2025-01-01', name: 'Ano Novo' },
  { date: '2025-03-03', name: 'Carnaval' },
  { date: '2025-03-04', name: 'Carnaval' },
  { date: '2025-04-18', name: 'Sexta-feira Santa' },
  { date: '2025-04-21', name: 'Tiradentes' },
  { date: '2025-05-01', name: 'Dia do Trabalho' },
  { date: '2025-06-19', name: 'Corpus Christi' },
  { date: '2025-09-07', name: 'Independência' },
  { date: '2025-10-12', name: 'Nossa Senhora Aparecida' },
  { date: '2025-11-02', name: 'Finados' },
  { date: '2025-11-15', name: 'Proclamação da República' },
  { date: '2025-12-25', name: 'Natal' },
];

export const UserHoursDisplay = ({
  data,
  onClose,
  tableName = ""
}: UserHoursDisplayProps) => {
  const [userRank, setUserRank] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [calendarData, setCalendarData] = useState<{[key: number]: {source: string, hours: number}[]}>({});
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const totalHours = data["Total Geral"] ? parseFloat(data["Total Geral"].replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;

  // Determinar mês e ano a partir do nome da tabela
  useEffect(() => {
    if (tableName) {
      // Padrões comuns de nomes de tabela: "horas_extra_012025", "horas_jan_2025", "horas_janeiro_2025"
      
      // Tentar extrair mês e ano em formato numérico (ex: 012025 = janeiro 2025)
      const numericMatch = tableName.match(/(\d{2})(\d{4})$/);
      if (numericMatch) {
        const monthNum = parseInt(numericMatch[1], 10) - 1; // Ajustar para 0-11
        const yearNum = parseInt(numericMatch[2], 10);
        if (monthNum >= 0 && monthNum <= 11 && yearNum >= 2020 && yearNum <= 2030) {
          setMonth(monthNum);
          setYear(yearNum);
          return;
        }
      }
      
      // Tentar extrair mês por nome abreviado (ex: jan_2025)
      const monthNames = {
        'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
      };
      
      const monthMatch = tableName.toLowerCase().match(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez).*?(\d{4})/);
      if (monthMatch) {
        const monthName = monthMatch[1];
        const yearNum = parseInt(monthMatch[2], 10);
        if (monthNames[monthName] !== undefined && yearNum >= 2020 && yearNum <= 2030) {
          setMonth(monthNames[monthName]);
          setYear(yearNum);
          return;
        }
      }
      
      // Tentar extrair mês por nome completo (ex: janeiro_2025)
      const fullMonthNames = {
        'janeiro': 0, 'fevereiro': 1, 'marco': 2, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
        'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
      };
      
      const fullMonthMatch = tableName.toLowerCase().match(/(janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro).*?(\d{4})/);
      if (fullMonthMatch) {
        const monthName = fullMonthMatch[1];
        const yearNum = parseInt(fullMonthMatch[2], 10);
        if (fullMonthNames[monthName] !== undefined && yearNum >= 2020 && yearNum <= 2030) {
          setMonth(fullMonthNames[monthName]);
          setYear(yearNum);
          return;
        }
      }
      
      // Se não conseguir extrair do nome da tabela, tentar inferir pelos dados
      inferMonthFromData();
    } else {
      // Se não tiver nome de tabela, tentar inferir pelos dados
      inferMonthFromData();
    }
  }, [tableName]);

  // Função para inferir o mês a partir dos dados
  const inferMonthFromData = () => {
    // Se não conseguirmos determinar pelo nome da tabela, tentamos pelos dados
    // Assumimos que os dados são do mês atual ou do mês anterior
    const currentDate = new Date();
    
    // Se estamos nos primeiros dias do mês (1-5), provavelmente os dados são do mês anterior
    if (currentDate.getDate() <= 5) {
      let inferredMonth = currentDate.getMonth() - 1;
      let inferredYear = currentDate.getFullYear();
      
      if (inferredMonth < 0) {
        inferredMonth = 11; // Dezembro do ano anterior
        inferredYear -= 1;
      }
      
      setMonth(inferredMonth);
      setYear(inferredYear);
    } else {
      // Caso contrário, assumimos que é o mês atual
      setMonth(currentDate.getMonth());
      setYear(currentDate.getFullYear());
    }
  };

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

  // Verifica se um dia específico é feriado
  const isHoliday = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return HOLIDAYS_2025.some(holiday => holiday.date === dateStr);
  };

  // Obter o nome do mês
  const getMonthName = (monthIndex) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthIndex];
  };

  const renderCalendar = () => {
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Determinar o primeiro e último dia do mês
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    
    // Renderizar cabeçalho do calendário
    const header = (
      <div className="grid grid-cols-7 gap-1 mb-1">
        {daysOfWeek.map((day, index) => (
          <div 
            key={`header-${index}`} 
            className={`text-center text-xs font-medium py-1 ${
              index === 0 || index === 6 ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    );
    
    // Renderizar dias do calendário
    const calendarDays = [];
    
    // Preencher dias vazios do início do mês
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push(
        <div key={`empty-start-${i}`} className="h-16"></div>
      );
    }
    
    // Preencher os dias do mês
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Domingo, 6 = Sábado
      const holiday = isHoliday(day);
      const dayData = calendarData[day] || [];
      const hasDayData = dayData.length > 0;
      
      const dayContent = (
        <div 
          key={`day-${day}`} 
          className={`relative rounded-lg h-16 p-1 overflow-hidden ${
            isWeekend || holiday ? 'bg-red-50 border border-red-100' : 
            hasDayData ? 'bg-gray-50 border border-gray-100' : ''
          }`}
        >
          <div className={`text-xs font-medium absolute top-1 left-1 ${
            isWeekend || holiday ? 'text-red-500' : 'text-gray-700'
          }`}>
            {day}
          </div>
          <div className="mt-4">
            {dayData.map((entry, idx) => (
              <div 
                key={`entry-${day}-${idx}`} 
                className={`text-xs font-medium mt-1 py-0.5 px-1 rounded ${getSourceColor(entry.source)}`}
              >
                {entry.hours}h
              </div>
            ))}
          </div>
        </div>
      );
      
      calendarDays.push(dayContent);
    }
    
    // Preencher dias vazios do final do mês
    const totalCells = Math.ceil((firstDayOfWeek + totalDays) / 7) * 7;
    for (let i = totalDays + firstDayOfWeek; i < totalCells; i++) {
      calendarDays.push(
        <div key={`empty-end-${i}`} className="h-16"></div>
      );
    }
    
    return (
      <div className="calendar border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
        <div className="text-center font-medium text-lg mb-3 text-gray-700">
          {getMonthName(month)} {year}
        </div>
        {header}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays}
        </div>
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
        <div className="flex items-center rounded-md px-3 py-1 bg-red-50 text-red-700 border border-red-200">
          <span className="text-xs font-medium">Fim de semana/Feriado</span>
        </div>
      </div>
    );
  };

  const changeMonth = (increment) => {
    let newMonth = month + increment;
    let newYear = year;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    
    setMonth(newMonth);
    setYear(newYear);
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
          <div className="flex justify-between items-center mb-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => changeMonth(-1)}
              className="text-gray-600"
            >
              &lt; Anterior
            </Button>
            <h3 className="font-semibold text-gray-700 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Dias Trabalhados
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => changeMonth(1)}
              className="text-gray-600"
            >
              Próximo &gt;
            </Button>
          </div>
          
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
