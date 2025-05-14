
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HoursDonutChart } from "@/components/hours/HoursDonutChart";
import { WorkedDaysCalendar } from "@/components/hours/WorkedDaysCalendar";
import { HoursData } from "@/types/hours";
import { DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserHoursDisplayProps {
  data: HoursData;
  onClose: () => void;
  isAdmin?: boolean;
  monthYear?: string;
}

export const UserHoursDisplay = ({
  data,
  onClose,
  isAdmin = false,
  monthYear
}: UserHoursDisplayProps) => {
  const [userRank, setUserRank] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);

  const totalHours = data["Total Geral"] ? parseFloat(data["Total Geral"].replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;

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

  const bpmDays = parseWorkDays(data["Horas 25° BPM"], 'bpm');
  const saiopDays = parseWorkDays(data["Saiop"], 'saiop');
  const sinfraDays = parseWorkDays(data["Sinfra"], 'sinfra');

  const allWorkedDays = [...bpmDays, ...saiopDays, ...sinfraDays];

  const calculateSectionHours = (workDaysStr: string | undefined) => {
    if (!workDaysStr) return 0;
    
    return workDaysStr.split('|').reduce((total, day) => {
      const hourMatch = day.match(/\/(\d+)h/);
      return total + (hourMatch ? parseInt(hourMatch[1], 10) : 0);
    }, 0);
  };

  const bpmTotalHours = data["Horas 25° BPM"] ? calculateSectionHours(data["Horas 25° BPM"]) : 0;
  const saiopTotalHours = data["Saiop"] ? calculateSectionHours(data["Saiop"]) : 0;
  const sinfraTotalHours = data["Sinfra"] ? calculateSectionHours(data["Sinfra"]) : 0;

  const sumOfSectionHours = bpmTotalHours + saiopTotalHours + sinfraTotalHours;

  useEffect(() => {
    const hasHourDiscrepancy = Math.abs(totalHours - sumOfSectionHours) > 0.1;
    setHasDiscrepancy(hasHourDiscrepancy);
  }, [totalHours, sumOfSectionHours]);

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

  // Use the provided monthYear or generate a default one for current month
  const getMonthYear = () => {
    if (monthYear) return monthYear;
    
    const currentDate = new Date();
    return `${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
  };

  return (
    <div className="mt-6 space-y-4 my-0">
      <h2 className="text-center font-bold text-xl">{data.Nome}</h2>
      
      <HoursDonutChart totalHours={totalHours} />
      
      {hasDiscrepancy && (
        <Alert variant="default" className="border-yellow-400 bg-[#FEF7CD] text-amber-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-amber-800">Atenção</AlertTitle>
          <AlertDescription className="text-amber-700">
            Existe uma discrepância entre o total de horas ({totalHours}h) e a soma dos dias trabalhados ({sumOfSectionHours}h).
            Procure a administração.
          </AlertDescription>
        </Alert>
      )}
      
      <h3 className="font-medium text-gray-700">Dias Trabalhados</h3>
      <WorkedDaysCalendar
        monthYear={getMonthYear()}
        workedDays={allWorkedDays}
        total={totalHours.toString()}
        isAdmin={isAdmin}
      />

      <Card className="bg-blue-50 border-blue-100 shadow-sm mt-4">
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
