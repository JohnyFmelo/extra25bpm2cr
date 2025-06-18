
import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Loader2, Search } from "lucide-react";
import { Input } from "./ui/input";

interface User {
  id: string;
  warName?: string;
  rank?: string;
  email: string;
}

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  travelId: string;
  dateField: string | null;
  timeSlot: string;
  currentVolunteers: string[];
  onVolunteerAdded: () => void;
}

const AddVolunteerToSlotDialog = ({ 
  open, 
  onOpenChange, 
  travelId, 
  dateField, 
  timeSlot, 
  currentVolunteers,
  onVolunteerAdded 
}: AddVolunteerToSlotDialogProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUser("");
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      // Filter out users without rank or warName
      const filteredUsers = usersData.filter(user => user.rank && user.warName);
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVolunteer = async () => {
    if (!dateField) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Campo de data não encontrado."
      });
      return;
    }

    try {
      if (!selectedUser) {
        toast({
          variant: "destructive",
          title: "Nenhum voluntário selecionado",
          description: "Por favor, selecione um voluntário para adicionar."
        });
        return;
      }

      // Get current travel data
      const travelRef = doc(db, "travels", travelId);
      const travelSnap = await getDoc(travelRef);
      
      if (!travelSnap.exists()) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Viagem não encontrada."
        });
        return;
      }

      // Format selected user to match the expected format in the database
      const user = users.find(u => u.id === selectedUser);
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não encontrado."
        });
        return;
      }

      const formattedVolunteer = `${user.rank} ${user.warName}`;

      // Get current travel data
      const travelData = travelSnap.data();
      const currentTimeSlots = travelData[dateField] || {};
      const currentSlotVolunteers = currentTimeSlots[timeSlot] || [];

      // Check if volunteer is already in this slot
      if (currentSlotVolunteers.includes(formattedVolunteer)) {
        toast({
          variant: "destructive",
          title: "Voluntário já adicionado",
          description: "Este voluntário já está neste horário."
        });
        return;
      }

      // Add volunteer to the slot
      const updatedSlotVolunteers = [...currentSlotVolunteers, formattedVolunteer];
      const updatedTimeSlots = {
        ...currentTimeSlots,
        [timeSlot]: updatedSlotVolunteers
      };

      // Update the travel with new volunteer in the specific slot
      await updateDoc(travelRef, {
        [dateField]: updatedTimeSlots
      });

      toast({
        title: "Sucesso",
        description: "Voluntário adicionado com sucesso!"
      });
      
      onVolunteerAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding volunteer:", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar voluntário",
        description: "Ocorreu um erro ao adicionar o voluntário."
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const warName = user.warName?.toLowerCase() || "";
    const rank = user.rank?.toLowerCase() || "";
    const email = user.email.toLowerCase();
    const fullName = `${rank} ${warName}`.toLowerCase();
    
    return warName.includes(searchLower) || 
           rank.includes(searchLower) || 
           email.includes(searchLower) ||
           fullName.includes(searchLower);
  });

  const isVolunteerAlreadyInSlot = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.rank || !user.warName) return false;
    
    const formattedName = `${user.rank} ${user.warName}`;
    return currentVolunteers.includes(formattedName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário ao Horário</DialogTitle>
          <DialogDescription>
            Selecione o voluntário que deseja adicionar ao horário {timeSlot}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="relative mb-4">
            <Input
              placeholder="Buscar por nome, graduação ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              {filteredUsers.length > 0 ? (
                <div className="space-y-2">
                  {filteredUsers.map((user) => {
                    const isAlreadyInSlot = isVolunteerAlreadyInSlot(user.id);
                    const isSelected = selectedUser === user.id;
                    
                    return (
                      <div
                        key={user.id}
                        onClick={() => !isAlreadyInSlot && setSelectedUser(user.id)}
                        className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${
                          isAlreadyInSlot ? 'bg-gray-100 text-gray-500' : 
                          isSelected ? 'bg-blue-50 border border-blue-200' : 
                          'hover:bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{user.rank} {user.warName}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                        <div>
                          {isAlreadyInSlot ? (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Já no horário</span>
                          ) : isSelected ? (
                            <Check className="h-5 w-5 text-blue-500" />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum usuário encontrado com "{searchQuery}"
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddVolunteer}
            disabled={!selectedUser}
          >
            Adicionar Voluntário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
