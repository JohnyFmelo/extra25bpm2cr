
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

interface AddVolunteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  travelId: string;
  currentVolunteers: string[];
  onVolunteersAdded: () => void;
}

const AddVolunteerDialog = ({ 
  open, 
  onOpenChange, 
  travelId, 
  currentVolunteers,
  onVolunteersAdded 
}: AddVolunteerDialogProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUsers([]);
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

  const handleAddVolunteers = async () => {
    try {
      if (selectedUsers.length === 0) {
        toast({
          variant: "destructive",
          title: "Nenhum voluntário selecionado",
          description: "Por favor, selecione pelo menos um voluntário para adicionar."
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

      // Format selected users to match the expected format in the database
      const usersToAdd = selectedUsers.map(userId => {
        const user = users.find(u => u.id === userId);
        return `${user?.rank} ${user?.warName}`;
      }).filter(Boolean);

      // Get current volunteers and add the new ones without duplicates
      const travelData = travelSnap.data();
      const currentVolunteersArray = Array.isArray(travelData.volunteers) ? travelData.volunteers : [];
      
      // Create a Set to remove duplicates
      const uniqueVolunteers = new Set([...currentVolunteersArray, ...usersToAdd]);
      
      // Convert back to array
      const updatedVolunteers = Array.from(uniqueVolunteers);

      // Update the travel with new volunteers
      await updateDoc(travelRef, {
        volunteers: updatedVolunteers
      });

      toast({
        title: "Sucesso",
        description: "Voluntários adicionados com sucesso!"
      });
      
      onVolunteersAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding volunteers:", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar voluntários",
        description: "Ocorreu um erro ao adicionar os voluntários."
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
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

  const isVolunteerAlreadyAdded = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.rank || !user.warName) return false;
    
    const formattedName = `${user.rank} ${user.warName}`;
    return currentVolunteers.includes(formattedName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntários</DialogTitle>
          <DialogDescription>
            Selecione os voluntários que deseja adicionar à viagem.
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
                    const isAlreadyAdded = isVolunteerAlreadyAdded(user.id);
                    const isSelected = selectedUsers.includes(user.id);
                    
                    return (
                      <div
                        key={user.id}
                        onClick={() => !isAlreadyAdded && toggleUserSelection(user.id)}
                        className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${
                          isAlreadyAdded ? 'bg-gray-100 text-gray-500' : 
                          isSelected ? 'bg-blue-50 border border-blue-200' : 
                          'hover:bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{user.rank} {user.warName}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                        <div>
                          {isAlreadyAdded ? (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Já adicionado</span>
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
            onClick={handleAddVolunteers}
            disabled={selectedUsers.length === 0}
          >
            Adicionar {selectedUsers.length > 0 && `(${selectedUsers.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerDialog;
