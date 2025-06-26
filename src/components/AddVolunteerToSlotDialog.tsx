import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, UserPlus, Search } from "lucide-react";

interface User {
  id: string;
  email: string;
  warName: string;
  rank?: string;
  isVolunteer?: boolean;
  maxSlots?: number;
}

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  volunteers?: string[];
}

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeSlot: TimeSlot | null;
  onVolunteerAdded: () => void;
}

const AddVolunteerToSlotDialog = ({ open, onOpenChange, timeSlot, onVolunteerAdded }: AddVolunteerToSlotDialogProps) => {
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newVolunteerName, setNewVolunteerName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open && timeSlot) {
      fetchVolunteers();
    }
  }, [open, timeSlot]);

  const fetchVolunteers = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "users"), where("isVolunteer", "==", true));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(userDoc => ({
        id: userDoc.id,
        ...userDoc.data(),
        isVolunteer: userDoc.data().isVolunteer ?? false,
        maxSlots: userDoc.data().maxSlots ?? 1
      }) as User).sort((a, b) => (a.warName || "").localeCompare(b.warName || ""));
      setVolunteers(usersData);
    } catch (error) {
      console.error("Error fetching volunteers:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar voluntários",
        description: "Não foi possível carregar a lista de voluntários."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTimeDifference = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    if (endHour < startHour || endHour === 0 && startHour > 0) {
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

  const calculateUserServiceCount = (userFullName: string): number => {
    const timeSlots = JSON.parse(localStorage.getItem("timeSlots") || "[]");
    return timeSlots.reduce((count: number, slot: TimeSlot) => {
      if (slot.volunteers && slot.volunteers.includes(userFullName)) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  const filteredVolunteers = useMemo(() => {
    const searchTerm = searchQuery.toLowerCase();
    return volunteers.filter(user => {
      const rank = (user.rank || '').toLowerCase();
      const warName = (user.warName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return rank.includes(searchTerm) || warName.includes(searchTerm) || email.includes(searchTerm);
    });
  }, [volunteers, searchQuery]);

  const handleAddVolunteer = async (user: User) => {
    if (!timeSlot?.id) return;
    
    setIsAdding(true);
    try {
      const userFullName = `${user.rank || ''} ${user.warName}`.trim();
      const slotRef = doc(db, "timeSlots", timeSlot.id);
      
      await updateDoc(slotRef, {
        volunteers: arrayUnion(userFullName)
      });

      toast({
        title: "Voluntário adicionado",
        description: `${userFullName} foi adicionado ao horário com sucesso.`
      });

      onVolunteerAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding volunteer:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o voluntário."
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!newVolunteerName.trim() || !timeSlot?.id) return;
    
    setIsAdding(true);
    try {
      const slotRef = doc(db, "timeSlots", timeSlot.id);
      
      await updateDoc(slotRef, {
        volunteers: arrayUnion(newVolunteerName.trim())
      });

      toast({
        title: "Voluntário adicionado",
        description: `${newVolunteerName} foi adicionado ao horário.`
      });

      setNewVolunteerName("");
      onVolunteerAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding volunteer:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o voluntário."
      });
    } finally {
      setIsAdding(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  if (!timeSlot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Voluntário
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {formatDate(timeSlot.date)} • {formatTime(timeSlot.start_time)} - {formatTime(timeSlot.end_time)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adição rápida */}
          <div className="border rounded-lg p-4 space-y-3">
            <Label className="text-sm font-semibold">Adição Rápida</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o nome completo (ex: 3º SGT João Silva)"
                value={newVolunteerName}
                onChange={(e) => setNewVolunteerName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isAdding) {
                    handleQuickAdd();
                  }
                }}
              />
              <Button 
                onClick={handleQuickAdd}
                disabled={!newVolunteerName.trim() || isAdding}
                className="whitespace-nowrap"
              >
                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar
              </Button>
            </div>
          </div>

          {/* Busca de voluntários cadastrados */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Voluntários Cadastrados</Label>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar voluntários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando voluntários...</span>
                </div>
              ) : filteredVolunteers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum voluntário encontrado</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredVolunteers.map((user) => {
                    const userFullName = `${user.rank || ''} ${user.warName}`.trim();
                    const isAlreadyAdded = timeSlot.volunteers?.includes(userFullName);
                    const serviceCount = calculateUserServiceCount(userFullName);
                    const maxSlots = user.maxSlots || 1;
                    const canAdd = serviceCount < maxSlots;

                    return (
                      <div key={user.id} className="flex items-center justify-between p-3">
                        <div className="flex-1">
                          <div className="font-medium">{userFullName}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email} • {serviceCount}/{maxSlots} serviços
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddVolunteer(user)}
                          disabled={isAlreadyAdded || !canAdd || isAdding}
                          variant={isAlreadyAdded ? "secondary" : "default"}
                        >
                          {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isAlreadyAdded ? "Já adicionado" : !canAdd ? "Limite atingido" : "Adicionar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
