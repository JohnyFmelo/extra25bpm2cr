
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HoursDonutChart } from "@/components/hours/HoursDonutChart";
import { HoursData } from "@/types/hours";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock } from "lucide-react";

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
  
  // Extract the working days information from the data
  const extractWorkingDays = () => {
    // This function will parse the "Horas 25° BPM" field to extract days and hours
    const workingDaysMap = new Map<string, string>();
    
    const processHoursField = (field: string | undefined) => {
      if (!field) return;
      
      const dayMatches = field.match(/(\d{2}):\s(\d+h)/g);
      if (dayMatches) {
        dayMatches.forEach(match => {
          const [day, hours] = match.split(': ');
          workingDaysMap.set(day, hours);
        });
      }
    };
    
    // Process all possible fields containing day information
    processHoursField(data["Horas 25° BPM"]);
    processHoursField(data.Saiop);
    processHoursField(data.Sinfra);
    
    return workingDaysMap;
  };
  
  const workingDays = extractWorkingDays();
  
  // Format each location's hours
  const formatLocationHours = (locationName: string, hoursValue: string | undefined) => {
    if (!hoursValue) return null;
    
    return (
      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md mb-2">
        <span className="text-gray-700 font-medium">{locationName}</span>
        <span className="text-primary font-semibold">{hoursValue}</span>
      </div>
    );
  };

  return (
    <div className="mt-4 space-y-4 my-0">
      <h2 className="text-center font-bold text-xl">{data.Nome}</h2>
      
      {/* Add the HoursDonutChart here */}
      <HoursDonutChart totalHours={totalHours} />
      
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="text-primary h-5 w-5" />
          <h3 className="font-bold text-gray-800">Dias trabalhados</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {workingDays.size > 0 ? (
            Array.from(workingDays.entries()).map(([day, hours]) => (
              <div 
                key={day} 
                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md bg-gray-100 border border-gray-200 text-gray-800 min-w-[60px] text-center"
              >
                <span className="font-semibold">{day}/{hours}</span>
              </div>
            ))
          ) : (
            // Fallback for when we can't parse the days properly
            <>
              {data["Horas 25° BPM"] && <div className="text-sm text-gray-600 mb-2">{data["Horas 25° BPM"]}</div>}
              {data.Saiop && <div className="text-sm text-gray-600 mb-2">SAIOP: {data.Saiop}</div>}
              {data.Sinfra && <div className="text-sm text-gray-600 mb-2">SINFRA: {data.Sinfra}</div>}
            </>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="text-primary h-5 w-5" />
          <h3 className="font-bold text-gray-800">Horas registradas</h3>
        </div>
        
        <div className="space-y-2">
          {formatLocationHours("25° BPM", data["Total 25° BPM"])}
          {formatLocationHours("SAIOP", data.Saiop?.split(':')[1]?.trim())}
          {formatLocationHours("SINFRA", data.Sinfra?.split(':')[1]?.trim())}
          
          {data["Total Geral"] && (
            <div className="flex justify-between items-center py-2.5 px-3 bg-primary/10 rounded-md mt-3">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-green-600 text-lg">{data["Total Geral"]}</span>
            </div>
          )}
        </div>
      </div>

      <Button variant="destructive" className="w-full mt-6" onClick={onClose}>
        Fechar
      </Button>
    </div>
  );
};
