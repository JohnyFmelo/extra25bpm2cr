
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { HoursDonutChart } from "@/components/hours/HoursDonutChart";
import { HoursData } from "@/types/hours";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UserHoursDisplayProps {
  data: HoursData;
  onClose: () => void;
}

export const UserHoursDisplay = ({
  data,
  onClose
}: UserHoursDisplayProps) => {
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

  // Calculate financial summary
  const calculateHourlyRate = () => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const rank = userData?.rank || '';

    // Determine hourly rate based on rank
    if (rank.includes('Sd') || rank.includes('Cb')) {
      return 41.13;
    } else if (rank.includes('Sgt') || rank.includes('Sub')) {
      return 56.28;
    } else if (rank.includes('Ten') || rank.includes('Cap') || rank.includes('Maj') || rank.includes('Cel')) {
      return 87.02;
    }
    
    // Default value if rank not recognized
    return 41.13;
  };

  const hourlyRate = calculateHourlyRate();
  const totalToReceive = totalHours * hourlyRate;

  return (
    <div className="space-y-6 mt-6">
      <h2 className="text-center font-bold text-xl text-gray-800 mb-4">{data.Nome}</h2>
      
      {/* Hours Donut Chart */}
      <HoursDonutChart totalHours={totalHours} />
      
      {/* Financial Summary */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Resumo Financeiro</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total de Horas:</span>
              <span className="font-medium">{totalHours}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor por Hora:</span>
              <span className="font-medium">R$ {hourlyRate.toFixed(2)}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total a Receber:</span>
              <span className="text-green-600">R$ {totalToReceive.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Worked Days Section */}
      <div>
        <h3 className="font-medium text-gray-800 mb-4">Dias Trabalhados</h3>
        <div className="space-y-4">
          {bpmDays.length > 0 && (
            <div className="flex items-center gap-3 border-l-4 border-red-500 bg-white rounded-lg p-4 shadow-sm">
              <div className="flex-1">
                <h4 className="font-semibold flex items-center text-gray-800">
                  <Calendar className="h-4 w-4 mr-2 text-red-500" />
                  25° BPM
                </h4>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {bpmDays.map((day, index) => (
                    <Badge key={`bpm-${index}`} variant="outline" className="bg-white border-gray-200 py-1.5 px-3 rounded-md">
                      {formatDayHour(day)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="font-medium text-red-600 text-lg">{bpmTotalHours}h</div>
            </div>
          )}
          
          {saiopDays.length > 0 && (
            <div className="flex items-center gap-3 border-l-4 border-blue-500 bg-white rounded-lg p-4 shadow-sm">
              <div className="flex-1">
                <h4 className="font-semibold flex items-center text-gray-800">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  SAIOP
                </h4>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {saiopDays.map((day, index) => (
                    <Badge key={`saiop-${index}`} variant="outline" className="bg-white border-gray-200 py-1.5 px-3 rounded-md">
                      {formatDayHour(day)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="font-medium text-blue-600 text-lg">{saiopTotalHours}h</div>
            </div>
          )}
          
          {sinfraDays.length > 0 && (
            <div className="flex items-center gap-3 border-l-4 border-green-500 bg-white rounded-lg p-4 shadow-sm">
              <div className="flex-1">
                <h4 className="font-semibold flex items-center text-gray-800">
                  <Calendar className="h-4 w-4 mr-2 text-green-500" />
                  SINFRA
                </h4>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {sinfraDays.map((day, index) => (
                    <Badge key={`sinfra-${index}`} variant="outline" className="bg-white border-gray-200 py-1.5 px-3 rounded-md">
                      {formatDayHour(day)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="font-medium text-green-600 text-lg">{sinfraTotalHours}h</div>
            </div>
          )}
        </div>
      </div>

      <Button variant="outline" className="w-full mt-4 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={onClose}>
        Fechar
      </Button>
    </div>
  );
};
