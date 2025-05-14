//Lista de usuários
import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Ban, Trash2, Loader2, UserCircle } from "lucide-react";
import UserDetailsDialog from "./UserDetailsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface User {
  id: string;
  email: string;
  warName: string;
  rank?: string;
  registration?: string;
  userType?: string;
  service?: string;
  blocked?: boolean;
}
const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    setIsLoading(true);
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
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários."
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      toast({
        title: "Usuário excluído",
        description: "Usuário foi removido com sucesso."
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o usuário."
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
        title: "Status atualizado",
        description: `Usuário foi ${user.blocked ? "desbloqueado" : "bloqueado"} com sucesso.`
      });
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user block status:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível alterar o status do usuário."
      });
    }
  };
  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };
  const formatUserName = (user: User) => {
    const serviceBadge = user.service ? ` (${user.service})` : '';
    return `${user.rank || ''} ${user.warName}${serviceBadge}`.trim();
  };
  if (isLoading) {
    return <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  return <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-2xl font-bold">
          Usuários Cadastrados
          <span className="ml-2 text-sm text-muted-foreground">
            ({users.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum usuário cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Os usuários cadastrados aparecerão aqui.
            </p>
          </div> : <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold bg-slate-400">Nome</TableHead>
                  <TableHead className="w-[100px] text-right bg-slate-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <button onClick={() => handleUserClick(user)} className="text-primary hover:underline text-left w-full">
                        {formatUserName(user)}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant={user.blocked ? "destructive" : "outline"} size="icon" onClick={() => handleToggleBlock(user)} title={user.blocked ? "Desbloquear usuário" : "Bloquear usuário"}>
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteUser(user.id)} title="Excluir usuário">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>}

        <UserDetailsDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} userData={selectedUser} onUserUpdated={fetchUsers} />
      </CardContent>
    </Card>;
};
export default UsersList;