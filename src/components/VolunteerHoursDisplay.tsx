
import { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VolunteerHours {
  volunteerName: string;
  totalHours: number;
  totalMinutes: number;
  shiftsCount: number;
}

const VolunteerHoursDisplay = () => {
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const calculateTimeDifference = (startTime: string, endTime: string): { hours: number; minutes: number } => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Detecta quando é meia-noite e ajusta para 24
    if (endHour === 0) endHour = 24;
    
    let diffHours = endHour - startHour;
    let diffMinutes = endMinute - startMinute;
    
    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }
    
    return { hours: diffHours, minutes: diffMinutes };
  };

  const formatHoursDisplay = (totalHours: number, totalMinutes: number): string => {
    const finalHours = totalHours + Math.floor(totalMinutes / 60);
    const finalMinutes = totalMinutes % 60;
    
    if (finalMinutes > 0) {
      return `${finalHours}h${finalMinutes}min`;
    }
    return `${finalHours}h`;
  };

  useEffect(() => {
    fetchVolunteerHours();
  }, []);

  const fetchVolunteerHours = async () => {
    setIsLoading(true);
    try {
      const timeSlotsCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotsCollection);
      
      const volunteerHoursMap = new Map<string, VolunteerHours>();
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const volunteers = data.volunteers || [];
        const startTime = data.start_time || '';
        const endTime = data.end_time || '';
        
        if (volunteers.length > 0 && startTime && endTime) {
          const timeDiff = calculateTimeDifference(startTime, endTime);
          
          volunteers.forEach((volunteerName: string) => {
            if (volunteerHoursMap.has(volunteerName)) {
              const existing = volunteerHoursMap.get(volunteerName)!;
              existing.totalHours += timeDiff.hours;
              existing.totalMinutes += timeDiff.minutes;
              existing.shiftsCount += 1;
            } else {
              volunteerHoursMap.set(volunteerName, {
                volunteerName,
                totalHours: timeDiff.hours,
                totalMinutes: timeDiff.minutes,
                shiftsCount: 1
              });
            }
          });
        }
      });
      
      // Converter para array e ordenar por horas totais (decrescente)
      const sortedVolunteers = Array.from(volunteerHoursMap.values()).sort((a, b) => {
        const totalA = a.totalHours + (a.totalMinutes / 60);
        const totalB = b.totalHours + (b.totalMinutes / 60);
        return totalB - totalA;
      });
      
      setVolunteerHours(sortedVolunteers);
    } catch (error) {
      console.error("Error fetching volunteer hours:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar horas",
        description: "Não foi possível carregar as horas dos voluntários."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando horas dos voluntários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 px-0">
      <Card className="shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Clock className="h-7 w-7 text-primary" />
            Horas dos Voluntários
          </CardTitle>
          <p className="mt-2 text-zinc-700">
            Resumo das horas trabalhadas por cada voluntário
          </p>
        </CardHeader>

        <CardContent className="space-y-4 px-[6px]">
          {volunteerHours.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum voluntário encontrado</p>
              <p className="text-sm">Ainda não há registros de voluntários com horas trabalhadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {volunteerHours.map((volunteer, index) => (
                <div 
                  key={volunteer.volunteerName} 
                  className={`
                    flex items-center justify-between p-4 rounded-lg border transition-all duration-200
                    ${index < 3 ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200 dark:from-green-950/20 dark:to-blue-950/20 dark:border-green-800' : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                      ${index === 0 ? 'bg-yellow-500 text-white' : 
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-600'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {volunteer.volunteerName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {volunteer.shiftsCount} {volunteer.shiftsCount === 1 ? 'plantão' : 'plantões'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant={index < 3 ? "default" : "secondary"}
                      className={`text-lg px-3 py-1 ${
                        index < 3 ? 'bg-primary text-primary-foreground' : ''
                      }`}
                    >
                      {formatHoursDisplay(volunteer.totalHours, volunteer.totalMinutes)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VolunteerHoursDisplay;
