
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { HoursDonutChart } from "@/components/hours/HoursDonutChart";
import { HoursData } from "@/types/hours";
import { Calendar, DollarSign, AlertTriangle } from "lucide-react";
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

  // Convert Total Geral to a number for the chart
  const totalHours = data["Total Geral"] ? parseFloat(data["Total Geral"].replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;

  // Parse worked days data (assuming formats like "05/6h | 06/6h")
  const parseWorkDays = (workDaysStr: string | undefined) => {
    if (!workDaysStr) return [];
    return workDaysStr.split('|').map(day => day.trim()).filter(day => day);
  };
  const formatDayHour = (dayHourStr: string) => {
    // Check if the format already has a slash
    if (dayHourStr.includes('/')) return dayHourStr;

    // Convert format like "05:6h" or "05/6h" to "05/6h"
    return dayHourStr.replace(':', '/');
  };
  const bpmDays = parseWorkDays(data["Horas 25° BPM"]);
  const saiopDays = parseWorkDays(data["Saiop"]);
  const sinfraDays = parseWorkDays(data["Sinfra"]);

  // Calculate total hours for each section
  const calculateSectionHours = (days: string[]) => {
    return days.reduce((total, day) => {
      const hourMatch = day.match(/\/(\d+)h/);
      return total + (hourMatch ? parseInt(hourMatch[1], 10) : 0);
    }, 0);
  };
  const bpmTotalHours = calculateSectionHours(bpmDays);
  const saiopTotalHours = calculateSectionHours(saiopDays);
  const sinfraTotalHours = calculateSectionHours(sinfraDays);

  // Calculate the sum of all section hours
  const sumOfSectionHours = bpmTotalHours + saiopTotalHours + sinfraTotalHours;

  // Check for discrepancy between total hours and sum of section hours
  useEffect(() => {
    // Allow for small floating point differences (0.1 hours or less)
    const hasHourDiscrepancy = Math.abs(totalHours - sumOfSectionHours) > 0.1;
    setHasDiscrepancy(hasHourDiscrepancy);
  }, [totalHours, sumOfSectionHours]);

  // Get user data from Firebase based on the matricula
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Get user data from firestore collection "users" where registration matches the matricula
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("registration", "==", data.Matricula.toString()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserRank(userData.rank || "");
        } else {
          // Fallback to localStorage if not found in Firebase
          const localUserData = JSON.parse(localStorage.getItem('user') || '{}');
          setUserRank(localUserData?.rank || "");
        }
      } catch (error) {
        console.error("Error fetching user data from Firebase:", error);
        // Fallback to localStorage if error
        const localUserData = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRank(localUserData?.rank || "");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [data.Matricula]);

  // Define hourly rates based on rank
  const determineHourlyRate = (rank: string) => {
    if (!rank) return 41.13; // Default to lowest rate

    const lowerRank = rank.toLowerCase();
    if (lowerRank.includes('cb') || lowerRank.includes('sd')) {
      return 41.13; // Rate for "Cb e Sd"
    } else if (lowerRank.includes('sgt') || lowerRank.includes('sub')) {
      return 56.28; // Rate for "Sub e Sgt"
    } else if (lowerRank.includes('ten') || lowerRank.includes('cap') || lowerRank.includes('maj') || lowerRank.includes('cel')) {
      return 87.02; // Rate for "Oficiais"
    }
    return 41.13; // Default fallback
  };
  const hourlyRate = determineHourlyRate(userRank);
  const totalValue = totalHours * hourlyRate;
  return <div className="mt-6 space-y-4 my-0">
      <h2 className="text-center font-bold text-xl">{data.Nome}</h2>
      
      {/* Hours Donut Chart */}
      <HoursDonutChart totalHours={totalHours} />
      
      {/* Discrepancy Warning */}
      {hasDiscrepancy && (
        <Alert variant="default" className="border-yellow-400 bg-[#FEF7CD] text-amber-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-amber-800">Atenção</AlertTitle>
          <AlertDescription className="text-amber-700">
            Existe uma diferença entre o total de horas ({totalHours}h) e a soma dos dias trabalhados ({sumOfSectionHours}h).
            Procure a administração pois há um erro no cálculo das horas.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Worked Days Section */}
      <h3 className="font-medium text-gray-700">Dias Trabalhados</h3>
      <div className="space-y-4">
        {bpmDays.length > 0 && <div className="bg-slate-50 rounded-lg p-3 shadow-sm border border-slate-100">
            <h3 className="font-semibold mb-2 flex items-center justify-between mx-0 px-0 text-gray-700">
              <span className="flex items-center mx-0">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                25° BPM
              </span>
              <span className="text-primary font-medium my-0 px-0 mx-0 text-left text-emerald-600">{bpmTotalHours}h</span>
            </h3>
            <div className="flex flex-wrap gap-2 py-0 px-[5px] my-0 mx-0">
              {bpmDays.map((day, index) => <Badge key={`bpm-${index}`} variant="outline" className="bg-white text-gray-800 border-gray-200 py-1.5 px-3 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                  {formatDayHour(day)}
                </Badge>)}
            </div>
          </div>}
        
        {saiopDays.length > 0 && <div className="rounded-lg p-3 shadow-sm border border-blue-100 bg-slate-50">
            <h3 className="font-semibold mb-2 text-blue-700 flex items-center justify-between">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                SAIOP
              </span>
              <span className="text-blue-600 font-medium">{saiopTotalHours}h</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {saiopDays.map((day, index) => <Badge key={`saiop-${index}`} variant="outline" className="bg-white text-blue-800 border-blue-200 py-1.5 px-3 rounded-lg shadow-sm hover:bg-blue-50 transition-colors">
                  {formatDayHour(day)}
                </Badge>)}
            </div>
          </div>}
        
        {sinfraDays.length > 0 && <div className="bg-green-50 rounded-lg p-3 shadow-sm border border-green-100">
            <h3 className="font-semibold mb-2 text-green-700 flex items-center justify-between">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-green-600" />
                SINFRA
              </span>
              <span className="text-green-600 font-medium">{sinfraTotalHours}h</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {sinfraDays.map((day, index) => <Badge key={`sinfra-${index}`} variant="outline" className="bg-white text-green-800 border-green-200 py-1.5 px-3 rounded-lg shadow-sm hover:bg-green-50 transition-colors">
                  {formatDayHour(day)}
                </Badge>)}
            </div>
          </div>}
      </div>

      {/* Financial Summary Section */}
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
    </div>;
};
