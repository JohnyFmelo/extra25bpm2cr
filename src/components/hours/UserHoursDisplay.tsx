
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { HoursDonutChart } from "@/components/hours/HoursDonutChart";
import { HoursData } from "@/types/hours";

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
      <div className="space-y-3">
        {bpmDays.length > 0 && (
          <div>
            <h3 className="font-bold mb-2">25° BPM:</h3>
            <div className="flex flex-wrap gap-2">
              {bpmDays.map((day, index) => (
                <Badge 
                  key={`bpm-${index}`}
                  variant="outline"
                  className="bg-gray-100 text-gray-800 border-gray-300 py-1 px-2 rounded-md"
                >
                  {formatDayHour(day)}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {saiopDays.length > 0 && (
          <div>
            <h3 className="font-bold mb-2">SAIOP:</h3>
            <div className="flex flex-wrap gap-2">
              {saiopDays.map((day, index) => (
                <Badge 
                  key={`saiop-${index}`}
                  variant="outline"
                  className="bg-blue-50 text-blue-800 border-blue-300 py-1 px-2 rounded-md"
                >
                  {formatDayHour(day)}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {sinfraDays.length > 0 && (
          <div>
            <h3 className="font-bold mb-2">SINFRA:</h3>
            <div className="flex flex-wrap gap-2">
              {sinfraDays.map((day, index) => (
                <Badge 
                  key={`sinfra-${index}`}
                  variant="outline"
                  className="bg-green-50 text-green-800 border-green-300 py-1 px-2 rounded-md"
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
      <div>
        <h3 className="font-bold mb-2">Horas:</h3>
        {data["Total 25° BPM"] && <p className="font-normal">25° BPM: {data["Total 25° BPM"]}</p>}
        {data["Total Geral"] && <p className="font-bold text-green-600">
            Total: {data["Total Geral"]}
          </p>}
      </div>

      <Button variant="destructive" className="w-full mt-4" onClick={onClose}>
        Fechar
      </Button>
    </div>
  );
};
