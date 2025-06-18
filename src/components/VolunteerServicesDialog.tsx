
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ServiceDetail {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  description?: string;
}

interface VolunteerServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteerName: string;
}

const VolunteerServicesDialog = ({ open, onOpenChange, volunteerName }: VolunteerServicesDialogProps) => {
  const [services, setServices] = useState<ServiceDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVolunteerServices = async () => {
    if (!volunteerName || !open) return;
    
    setIsLoading(true);
    try {
      const timeSlotsCollection = collection(db, 'timeSlots');
      const q = query(timeSlotsCollection, orderBy('date', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const volunteerServices: ServiceDetail[] = [];
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const volunteers = data.volunteers || [];
        
        if (volunteers.includes(volunteerName)) {
          let dateStr: string;
          if (data.date && typeof data.date.toDate === 'function') {
            dateStr = format(data.date.toDate(), 'yyyy-MM-dd');
          } else {
            dateStr = data.date as string;
          }
          
          volunteerServices.push({
            id: doc.id,
            date: dateStr,
            start_time: data.start_time,
            end_time: data.end_time,
            description: data.description || ""
          });
        }
      });
      
      setServices(volunteerServices);
    } catch (error) {
      console.error('Erro ao buscar serviços do voluntário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteerServices();
  }, [volunteerName, open]);

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "eee, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatTime = (time: string) => {
    return time?.slice(0, 5) || time;
  };

  const calculateHours = (startTime: string, endTime: string): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    
    if (endHour < startHour || (endHour === 0 && startHour > 0)) {
      endHour += 24;
    }
    
    let diffHours = endHour - startHour;
    let diffMinutes = endMinute - startMinute;
    
    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }
    
    const totalHours = diffHours + diffMinutes / 60;
    return totalHours % 1 === 0 ? totalHours.toString() : totalHours.toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Serviços de {volunteerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Carregando serviços...</span>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum serviço encontrado</p>
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {formatDate(service.date)}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-green-500" />
                  {formatTime(service.start_time)} às {formatTime(service.end_time)}
                  <span className="text-blue-600 font-medium">
                    ({calculateHours(service.start_time, service.end_time)}h)
                  </span>
                </div>
                
                {service.description && (
                  <div className="text-sm text-gray-600 bg-gray-100 rounded px-2 py-1">
                    {service.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {services.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="text-sm text-gray-600 text-center">
              <strong>{services.length}</strong> serviço{services.length !== 1 ? 's' : ''} registrado{services.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VolunteerServicesDialog;
