import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Search } from "lucide-react";
import { TimeSlot, FirebaseTimeSlot } from "@/types/timeSlot";

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
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>("");
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
      
      // Separar voluntários de todos os usuários
      const volunteerUsers = usersData.filter(user => user.isVolunteer);
      setVolunteers(volunteerUsers);
      setAllUsers(usersData); // Manter todos os usuários para exibição completa
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
        return {
          id: doc.id,
          date: new Date(data.date),
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

  const getVolunteerSlotCount = (volunteerName: string): number => {
    return allTimeSlots.reduce((count, slot) => {
      if (slot.volunteers && slot.volunteers.includes(volunteerName)) {
        return count + 1;
      }
      return count;
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

  const handleAddVolunteer = async () => {
    if (!selectedVolunteer) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione um voluntário."
      });
      return;
    }

    if (isVolunteerAlreadyInSlot(selectedVolunteer)) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Este voluntário já está inscrito neste horário."
      });
      return;
    }

    if (!isAdmin && isVolunteerAtLimit(selectedVolunteer)) {
      const maxSlots = getVolunteerMaxSlots(selectedVolunteer);
      toast({
        variant: "destructive",
        title: "Limite atingido",
        description: `Este voluntário já atingiu o limite máximo de ${maxSlots} serviço(s).`
      });
      return;
    }

    setIsLoading(true);
    try {
      const timeSlotRef = doc(db, "timeSlots", timeSlot.id!);
      await updateDoc(timeSlotRef, {
        volunteers: arrayUnion(selectedVolunteer),
        slots_used: (timeSlot.slotsUsed || 0) + 1
      });

      toast({
        title: "Sucesso",
        description: "Voluntário adicionado com sucesso!"
      });

      setSelectedVolunteer("");
      setSearchTerm("");
      setOpen(false);
      onVolunteerAdded();
    } catch (error) {
      console.error("Error adding volunteer:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o voluntário."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar todos os usuários baseado no termo de pesquisa
  const filteredUsers = allUsers.filter(user => {
    const fullName = `${user.rank || ''} ${user.warName}`.trim();
    const isNotInSlot = !isVolunteerAlreadyInSlot(fullName);
    const matchesSearch = searchTerm === "" || 
                         fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.warName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.rank && user.rank.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return isNotInSlot && matchesSearch;
  });

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar Voluntário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário ao Horário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Horário: {timeSlot.startTime} - {timeSlot.endTime}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Data: {new Date(timeSlot.date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar voluntário</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Digite para buscar por graduação ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Select Volunteer */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecionar voluntário</label>
            <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um voluntário" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const fullName = `${user.rank || ''} ${user.warName}`.trim();
                    const currentSlots = getVolunteerSlotCount(fullName);
                    const maxSlots = user.maxSlots || 1;
                    const atLimit = isVolunteerAtLimit(fullName);
                    const isVolunteer = user.isVolunteer;
                    
                    return (
                      <SelectItem 
                        key={user.id} 
                        value={fullName}
                        disabled={!isAdmin && atLimit}
                        className={(!isAdmin && atLimit) ? "opacity-50" : ""}
                      >
                        <div className="flex flex-col w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{fullName}</span>
                            {isVolunteer && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                                Voluntário
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {currentSlots}/{maxSlots} serviços
                            {!isAdmin && atLimit && " (Limite atingido)"}
                            {isAdmin && atLimit && " (Admin: pode exceder limite)"}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              Como administrador, você pode adicionar qualquer usuário mesmo que tenham atingido o limite de serviços.
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddVolunteer} disabled={isLoading || !selectedVolunteer}>
              {isLoading ? "Adicionando..." : "Adicionar Voluntário"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
