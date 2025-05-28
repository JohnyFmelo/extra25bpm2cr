import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Ban, Trash2, Loader2, UserCircle, Search, Users, Filter, Mail, Shield, AlertCircle, CheckCircle } from "lucide-react";
import UserDetailsDialog from "./UserDetailsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "blocked">("all");
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);
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
  const filterUsers = () => {
    let filtered = users;

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(user => user.warName.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()) || user.rank && user.rank.toLowerCase().includes(searchTerm.toLowerCase()) || user.service && user.service.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filtro por status
    if (filterStatus === "active") {
      filtered = filtered.filter(user => !user.blocked);
    } else if (filterStatus === "blocked") {
      filtered = filtered.filter(user => user.blocked);
    }
    setFilteredUsers(filtered);
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
      const newBlockedStatus = !user.blocked;
      
      await updateDoc(userRef, {
        blocked: newBlockedStatus
      });

      // Se o usuário está sendo bloqueado, verificar se é o usuário logado
      if (newBlockedStatus) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Se for o usuário atual sendo bloqueado, fazer logout imediato
        if (currentUser.id === user.id) {
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
      }

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
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  const getStatusStats = () => {
    const active = users.filter(user => !user.blocked).length;
    const blocked = users.filter(user => user.blocked).length;
    return {
      active,
      blocked,
      total: users.length
    };
  };
  if (isLoading) {
    return <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>;
  }
  const stats = getStatusStats();
  return <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bloqueados</p>
                <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card Principal */}
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Usuários Cadastrados
            </CardTitle>
          </div>
          
          {/* Filtros e Busca */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, email, posto ou força..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            
            <div className="flex gap-2">
              <Button variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")} size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Todos
              </Button>
              <Button variant={filterStatus === "active" ? "default" : "outline"} onClick={() => setFilterStatus("active")} size="sm">
                Ativos
              </Button>
              <Button variant={filterStatus === "blocked" ? "default" : "outline"} onClick={() => setFilterStatus("blocked")} size="sm">
                Bloqueados
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredUsers.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {searchTerm || filterStatus !== "all" ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm || filterStatus !== "all" ? "Tente ajustar os filtros de busca." : "Os usuários cadastrados aparecerão aqui."}
              </p>
            </div> : <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Usuário</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell>
                        <button onClick={() => handleUserClick(user)} className="flex items-center space-x-3 text-left w-full hover:bg-muted/30 rounded-md p-2 -m-2 transition-colors">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(user.warName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-primary hover:underline">
                              {formatUserName(user)}
                            </p>
                            {user.registration && <p className="text-sm text-muted-foreground text-stone-500">
                                Matrícula: {user.registration}
                              </p>}
                          </div>
                        </button>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={user.blocked ? "destructive" : "default"} className="flex items-center space-x-1">
                            {user.blocked ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                            <span>{user.blocked ? "Bloqueado" : "Ativo"}</span>
                          </Badge>
                          {user.userType && <Badge variant="outline" className="flex items-center space-x-1">
                              <Shield className="h-3 w-3" />
                              <span>{user.userType}</span>
                            </Badge>}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant={user.blocked ? "default" : "destructive"} size="sm" onClick={() => handleToggleBlock(user)} title={user.blocked ? "Desbloquear usuário" : "Bloquear usuário"}>
                            <Ban className="h-4 w-4 mr-2" />
                            {user.blocked ? "Desbloquear" : "Bloquear"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)} title="Excluir usuário">
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
      </Card>
    </div>;
};
export default UsersList;
