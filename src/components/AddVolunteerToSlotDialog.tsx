
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collection, getDocs, doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Search, X } from "lucide-react";
import { TimeSlot, FirebaseTimeSlot } from "@/types/timeSlot";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";

interface User {
  id: string;
  email: string;
  warName: string;
  rank?: string;
  isVolunteer?: boolean;
  maxSlots?: number;
}

interface AddVolunteerToSlotDialogProps {
  timeSlot: TimeSlot;
  onVolunteerAdded: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AddVolunteerToSlotDialog: React.FC<AddVolunteerToSlotDialogProps> = ({
  timeSlot,
  onVolunteerAdded,
  open,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Get current user data to check if they're admin
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const isAdmin = userData?.userType === 'admin';

  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
      fetchAllTimeSlots();
    }
  }, [isOpen]);

  const fetchAllUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        maxSlots: doc.data().maxSlots || 1
      }) as User);
      
      setAllUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários."
      });
    }
  };

  const fetchAllTimeSlots = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "timeSlots"));
      const slots = querySnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseTimeSlot;
        
        let dateValue: Date;
        // Handle both Firebase Timestamp and string dates with proper null check
        if (data.date != null) {
          if (typeof data.date === 'object' && 'toDate' in data.date) {
            dateValue = (data.date as any).toDate();
          } else if (typeof data.date === 'string') {
            dateValue = parseISO(data.date);
          } else {
            // Fallback to current date if data.date format is unexpected
            dateValue = new Date();
          }
        } else {
          // Fallback to current date if data.date is null
          dateValue = new Date();
        }

        return {
          id: doc.id,
          date: dateValue,
          startTime: data.start_time ? data.start_time.slice(0, 5) : "00:00",
          endTime: data.end_time ? data.end_time.slice(0, 5) : "00:00",
          slots: data.total_slots || 0,
          slotsUsed: data.slots_used || 0,
          description: data.description || "",
          volunteers: data.volunteers || []
        } as TimeSlot;
      });
      setAllTimeSlots(slots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
    }
  };

  // Função para calcular diferença de tempo corretamente
  const calculateTimeDifference = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Handle overnight shifts
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

  const getVolunteerSlotCount = (volunteerName: string): number => {
    return allTimeSlots.reduce((count, slot) => {
      if (slot.volunteers && slot.volunteers.includes(volunteerName)) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  const getVolunteerTotalHours = (volunteerName: string): number => {
    return allTimeSlots.reduce((totalHours, slot) => {
      if (slot.volunteers && slot.volunteers.includes(volunteerName)) {
        const hours = calculateTimeDifference(slot.startTime, slot.endTime);
        return totalHours + hours;
      }
      return totalHours;
    }, 0);
  };

  const getVolunteerMaxSlots = (volunteerName: string): number => {
    const volunteer = allUsers.find(v => {
      const fullName = `${v.rank || ''} ${v.warName}`.trim();
      return fullName === volunteerName;
    });
    return volunteer?.maxSlots || 1;
  };

  const isVolunteerAtLimit = (volunteerName: string): boolean => {
    if (isAdmin) return false; // Admins can bypass limits
    const currentSlots = getVolunteerSlotCount(volunteerName);
    const maxSlots = getVolunteerMaxSlots(volunteerName);
    return currentSlots >= maxSlots;
  };

  const isVolunteerAlreadyInSlot = (volunteerName: string): boolean => {
    return timeSlot.volunteers?.includes(volunteerName) || false;
  };

  const handleVolunteerToggle = (volunteerName: string) => {
    const isCurrentlyInSlot = isVolunteerAlreadyInSlot(volunteerName);
    
    if (isCurrentlyInSlot) {
      // Remove from current slot
      handleRemoveVolunteerFromSlot(volunteerName);
    } else {
      // Add to selection
      setSelectedVolunteers(prev => {
        if (prev.includes(volunteerName)) {
          return prev.filter(name => name !== volunteerName);
        } else {
          return [...prev, volunteerName];
        }
      });
    }
  };

  const handleRemoveVolunteerFromSlot = async (volunteerName: string) => {
    setIsLoading(true);
    try {
      const timeSlotRef = doc(db, "timeSlots", timeSlot.id!);
      
      // Remove volunteer from slot
      await updateDoc(timeSlotRef, {
        volunteers: arrayRemove(volunteerName),
        slots_used: Math.max(0, (timeSlot.slotsUsed || 0) - 1)
      });

      toast({
        title: "Sucesso",
        description: `${volunteerName} foi removido do horário!`
      });

      onVolunteerAdded();
    } catch (error) {
      console.error("Error removing volunteer:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o voluntário."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVolunteers = async () => {
    if (selectedVolunteers.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione pelo menos um voluntário."
      });
      return;
    }

    // Check for volunteers at limit (only if not admin)
    if (!isAdmin) {
      const atLimit = selectedVolunteers.filter(name => isVolunteerAtLimit(name));
      if (atLimit.length > 0) {
        toast({
          variant: "destructive",
          title: "Limite atingido",
          description: `Os seguintes voluntários atingiram o limite: ${atLimit.join(', ')}`
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const timeSlotRef = doc(db, "timeSlots", timeSlot.id!);
      
      // Add all selected volunteers at once
      for (const volunteerName of selectedVolunteers) {
        await updateDoc(timeSlotRef, {
          volunteers: arrayUnion(volunteerName),
        });
      }
      
      // Update slots used count
      await updateDoc(timeSlotRef, {
        slots_used: (timeSlot.slotsUsed || 0) + selectedVolunteers.length
      });

      toast({
        title: "Sucesso",
        description: `${selectedVolunteers.length} voluntário(s) adicionado(s) com sucesso!`
      });

      setSelectedVolunteers([]);
      setSearchTerm("");
      setOpen(false);
      onVolunteerAdded();
    } catch (error) {
      console.error("Error adding volunteers:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar os voluntários."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = allUsers.filter(user => {
    const fullName = `${user.rank || ''} ${user.warName}`.trim();
    const matchesSearch = searchTerm === "" || 
                         fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.warName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.rank && user.rank.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar Voluntário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Voluntários no Horário</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Horário: {timeSlot.startTime} - {timeSlot.endTime}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Data: {format(timeSlot.date, 'dd/MM/yyyy')}
            </p>
          </div>

          {/* Selected Volunteers Display */}
          {selectedVolunteers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Para adicionar ({selectedVolunteers.length})</label>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {selectedVolunteers.map((name) => (
                  <div key={name} className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    <span>{name}</span>
                    <button
                      onClick={() => setSelectedVolunteers(prev => prev.filter(n => n !== name))}
                      className="hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volunteers List */}
          <div className="space-y-2 flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Selecionar voluntários</label>
              <div className="relative flex-1 ml-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por graduação ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
            </div>
            
            <div className="border rounded-md max-h-60 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredUsers.map((user) => {
                    const fullName = `${user.rank || ''} ${user.warName}`.trim();
                    const currentSlots = getVolunteerSlotCount(fullName);
                    const totalHours = getVolunteerTotalHours(fullName);
                    const maxSlots = user.maxSlots || 1;
                    const atLimit = isVolunteerAtLimit(fullName);
                    const isVolunteer = user.isVolunteer;
                    const isSelected = selectedVolunteers.includes(fullName);
                    const isCurrentlyInSlot = isVolunteerAlreadyInSlot(fullName);
                    
                    return (
                      <div 
                        key={user.id} 
                        className={`flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer ${
                          (!isAdmin && atLimit && !isCurrentlyInSlot) ? "opacity-50" : ""
                        } ${isCurrentlyInSlot ? "bg-blue-50 border border-blue-200" : ""}`}
                        onClick={() => !(!isAdmin && atLimit && !isCurrentlyInSlot) && handleVolunteerToggle(fullName)}
                      >
                        <Checkbox
                          checked={isSelected || isCurrentlyInSlot}
                          disabled={!isAdmin && atLimit && !isCurrentlyInSlot}
                          onChange={() => handleVolunteerToggle(fullName)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`font-medium truncate ${isCurrentlyInSlot ? "text-blue-700" : ""}`}>
                              {fullName}
                              {isCurrentlyInSlot && " (no horário)"}
                            </span>
                            {isVolunteer && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                                Voluntário
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center justify-between">
                            <span>
                              {currentSlots}/{maxSlots} serviços
                              {!isAdmin && atLimit && !isCurrentlyInSlot && " (Limite atingido)"}
                              {isAdmin && atLimit && " (Admin: pode exceder limite)"}
                            </span>
                            <span className={`font-medium ${totalHours >= 50 ? "text-red-600" : "text-blue-600"}`}>
                              {totalHours.toFixed(1)}h trabalhadas
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              Como administrador, você pode adicionar qualquer usuário mesmo que tenham atingido o limite de serviços.
              <br />
              Os militares já alocados neste horário aparecem destacados e podem ser removidos clicando neles.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddVolunteers} 
              disabled={isLoading || selectedVolunteers.length === 0}
            >
              {isLoading ? "Processando..." : `Adicionar ${selectedVolunteers.length} Voluntário(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
