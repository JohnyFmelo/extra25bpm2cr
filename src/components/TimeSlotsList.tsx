import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, limitOperations } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[];
}

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [userLimit, setUserLimit] = useState<number | null>(null);
  const { toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const checkUserLimit = async () => {
      const limit = await limitOperations.getLimit(currentUser.id);
      setUserLimit(limit);
      if (limit !== null) {
        setShowLimitAlert(true);
      }
    };

    checkUserLimit();
  }, [currentUser.id]);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const q = query(collection(db, "timeSlots"));
        const querySnapshot = await getDocs(q);
        const slots = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TimeSlot[];
        setTimeSlots(slots);
      } catch (error) {
        console.error("Error fetching time slots:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os horários."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeSlots();
  }, [toast]);

  const getUserSlotCount = () => {
    return timeSlots.reduce((count, slot) => {
      if (slot.volunteers?.includes(currentUser.warName)) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  const handleVolunteerToggle = async (slotId: string, currentVolunteers: string[] = []) => {
    const isVolunteered = currentVolunteers.includes(currentUser.warName);
    const slotCount = getUserSlotCount();

    if (!isVolunteered && userLimit !== null && slotCount >= userLimit) {
      toast({
        variant: "destructive",
        title: "Limite atingido",
        description: "Você atingiu seu limite de vagas."
      });
      return;
    }

    try {
      const slotRef = doc(db, "timeSlots", slotId);
      await updateDoc(slotRef, {
        volunteers: isVolunteered 
          ? arrayRemove(currentUser.warName)
          : arrayUnion(currentUser.warName),
        slots_used: isVolunteered 
          ? (currentVolunteers.length - 1)
          : (currentVolunteers.length + 1)
      });

      // Update local state
      setTimeSlots(prev => prev.map(slot => {
        if (slot.id === slotId) {
          const newVolunteers = isVolunteered
            ? currentVolunteers.filter(v => v !== currentUser.warName)
            : [...currentVolunteers, currentUser.warName];
          return {
            ...slot,
            volunteers: newVolunteers,
            slots_used: isVolunteered ? slot.slots_used - 1 : slot.slots_used + 1
          };
        }
        return slot;
      }));

      toast({
        title: "Sucesso",
        description: isVolunteered 
          ? "Vaga liberada com sucesso!"
          : "Vaga reservada com sucesso!"
      });
    } catch (error) {
      console.error("Error updating volunteer status:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar sua inscrição."
      });
    }
  };

  const shouldShowSlot = (slot: TimeSlot) => {
    if (userLimit === null) return true;
    if (slot.volunteers?.includes(currentUser.warName)) return true;
    return getUserSlotCount() < userLimit;
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando horários...</div>;
  }

  const filteredTimeSlots = timeSlots.filter(shouldShowSlot);

  return (
    <>
      <AlertDialog open={showLimitAlert} onOpenChange={setShowLimitAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limite de Vagas</AlertDialogTitle>
            <AlertDialogDescription>
              Você pode escolher até {userLimit} vaga{userLimit === 1 ? '' : 's'}.
              Atualmente você está inscrito em {getUserSlotCount()} vaga{getUserSlotCount() === 1 ? '' : 's'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        {filteredTimeSlots.length === 0 ? (
          <div className="text-center py-4">
            {userLimit !== null && getUserSlotCount() >= userLimit
              ? "Você atingiu seu limite de vagas."
              : "Nenhum horário disponível."}
          </div>
        ) : (
          filteredTimeSlots.map((slot) => (
            <div
              key={slot.id}
              className="bg-white rounded-lg shadow p-4 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {format(new Date(slot.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {slot.start_time.slice(0, 5)} às {slot.end_time.slice(0, 5)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {slot.slots_used}/{slot.total_slots} vagas preenchidas
                  </p>
                </div>
                <Button
                  variant={slot.volunteers?.includes(currentUser.warName) ? "destructive" : "default"}
                  onClick={() => handleVolunteerToggle(slot.id, slot.volunteers)}
                  disabled={!slot.volunteers?.includes(currentUser.warName) && slot.slots_used >= slot.total_slots}
                >
                  {slot.volunteers?.includes(currentUser.warName) ? "Desistir" : "Participar"}
                </Button>
              </div>
              {slot.volunteers && slot.volunteers.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Voluntários:</p>
                  <div className="space-y-1">
                    {slot.volunteers.map((volunteer, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        {volunteer}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default TimeSlotsList;