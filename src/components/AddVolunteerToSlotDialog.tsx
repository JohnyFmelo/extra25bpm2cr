import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
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
  const [initialVolunteersInSlot, setInitialVolunteersInSlot] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const isAdmin = userData?.userType === 'admin';

  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
      fetchAllTimeSlots();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && timeSlot) {
      const currentSlotVolunteers = timeSlot.volunteers || [];
      setSelectedVolunteers([...currentSlotVolunteers]);
      setInitialVolunteersInSlot([...currentSlotVolunteers]);
    } else if (!isOpen) {
      // Reset state when dialog closes
      setSelectedVolunteers([]);
      setInitialVolunteersInSlot([]);
      setSearchTerm("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, timeSlot?.id]); // Ensure timeSlot.id is stable or memoized if timeSlot object changes frequently

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
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar a lista de usuários." });
    }
  };

  const fetchAllTimeSlots = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "timeSlots"));
      const slots = querySnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseTimeSlot;
        let dateValue: Date;
        
        // Add proper null checking for data.date
        if (data.date != null && data.date !== undefined) {
          if (typeof data.date === 'object' && 'toDate' in data.date) {
            dateValue = (data.date as any).toDate();
          } else if (typeof data.date === 'string') {
            dateValue = parseISO(data.date);
          } else {
            dateValue = new Date();
          }
        } else {
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

  const calculateTimeDifference = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    if (endHour < startHour || (endHour === 0 && startHour > 0)) { // handles overnight shifts
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
    const volunteer = allUsers.find(v => `${v.rank || ''} ${v.warName}`.trim() === volunteerName);
    return volunteer?.maxSlots || 1;
  };

  const isVolunteerAtLimit = (volunteerName: string): boolean => {
    // Admin bypasses limit checks for adding, but info is still useful
    // if (isAdmin) return false; // This was here, but limit info is still useful for admin to see
    const currentSlots = getVolunteerSlotCount(volunteerName);
    const maxSlots = getVolunteerMaxSlots(volunteerName);
    return currentSlots >= maxSlots;
  };

  const handleVolunteerToggle = (volunteerFullName: string) => {
    const isCurrentlySelected = selectedVolunteers.includes(volunteerFullName);
    
    if (isCurrentlySelected) {
      setSelectedVolunteers(prev => prev.filter(name => name !== volunteerFullName));
    } else {
      const wasInitiallyInSlot = initialVolunteersInSlot.includes(volunteerFullName);
      if (!isAdmin && !wasInitiallyInSlot && isVolunteerAtLimit(volunteerFullName)) {
        toast({
          variant: "destructive",
          title: "Limite atingido",
          description: `${volunteerFullName} já atingiu o limite de serviços e não pode ser adicionado.`,
        });
        return;
      }
      setSelectedVolunteers(prev => [...prev, volunteerFullName]);
    }
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    const volunteersToAdd = selectedVolunteers.filter(name => !initialVolunteersInSlot.includes(name));
    const volunteersToRemove = initialVolunteersInSlot.filter(name => !selectedVolunteers.includes(name));

    if (volunteersToAdd.length === 0 && volunteersToRemove.length === 0) {
      toast({ title: "Nenhuma alteração", description: "Nenhuma alteração pendente para salvar." });
      setIsLoading(false);
      setOpen(false);
      return;
    }

    if (!isAdmin) {
      const newlyAddedAtLimit = volunteersToAdd.filter(name => isVolunteerAtLimit(name));
      if (newlyAddedAtLimit.length > 0) {
        toast({
          variant: "destructive",
          title: "Limite atingido",
          description: `Os seguintes voluntários atingiram o limite e não podem ser adicionados: ${newlyAddedAtLimit.join(', ')}`,
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      const timeSlotRef = doc(db, "timeSlots", timeSlot.id!);
      await updateDoc(timeSlotRef, {
        volunteers: selectedVolunteers,
        slots_used: selectedVolunteers.length,
      });

      let successMessage = "Alterações salvas com sucesso!";
      if (volunteersToAdd.length > 0 && volunteersToRemove.length === 0) {
        successMessage = `${volunteersToAdd.length} voluntário(s) adicionado(s).`;
      } else if (volunteersToRemove.length > 0 && volunteersToAdd.length === 0) {
        successMessage = `${volunteersToRemove.length} voluntário(s) removido(s).`;
      } else if (volunteersToAdd.length > 0 && volunteersToRemove.length > 0) {
         successMessage = `${volunteersToAdd.length} adicionado(s), ${volunteersToRemove.length} removido(s).`;
      }

      toast({ title: "Sucesso", description: successMessage });
      onVolunteerAdded();
      setOpen(false); // This will trigger useEffect to reset selections
    } catch (error) {
      console.error("Error saving changes to volunteers:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar as alterações." });
    } finally {
      setIsLoading(false);
    }
  };

  // Sort users by rank and then alphabetically by warName within each rank
  const sortUsersByRankAndName = (users: User[]) => {
    const rankOrder = [
      "Cel", "Cel PM", "Ten Cel", "Ten Cel PM", "Maj", "Maj PM", 
      "Cap", "Cap PM", "1° Ten", "1° Ten PM", "2° Ten", "2° Ten PM",
      "Sub Ten", "Sub Ten PM", "1° Sgt", "1° Sgt PM", "2° Sgt", "2° Sgt PM",
      "3° Sgt", "3° Sgt PM", "Cb", "Cb PM", "Sd", "Sd PM", "Estágio"
    ];

    return users.sort((a, b) => {
      const rankA = a.rank || '';
      const rankB = b.rank || '';
      
      const rankIndexA = rankOrder.indexOf(rankA);
      const rankIndexB = rankOrder.indexOf(rankB);
      
      // If ranks are different, sort by rank order
      if (rankIndexA !== rankIndexB) {
        return rankIndexA - rankIndexB;
      }
      
      // If ranks are the same, sort alphabetically by warName
      return a.warName.localeCompare(b.warName);
    });
  };

  const filteredAndSortedUsers = useMemo(() => {
    return sortUsersByRankAndName(
      allUsers.filter(user => {
        const fullName = `${user.rank || ''} ${user.warName}`.trim();
        const matchesSearch = searchTerm === "" || 
                              fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              user.warName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (user.rank && user.rank.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
      })
    );
  }, [allUsers, searchTerm]);

  const formatHours = (hours: number): string => {
    if (hours === 0) {
      return "0h";
    }
    if (hours % 1 === 0) {
      return `${hours}h`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const volunteersToAddCount = selectedVolunteers.filter(name => !initialVolunteersInSlot.includes(name)).length;
  const volunteersToRemoveCount = initialVolunteersInSlot.filter(name => !selectedVolunteers.includes(name)).length;
  
  let actionButtonText = "Nenhuma Alteração";
  let canSubmit = false;

  if (volunteersToAddCount > 0 && volunteersToRemoveCount === 0) {
    actionButtonText = `Adicionar ${volunteersToAddCount} Voluntário${volunteersToAddCount > 1 ? 's' : ''}`;
    canSubmit = true;
  } else if (volunteersToRemoveCount > 0 && volunteersToAddCount === 0) {
    actionButtonText = `Remover ${volunteersToRemoveCount} Voluntário${volunteersToRemoveCount > 1 ? 's' : ''}`;
    canSubmit = true;
  } else if (volunteersToAddCount > 0 || volunteersToRemoveCount > 0) {
    actionButtonText = "Salvar Alterações";
    canSubmit = true;
  }


  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar Voluntário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col px-3 py-4 sm:px-4 sm:py-5">
        <DialogHeader className="px-1 sm:px-2">
          <DialogTitle>Gerenciar Voluntários no Horário</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col pt-2">
          <div className="px-1 sm:px-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-lg font-bold text-blue-900">
              Horário: {timeSlot.startTime} - {timeSlot.endTime}
            </p>
            <p className="text-lg font-bold text-blue-900">
              Data: {format(timeSlot.date, 'dd/MM/yyyy')}
            </p>
          </div>

          {selectedVolunteers.length > 0 && (
            <div className="space-y-2 px-1 sm:px-2">
              <label className="text-sm font-medium">Voluntários Selecionados para este Horário ({selectedVolunteers.length})</label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border rounded-md bg-gray-50">
                {selectedVolunteers.map(name => (
                  <div key={name} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    <span>{name}</span>
                    <button 
                      onClick={() => setSelectedVolunteers(prev => prev.filter(n => n !== name))} 
                      className="hover:bg-blue-200 rounded-full p-0.5"
                      aria-label={`Remover ${name} da seleção`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 flex-1 overflow-hidden flex flex-col min-h-[200px]"> {/* Ensure this container can flex grow */}
            <div className="flex items-center justify-between py-1 my-1 px-1 sm:px-2">
              <label className="text-sm font-medium">Disponíveis para o horário</label>
              <div className="relative flex-1 ml-4 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 h-8 text-xs sm:text-sm" 
                />
              </div>
            </div>
            
            <div className="border rounded-md flex-1 overflow-y-auto min-h-0"> {/* This div will take remaining space and scroll */}
              {filteredAndSortedUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
                </div>
              ) : (
                <div className="p-1 sm:p-2 space-y-1">
                  {filteredAndSortedUsers.map(user => {
                    const fullName = `${user.rank || ''} ${user.warName}`.trim();
                    const currentSlots = getVolunteerSlotCount(fullName);
                    const totalHours = getVolunteerTotalHours(fullName);
                    const maxSlots = user.maxSlots || 1;
                    const atLimit = isVolunteerAtLimit(fullName);
                    const isSelectedNow = selectedVolunteers.includes(fullName);
                    const wasInitiallyInSlot = initialVolunteersInSlot.includes(fullName);
                    
                    // A non-admin cannot select a new user if that user is at their limit
                    const isDisabledForSelection = !isAdmin && !isSelectedNow && !wasInitiallyInSlot && atLimit;

                    return (
                      <div 
                        key={user.id} 
                        className={`flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 
                                    ${isDisabledForSelection ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} 
                                    ${isSelectedNow ? "bg-blue-50 border border-blue-200" : ""}`}
                        onClick={() => !isDisabledForSelection && handleVolunteerToggle(fullName)}
                      >
                        <Checkbox 
                          checked={isSelectedNow} 
                          disabled={isDisabledForSelection}
                          onCheckedChange={() => !isDisabledForSelection && handleVolunteerToggle(fullName)} // Keep consistent with div click
                          aria-label={`Selecionar ${fullName}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`font-medium truncate ${isSelectedNow ? "text-blue-700" : ""}`}>
                              {fullName}
                              {wasInitiallyInSlot && !isSelectedNow && <span className="text-xs text-gray-500 ml-1">(removido)</span>}
                              {wasInitiallyInSlot && isSelectedNow && <span className="text-xs text-blue-600 ml-1">(no horário)</span>}
                            </span>
                            {user.isVolunteer && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                                Voluntário
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center justify-between">
                            <span>
                              {currentSlots}/{maxSlots} serviços
                              {atLimit && !wasInitiallyInSlot && <span className="text-orange-600"> (Limite)</span>}
                              {isAdmin && atLimit && <span className="text-purple-600"> (Admin Override)</span>}
                            </span>
                            <span className={`font-medium ${totalHours >= 50 ? "text-red-600" : "text-blue-600"}`}>
                              {formatHours(totalHours)} trabalhadas
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
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2 mx-1 sm:mx-2">
              Como administrador, você pode adicionar ou remover qualquer usuário, mesmo que tenham atingido o limite de serviços. 
              Os militares que estavam originalmente neste horário aparecem pré-selecionados. Desmarque-os para removê-los ou selecione novos para adicioná-los.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t mt-auto px-1 sm:px-2 pb-1"> {/* Ensure buttons are at bottom */}
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSaveChanges} disabled={isLoading || !canSubmit}>
              {isLoading ? "Processando..." : actionButtonText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
