//Lista de usuários
import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Ban, Trash2 } from "lucide-react";
import UserDetailsDialog from "./UserDetailsDialog";

interface User {
  id: string;
  email: string;
  warName: string;
  rank?: string;
  registration?: string;
  userType?: string;
  blocked?: boolean;
}

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários.",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso.",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o usuário.",
      });
    }
  };

  const handleToggleBlock = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        blocked: !user.blocked
      });
      toast({
        title: "Sucesso",
        description: `Usuário ${user.blocked ? "desbloqueado" : "bloqueado"} com sucesso.`,
      });
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user block status:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do usuário.",
      });
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const formatUserName = (user: User) => {
    return `${user.rank || ''} ${user.warName}`.trim();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">
        Usuários Cadastrados ({users.length})
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary">Nome</TableHead>
            <TableHead className="text-primary">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="w-full">
                <button
                  onClick={() => handleUserClick(user)}
                  className="text-primary hover:underline text-left w-full"
                >
                  {formatUserName(user)}
                </button>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex gap-2">
                  <Button
                    variant={user.blocked ? "destructive" : "outline"}
                    size="icon"
                    onClick={() => handleToggleBlock(user)}
                  >
                    <Ban className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userData={selectedUser}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
};

export default UsersList;
