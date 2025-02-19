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
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      toast({
        description: "Usuário excluído com sucesso.",
      });
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
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
        description: `Usuário ${user.blocked ? "desbloqueado" : "bloqueado"} com sucesso.`,
      });
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-medium text-foreground">
          Usuários
          <span className="ml-2 text-muted-foreground">({users.length})</span>
        </h2>
      </div>

      <div className="bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <button
                    onClick={() => handleUserClick(user)}
                    className="hover:text-primary transition-colors"
                  >
                    {formatUserName(user)}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleBlock(user)}
                      className={user.blocked ? "text-destructive" : ""}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
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
      </div>

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
