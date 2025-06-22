import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Search, X, AlertTriangle } from "lucide-react";
import { TimeSlot, FirebaseTimeSlot } from "@/types/timeSlot";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      setSelectedVolunteers([]);
      setInitialVolunteersInSlot([]);
      setSearchTerm("");
    }
  }, [isOpen, timeSlot?.id]);

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
        const dateField = data.date;
        
        if (dateField && typeof dateField === 'object' && 'toDate' in dateField) {
          dateValue = (dateField as any).toDate();
        } else if (dateField && typeof dateField === 'string') {
          dateValue = parseISO(dateField);
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
    
    if (endHour < startHour || (endHour === 0 && startHour > 0)) {
      endHour += 24;
    }
    
    let diffHours = endHour - startHour;
    let diffMinutes = endMinute - startMinute;
    
    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }
    
    return diffHours + (diffMinutes / 60);
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
    const currentSlots = getVolunteerSlotCount(volunteerName);
    const maxSlots = getVolunteerMaxSlots(volunteerName);
    return currentSlots >= maxSlots;
  };

  const getHoursBadgeColor = (hours: number): string => {
    if (hours <= 18) return 'bg-orange-100 text-orange-700';
    if (hours <= 36) return 'bg-blue-100 text-blue-700';
    if (hours <= 50) return 'bg-green-100 text-green-700';
    return 'bg-red-100 text-red-700';
  };

  const willExceedLimit = (volunteerName: string): boolean => {
    const currentHours = getVolunteerTotalHours(volunteerName);
    const slotHours = calculateTimeDifference(timeSlot.startTime, timeSlot.endTime);
    return (currentHours + slotHours) > 50;
  };

  const handleVolunteerToggle = (volunteerFullName: string) => {
    const isCurrentlySelected = selectedVolunteers.includes(volunteerFullName);
    
    if (isCurrentlySelected) {
      // Remove volunteer
      setSelectedVolunteers(prev => prev.filter(name => name !== volunteerFullName));
    } else {
      // Check if adding this volunteer would exceed the slot limit
      const currentCount = selectedVolunteers.length;
      if (currentCount >= timeSlot.slots) {
        toast({
          variant: "destructive",
          title: "Limite de vagas atingido",
          description: `Este horário possui apenas ${timeSlot.slots} vaga(s) disponível(is).`
        });
        return;
      }

      const wasInitiallyInSlot = initialVolunteersInSlot.includes(volunteerFullName);
      
      if (!wasInitiallyInSlot && willExceedLimit(volunteerFullName)) {
        const currentHours = getVolunteerTotalHours(volunteerFullName);
        const slotHours = calculateTimeDifference(timeSlot.startTime, timeSlot.endTime);
        const totalHours = currentHours + slotHours;
        toast({
          variant: "warning",
          title: "Atenção - Limite de 50h",
          description: `${volunteerFullName} ficará com ${totalHours.toFixed(1)}h se adicionado a este horário, ultrapassando o limite de 50h.`
        });
      }

      if (!isAdmin && !wasInitiallyInSlot && isVolunteerAtLimit(volunteerFullName)) {
        toast({
          variant: "destructive",
          title: "Limite atingido",
          description: `${volunteerFullName} já atingiu o limite de serviços e não pode ser adicionado.`
        });
        return;
      }

      // Add volunteer (avoiding duplicates)
      setSelectedVolunteers(prev => {
        if (prev.includes(volunteerFullName)) {
          return prev; // Already exists, don't add duplicate
        }
        return [...prev, volunteerFullName];
      });
    }
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    
    const volunteersToAdd = selectedVolunteers.filter(name => !initialVolunteersInSlot.includes(name));
    const volunteersToRemove = initialVolunteersInSlot.filter(name => !selectedVolunteers.includes(name));

    if (volunteersToAdd.length === 0 && volunteersToRemove.length === 0) {
      toast({
        title: "Nenhuma alteração",
        description: "Nenhuma alteração pendente para salvar."
      });
      setIsLoading(false);
      setOpen(false);
      return;
    }

    // Check slot limit
    if (selectedVolunteers.length > timeSlot.slots) {
      toast({
        variant: "destructive",
        title: "Limite de vagas excedido",
        description: `Este horário possui apenas ${timeSlot.slots} vaga(s). Você selecionou ${selectedVolunteers.length} voluntário(s).`
      });
      setIsLoading(false);
      return;
    }

    if (!isAdmin) {
      const newlyAddedAtLimit = volunteersToAdd.filter(name => isVolunteerAtLimit(name));
      if (newlyAddedAtLimit.length > 0) {
        toast({
          variant: "destructive",
          title: "Limite atingido",
          description: `Os seguintes voluntários atingiram o limite e não podem ser adicionados: ${newlyAddedAtLimit.join(', ')}`
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      const timeSlotRef = doc(db, "timeSlots", timeSlot.id!);
      await updateDoc(timeSlotRef, {
        volunteers: selectedVolunteers,
        slots_used: selectedVolunteers.length
      });

      let successMessage = "Alterações salvas com sucesso!";
      if (volunteersToAdd.length > 0 && volunteersToRemove.length === 0) {
        successMessage = `${volunteersToAdd.length} voluntário(s) adicionado(s).`;
      } else if (volunteersToRemove.length > 0 && volunteersToAdd.length === 0) {
        successMessage = `${volunteersToRemove.length} voluntário(s) removido(s).`;
      } else if (volunteersToAdd.length > 0 && volunteersToRemove.length > 0) {
        successMessage = `${volunteersToAdd.length} adicionado(s), ${volunteersToRemove.length} removido(s).`;
      }

      toast({
        title: "Sucesso",
        description: successMessage
      });

      onVolunteerAdded();
      setOpen(false);
    } catch (error) {
      console.error("Error saving changes to volunteers:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as alterações."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractName = (fullName: string): string => {
    const cleanName = fullName.replace(/^(Cel|Ten Cel|Maj|Cap|1° Ten|2° Ten|Sub Ten|1° Sgt|2° Sgt|3° Sgt|Cb|Sd)\s*(PM\s*)?/i, '').trim();
    return cleanName || fullName;
  };

  const sortUsersByName = (users: User[]) => {
    return users.sort((a, b) => {
      const nameA = extractName(`${a.rank || ''} ${a.warName}`.trim());
      const nameB = extractName(`${b.rank || ''} ${b.warName}`.trim());
      return nameA.localeCompare(nameB);
    });
  };

  const filteredAndSortedUsers = useMemo(() => {
    return sortUsersByName(allUsers.filter(user => {
      const fullName = `${user.rank || ''} ${user.warName}`.trim();
      const matchesSearch = searchTerm === "" || 
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.warName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.rank && user.rank.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    }));
  }, [allUsers, searchTerm]);

  const formatHours = (hours: number): string => {
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

  const volunteersExceedingLimit = selectedVolunteers.filter(name => 
    !initialVolunteersInSlot.includes(name) && willExceedLimit(name)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        
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
            <p className="text-sm text-blue-700 mt-1">
              Vagas: {selectedVolunteers.length}/{timeSlot.slots}
            </p>
          </div>

          {volunteersExceedingLimit.length > 0 && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Atenção:</strong> Os seguintes militares excederão 50h se adicionados: {volunteersExceedingLimit.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {selectedVolunteers.length > 0 && (
            <div className="space-y-2 px-1 sm:px-2">
              <label className="text-sm font-medium">
                Voluntários Selecionados para este Horário ({selectedVolunteers.length})
              </label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border rounded-md bg-gray-50">
                {selectedVolunteers.map(name => {
                  const willExceed = !initialVolunteersInSlot.includes(name) && willExceedLimit(name);
                  return (
                    <div 
                      key={name} 
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        willExceed ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <span>{name}</span>
                      <button
                        onClick={() => setSelectedVolunteers(prev => prev.filter(n => n !== name))}
                        className="hover:bg-opacity-75 rounded-full p-0.5"
                        aria-label={`Remover ${name} da seleção`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2 flex-1 overflow-hidden flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between py-1 my-1 px-1 sm:px-2">
              <label className="text-sm font-medium">Disponíveis para o horário</label>
              <div className="relative flex-1 ml-4 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8 text-xs sm:text-sm"
                />
              </div>
            </div>
            
            <div className="border rounded-md flex-1 overflow-y-auto min-h-0">
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
                    const willExceedHours = !wasInitiallyInSlot && willExceedLimit(fullName);
                    const isDisabledForSelection = !isAdmin && !isSelectedNow && !wasInitiallyInSlot && atLimit;

                    return (
                      <div
                        key={user.id}
                        className={`flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 
                          ${isDisabledForSelection ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} 
                          ${isSelectedNow ? "bg-blue-50 border border-blue-200" : ""}
                          ${willExceedHours ? "border-red-200 bg-red-50" : ""}`}
                        onClick={() => !isDisabledForSelection && handleVolunteerToggle(fullName)}
                      >
                        <Checkbox
                          checked={isSelectedNow}
                          disabled={isDisabledForSelection}
                          onCheckedChange={() => !isDisabledForSelection && handleVolunteerToggle(fullName)}
                          aria-label={`Selecionar ${fullName}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium truncate ${
                                willExceedHours ? "text-red-700" : isSelectedNow ? "text-blue-700" : ""
                              }`}>
                                {fullName}
                              </span>
                              {user.isVolunteer && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex-shrink-0">
                                  Voluntário
                                </span>
                              )}
                            </div>
                            {totalHours > 0 && (
                              <span className={`font-medium text-xs px-2 py-1 rounded-full ${getHoursBadgeColor(totalHours)}`}>
                                {formatHours(totalHours)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>
                                {currentSlots} serviço{currentSlots !== 1 ? 's' : ''} de {maxSlots}
                              </span>
                              {wasInitiallyInSlot && !isSelectedNow && (
                                <span className="text-xs text-gray-500">(removido)</span>
                              )}
                              {wasInitiallyInSlot && isSelectedNow && (
                                <span className="text-xs text-blue-600">(no horário)</span>
                              )}
                              {willExceedHours && (
                                <span className="text-xs text-red-600">(excederá 50h)</span>
                              )}
                            </div>
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

          <div className="flex justify-end gap-2 pt-4 border-t mt-auto px-1 sm:px-2 pb-1">
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
