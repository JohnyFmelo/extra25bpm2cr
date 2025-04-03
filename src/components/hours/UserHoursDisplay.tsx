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
  return <div className="mt-6 space-y-4 my-0">
      <h2 className="text-center font-bold text-xl">{data.Nome}</h2>
      
      {/* Hours Donut Chart */}
      <HoursDonutChart totalHours={totalHours} />
      
      {/* Worked Days Section */}
      <h3 className="font-medium text-gray-700">Dias Trabalhados:</h3>
      <div className="space-y-4">
        {bpmDays.length > 0 && <div className="bg-slate-50 rounded-lg p-3 shadow-sm border border-slate-100">
            <h3 className="font-semibold mb-2 text-gray-700 flex items-center justify-between mx-0 px-0">
              <span className="flex items-center mx-0">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                25° BPM
              </span>
              <span className="text-primary font-medium text-left my-0 px-0 mx-0">{bpmTotalHours}h</span>
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

      

      {/* Hours Summary */}
      

      <Button variant="destructive" className="w-full mt-4" onClick={onClose}>
        Fechar
      </Button>
    </div>;
};