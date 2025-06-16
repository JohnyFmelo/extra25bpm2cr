
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Calendar, MapPin, Info, UserMinus } from "lucide-react";
import { collection, query, onSnapshot, doc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots?: number;
  slots_used?: number;
  description?: string;
  allowedMilitaryTypes?: string[];
  volunteers?: string[];
}

interface VolunteerHours {
  [volunteerName: string]: number;
}

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHours>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [volunteerToRemove, setVolunteerToRemove] = useState<{volunteer: string, slotId: string} | null>(null);
  const { toast } = useToast();
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.userType === "admin";

  const calculateTimeDifference = (startTime: string, endTime: string): number => {
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
    
    return diffHours + diffMinutes / 60;
  };

  const calculateVolunteerHours = (slots: TimeSlot[]) => {
    const hours: VolunteerHours = {};

    slots.forEach(slot => {
      if (slot.volunteers && slot.volunteers.length > 0) {
        const slotHours = calculateTimeDifference(slot.start_time, slot.end_time);
        
        slot.volunteers.forEach(volunteer => {
          hours[volunteer] = (hours[volunteer] || 0) + slotHours;
        });
      }
    });

    return hours;
  };

  useEffect(() => {
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let slotDateStr: string;
        
        if (data.date && typeof data.date.toDate === 'function') {
          slotDateStr = format(data.date.toDate(), 'yyyy-MM-dd');
        } else {
          slotDateStr = data.date as string;
        }
        
        return {
          id: docSnap.id,
          date: slotDateStr,
          start_time: data.start_time,
          end_time: data.end_time,
          total_slots: data.total_slots || 0,
          slots_used: data.slots_used || 0,
          description: data.description || "",
          allowedMilitaryTypes: data.allowedMilitaryTypes || [],
          volunteers: data.volunteers || []
        };
      });

      // Ordenar por data e depois por horário
      const sortedSlots = formattedSlots.sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return a.start_time.localeCompare(b.start_time);
      });

      setTimeSlots(sortedSlots);
      setVolunteerHours(calculateVolunteerHours(sortedSlots));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRemoveVolunteer = async (volunteer: string, slotId: string) => {
    setVolunteerToRemove({volunteer, slotId});
    setShowRemoveDialog(true);
  };

  const confirmRemoveVolunteer = async () => {
    if (!volunteerToRemove) return;

    try {
      const slotRef = doc(db, 'timeSlots', volunteerToRemove.slotId);
      await updateDoc(slotRef, {
        volunteers: arrayRemove(volunteerToRemove.volunteer)
      });

      toast({
        title: "Sucesso",
        description: `${volunteerToRemove.volunteer} foi removido do horário.`
      });
    } catch (error) {
      console.error('Erro ao remover voluntário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o voluntário.",
        variant: "destructive"
      });
    } finally {
      setShowRemoveDialog(false);
      setVolunteerToRemove(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2 w-48"></div>
              <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Horários Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum horário disponível no momento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar por data
  const groupedSlots = timeSlots.reduce((groups, slot) => {
    const date = slot.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedSlots).map(([date, slots]) => (
        <Card key={date} className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
              {format(parseISO(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {slots.map((slot, index) => (
              <div key={slot.id || `${date}-${index}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-800">
                          {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                        </span>
                      </div>
                      
                      <Badge variant={slot.slots_used >= slot.total_slots ? "destructive" : "default"}>
                        {slot.slots_used}/{slot.total_slots} vagas
                      </Badge>
                    </div>

                    {slot.description && (
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600">{slot.description}</span>
                      </div>
                    )}

                    {slot.allowedMilitaryTypes && slot.allowedMilitaryTypes.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-green-500" />
                        <div className="flex flex-wrap gap-1">
                          {slot.allowedMilitaryTypes.map((type, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {slot.volunteers && slot.volunteers.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700">Voluntários:</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          {slot.volunteers.map((volunteer, idx) => {
                            const totalHours = volunteerHours[volunteer] || 0;
                            return (
                              <div key={idx} className="flex items-center justify-between group">
                                <span className="text-sm text-gray-600">
                                  <span className="font-semibold text-blue-600">{Math.round(totalHours * 10) / 10}h</span> - {volunteer}
                                </span>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveVolunteer(volunteer, slot.id!)}
                                  >
                                    <UserMinus className="h-3 w-3 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(!slot.volunteers || slot.volunteers.length === 0) && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Nenhum voluntário inscrito</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Voluntário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{volunteerToRemove?.volunteer}</strong> deste horário?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveVolunteer} className="bg-red-500 hover:bg-red-600">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeSlotsList;
