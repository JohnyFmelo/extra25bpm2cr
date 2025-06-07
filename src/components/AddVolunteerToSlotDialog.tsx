
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, X, Search, Loader2 } from "lucide-react";
import { dataOperations } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { TimeSlot } from "@/types/timeSlot";
import { ScrollArea } from "./ui/scroll-area";

interface User {
  id: string;
  warName?: string;
  rank?: string;
  email: string;
}

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeSlot: TimeSlot;
  onSuccess: () => void;
}

const AddVolunteerToSlotDialog = ({
  open,
  onOpenChange,
  timeSlot,
  onSuccess
}: AddVolunteerToSlotDialogProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      // Filtrar usuários que têm graduação e nome de guerra
      const validUsers = usersData.filter(user => user.rank && user.warName);
      setUsers(validUsers);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => {
      const fullName = `${user.rank} ${user.warName}`.toLowerCase();
      const warName = user.warName?.toLowerCase() || "";
      const rank = user.rank?.toLowerCase() || "";
      
      return fullName.includes(query) || 
             warName.includes(query) || 
             rank.includes(query);
    });
    
    setFilteredUsers(filtered);
  };

  const handleAddVolunteer = async () => {
    if (!selectedUserId) {
      toast({
        title: "Erro",
        description: "Selecione um voluntário para adicionar.",
        variant: "destructive"
      });
      return;
    }

    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado.",
        variant: "destructive"
      });
      return;
    }

    const volunteerName = `${selectedUser.rank} ${selectedUser.warName}`;

    // Verificar se o voluntário já está na lista
    if (timeSlot.volunteers?.includes(volunteerName)) {
      toast({
        title: "Erro",
        description: "Este voluntário já está adicionado a este horário.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se ainda há vagas disponíveis
    if (timeSlot.slotsUsed >= timeSlot.slots) {
      toast({
        title: "Erro",
        description: "Este horário já está lotado.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const updatedVolunteers = [...(timeSlot.volunteers || []), volunteerName];
      
      // Usar o Firebase para atualizar o slot
      const result = await dataOperations.update({
        date: timeSlot.date.toISOString().split('T')[0],
        start_time: `${timeSlot.startTime}:00`,
        end_time: `${timeSlot.endTime}:00`,
        total_slots: timeSlot.slots,
        slots_used: updatedVolunteers.length,
        description: timeSlot.description || "",
        allowedMilitaryTypes: timeSlot.allowedMilitaryTypes || [],
        volunteers: updatedVolunteers
      }, {
        date: timeSlot.date.toISOString().split('T')[0],
        start_time: `${timeSlot.startTime}:00`,
        end_time: `${timeSlot.endTime}:00`
      });
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Voluntário adicionado com sucesso!"
        });
        setSelectedUserId("");
        setSearchQuery("");
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Failed to add volunteer');
      }
    } catch (error) {
      console.error('Erro ao adicionar voluntário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o voluntário.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-500" />
            Adicionar Voluntário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Horário selecionado</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">
                {timeSlot.startTime} às {timeSlot.endTime}
              </p>
              <p className="text-sm text-gray-600">
                Vagas: {timeSlot.slotsUsed}/{timeSlot.slots}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Buscar voluntário</Label>
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite para buscar por graduação ou nome..."
                disabled={isLoadingUsers || isLoading}
                className="pl-8"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Selecionar voluntário</Label>
            {isLoadingUsers ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Carregando usuários...</span>
              </div>
            ) : (
              <ScrollArea className="h-48 border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const volunteerName = `${user.rank} ${user.warName}`;
                      const isAlreadyAdded = timeSlot.volunteers?.includes(volunteerName);
                      
                      return (
                        <div
                          key={user.id}
                          onClick={() => !isAlreadyAdded && setSelectedUserId(user.id)}
                          className={`p-2 rounded cursor-pointer transition-colors ${
                            isAlreadyAdded 
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                              : selectedUserId === user.id 
                                ? 'bg-green-100 border border-green-300' 
                                : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{volunteerName}</span>
                            {isAlreadyAdded && (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                Já adicionado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {timeSlot.volunteers && timeSlot.volunteers.length > 0 && (
            <div className="space-y-2">
              <Label>Voluntários já adicionados:</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {timeSlot.volunteers.map((volunteer, index) => (
                  <div key={index} className="text-sm p-2 bg-blue-50 rounded flex items-center justify-between">
                    <span>{volunteer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddVolunteer}
            disabled={isLoading || !selectedUserId || timeSlot.slotsUsed >= timeSlot.slots}
            className="bg-green-500 hover:bg-green-600"
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Adicionando...
              </span>
            ) : (
              "Adicionar Voluntário"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
