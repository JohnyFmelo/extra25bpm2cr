
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
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUsers([]);
      setSearchQuery("");
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

      // Filter out users without rank or warName and sort alphabetically
      const filteredUsers = usersData
        .filter(user => user.rank && user.warName)
        .sort((a, b) => {
          const nameA = `${a.rank} ${a.warName}`.toLowerCase();
          const nameB = `${b.rank} ${b.warName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      
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
    if (selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum voluntário selecionado",
        description: "Por favor, selecione pelo menos um voluntário para adicionar."
      });
      return;
    }

    setIsAdding(true);
    try {
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

      const addedCount = updatedVolunteers.length - currentVolunteersArray.length;
      
      toast({
        title: "Sucesso",
        description: `${addedCount} voluntário(s) adicionado(s) com sucesso!`
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
    } finally {
      setIsAdding(false);
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

  const selectAll = () => {
    const availableUsers = filteredUsers.filter(user => !isVolunteerAlreadyAdded(user.id));
    const availableUserIds = availableUsers.map(user => user.id);
    setSelectedUsers(availableUserIds);
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const availableUsersCount = filteredUsers.filter(user => !isVolunteerAlreadyAdded(user.id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntários</DialogTitle>
          <DialogDescription>
            Selecione os voluntários que deseja adicionar à viagem.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 py-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Input
              placeholder="Buscar por nome, graduação ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          {/* Bulk Actions */}
          {!loading && availableUsersCount > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <span>{selectedUsers.length} de {availableUsersCount} selecionados</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={selectedUsers.length === availableUsersCount}
                >
                  Selecionar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={selectedUsers.length === 0}
                >
                  Limpar
                </Button>
              </div>
            </div>
          )}

          {/* Users List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500">Carregando usuários...</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-2">
              {filteredUsers.length > 0 ? (
                <div className="space-y-2">
                  {filteredUsers.map((user) => {
                    const isAlreadyAdded = isVolunteerAlreadyAdded(user.id);
                    const isSelected = selectedUsers.includes(user.id);
                    
                    return (
                      <div
                        key={user.id}
                        onClick={() => !isAlreadyAdded && toggleUserSelection(user.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          isAlreadyAdded 
                            ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
                            : isSelected 
                              ? 'bg-blue-50 border-blue-300 hover:bg-blue-100' 
                              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`font-medium truncate ${isAlreadyAdded ? 'text-gray-500' : 'text-gray-900'}`}>
                            {user.rank} {user.warName}
                          </span>
                          <span className={`text-sm truncate ${isAlreadyAdded ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.email}
                          </span>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          {isAlreadyAdded ? (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                              Já adicionado
                            </span>
                          ) : isSelected ? (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="space-y-2">
                    <p className="font-medium">Nenhum usuário encontrado</p>
                    {searchQuery ? (
                      <p className="text-sm">Tente ajustar os termos de busca</p>
                    ) : (
                      <p className="text-sm">Não há usuários disponíveis</p>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddVolunteers}
            disabled={selectedUsers.length === 0 || isAdding}
            className="min-w-[120px]"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                Adicionar {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerDialog;
