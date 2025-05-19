
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface User {
  id: string;
  rank: string;
  warName: string;
  fullName: string;
  registration: string;
}

interface UserSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selectedUsers: string[]) => void;
  initialSelected?: string[];
  maxSelections?: number;
  title?: string;
}

const UserSelectionDialog = ({
  open,
  onOpenChange,
  onSelect,
  initialSelected = [],
  maxSelections,
  title = "Selecionar Voluntários"
}: UserSelectionDialogProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>(initialSelected);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        
        const fetchedUsers: User[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as User;
          fetchedUsers.push({
            id: doc.id,
            rank: userData.rank || "",
            warName: userData.warName || "",
            fullName: userData.fullName || "",
            registration: userData.registration || ""
          });
        });
        
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchUsers();
      setSelectedUsers(initialSelected);
    }
  }, [open, initialSelected]);

  const handleToggleSelection = (userFullName: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userFullName)) {
        return prev.filter((name) => name !== userFullName);
      } else {
        if (maxSelections && prev.length >= maxSelections) {
          return prev;
        }
        return [...prev, userFullName];
      }
    });
  };

  const handleSave = () => {
    onSelect(selectedUsers);
    onOpenChange(false);
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${user.rank} ${user.warName}`.toLowerCase();
    const registration = user.registration.toLowerCase();
    
    return fullName.includes(searchLower) || registration.includes(searchLower);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por nome ou matrícula..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="max-h-[320px] overflow-y-auto mt-2">
          {loading ? (
            <div className="py-4 text-center text-gray-500">Carregando usuários...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-4 text-center text-gray-500">Nenhum usuário encontrado</div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => {
                const userFullName = `${user.rank} ${user.warName}`;
                const isSelected = selectedUsers.includes(userFullName);
                
                return (
                  <div
                    key={user.id}
                    className={`p-2 rounded-md cursor-pointer flex items-center justify-between ${
                      isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleToggleSelection(userFullName)}
                  >
                    <div>
                      <p className="font-medium">{userFullName}</p>
                      <p className="text-sm text-gray-500">Matrícula: {user.registration}</p>
                    </div>
                    {isSelected && (
                      <div className="h-4 w-4 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {maxSelections && (
          <p className="text-sm text-gray-500 mt-2">
            Selecionados {selectedUsers.length} de {maxSelections} máximo
          </p>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserSelectionDialog;
