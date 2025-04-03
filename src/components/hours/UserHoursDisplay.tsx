
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { HoursDonutChart } from "@/components/hours/HoursDonutChart";
import { HoursData } from "@/types/hours";
import { Calendar } from "lucide-react";

interface UserHoursDisplayProps {
  data: HoursData;
  onClose: () => void;
}

export const UserHoursDisplay = ({
  data,
  onClose
}: UserHoursDisplayProps) => {
  // Convert Total Geral to a number for the chart
  const totalHours = data["Total Geral"] 
    ? parseFloat(data["Total Geral"].replace(/[^0-9,.]/g, '').replace(',', '.')) 
    : 0;
    
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

  return (
    <div className="mt-6 space-y-4 my-0">
      <h2 className="text-center font-bold text-xl">{data.Nome}</h2>
      
      {/* Hours Donut Chart */}
      <HoursDonutChart totalHours={totalHours} />
      
      {/* Worked Days Section */}
      <div className="space-y-4">
        {bpmDays.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 shadow-sm border border-slate-100">
            <h3 className="font-semibold mb-2 text-gray-700 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              25° BPM
            </h3>
            <div className="flex flex-wrap gap-2">
              {bpmDays.map((day, index) => (
                <Badge 
                  key={`bpm-${index}`}
                  variant="outline"
                  className="bg-white text-gray-800 border-gray-200 py-1.5 px-3 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                  {formatDayHour(day)}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {saiopDays.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 shadow-sm border border-blue-100">
            <h3 className="font-semibold mb-2 text-blue-700 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
              SAIOP
            </h3>
            <div className="flex flex-wrap gap-2">
              {saiopDays.map((day, index) => (
                <Badge 
                  key={`saiop-${index}`}
                  variant="outline"
                  className="bg-white text-blue-800 border-blue-200 py-1.5 px-3 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
                >
                  {formatDayHour(day)}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {sinfraDays.length > 0 && (
          <div className="bg-green-50 rounded-lg p-3 shadow-sm border border-green-100">
            <h3 className="font-semibold mb-2 text-green-700 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-green-600" />
              SINFRA
            </h3>
            <div className="flex flex-wrap gap-2">
              {sinfraDays.map((day, index) => (
                <Badge 
                  key={`sinfra-${index}`}
                  variant="outline"
                  className="bg-white text-green-800 border-green-200 py-1.5 px-3 rounded-lg shadow-sm hover:bg-green-50 transition-colors"
                >
                  {formatDayHour(day)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Hours Summary */}
      <div className="bg-amber-50 rounded-lg p-3 shadow-sm border border-amber-100">
        <h3 className="font-semibold mb-2 text-amber-700">Horas Totais:</h3>
        {data["Total 25° BPM"] && 
          <p className="font-normal text-gray-700">25° BPM: <span className="font-medium">{data["Total 25° BPM"]}</span></p>
        }
        {data["Total Geral"] && 
          <p className="font-bold text-green-700 text-lg mt-1">
            Total: {data["Total Geral"]}
          </p>
        }
      </div>

      <Button variant="destructive" className="w-full mt-4" onClick={onClose}>
        Fechar
      </Button>
    </div>
  );
};
