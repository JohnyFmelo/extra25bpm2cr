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
import styles from './UsersList.module.css'; // Importe seu arquivo CSS

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
    <div className={styles.container}>
      <h2 className={styles.title}>Usuários Cadastrados ({users.length})</h2>
      <Table className={styles.table}>
        <TableHeader>
          <TableRow>
            <TableHead className={styles.tableHead}>Nome</TableHead>
            <TableHead className={styles.tableHead}>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className={styles.tableRow}>
              <TableCell className={styles.tableCell}>
                <button
                  onClick={() => handleUserClick(user)}
                  className={styles.userButton}
                >
                  {formatUserName(user)}
                </button>
              </TableCell>
              <TableCell className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  <Button
                    variant={user.blocked ? "destructive" : "outline"}
                    size="icon"
                    onClick={() => handleToggleBlock(user)}
                  >
                    <Ban className={styles.icon} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className={styles.icon} />
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
