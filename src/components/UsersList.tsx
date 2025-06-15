import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Ban, Trash2, Loader2, UserCircle, Search, Users, Filter, Mail, Shield, AlertCircle, CheckCircle, MoreVertical, AlertTriangle, UserCheck, Crown } from "lucide-react";
import UserDetailsDialog from "./UserDetailsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  id: string;
  email: string;
  warName: string;
  rank?: string;
  registration?: string;
  userType?: string;
  service?: string;
  blocked?: boolean;
  currentVersion?: string;
}

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "blocked">("all");
  const [currentSystemVersion, setCurrentSystemVersion] = useState("1.0.0");
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchUsers();
    fetchSystemVersion();
  }, []);
  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);
  const fetchSystemVersion = async () => {
    try {
      const versionDoc = await getDoc(doc(db, "system", "version"));
      if (versionDoc.exists()) {
        setCurrentSystemVersion(versionDoc.data().version || "1.0.0");
      }
    } catch (error) {
      console.error("Error fetching system version:", error);
    }
  };
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(userDoc => ({
        id: userDoc.id,
        ...userDoc.data()
      }) as User);
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
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.warName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.rank && user.rank.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.service && user.service.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterStatus === "active") {
      filtered = filtered.filter(user => !user.blocked);
    } else if (filterStatus === "blocked") {
      filtered = filtered.filter(user => user.blocked);
    }
    setFilteredUsers(filtered);
  };
  const handleDeleteUser = async (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
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
    }
  };
  const handleToggleBlock = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.id);
      const newBlockedStatus = !user.blocked;
      await updateDoc(userRef, {
        blocked: newBlockedStatus
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
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  const getStatusStats = () => {
    const active = users.filter(user => !user.blocked).length;
    const blocked = users.filter(user => user.blocked).length;
    return { active, blocked, total: users.length };
  };

  // AJUSTE: Lógica de versão simplificada para atender ao pedido
  const getVersionStatus = (userVersion?: string) => {
    if (!userVersion || userVersion !== currentSystemVersion) {
      return {
        status: "outdated",
        text: "Desatualizado",
        variant: "destructive" as const
      };
    }
    return {
      status: "updated", 
      text: "Atualizado",
      variant: "default" as const
    };
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }
  const stats = getStatusStats();
  return (
    <div className="space-y-6 h-full">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
              <p className="text-blue-100 text-sm">Controle total dos usuários do sistema</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-blue-100">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-200" />
              </div>
              <div>
                <p className="text-sm text-blue-100">Ativos</p>
                <p className="text-2xl font-bold text-green-200">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-200" />
              </div>
              <div>
                <p className="text-sm text-blue-100">Bloqueados</p>
                <p className="text-2xl font-bold text-red-200">{stats.blocked}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, posto ou força..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-2 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Todos
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                onClick={() => setFilterStatus("active")}
                className="flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Ativos
              </Button>
              <Button
                variant={filterStatus === "blocked" ? "destructive" : "outline"}
                onClick={() => setFilterStatus("blocked")}
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Bloqueados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="border-0 shadow-lg flex-1">
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <UserCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchTerm || filterStatus !== "all" ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== "all" ? "Tente ajustar os filtros de busca." : "Os usuários cadastrados aparecerão aqui."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {filteredUsers.map((user, index) => {
                  const versionStatus = getVersionStatus(user.currentVersion);
                  const isAdmin = user.userType === 'admin';
                  
                  return (
                    <Card 
                      key={user.id} 
                      className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 cursor-pointer animate-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => handleUserClick(user)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {user.rank} {user.warName}
                              </h3>
                              {isAdmin && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            {user.registration && (
                              <p className="text-sm text-gray-500">Mat.: {user.registration}</p>
                            )}
                            {user.service && (
                              <p className="text-xs text-blue-600 font-medium">({user.service})</p>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBlock(user);
                              }}>
                                <Ban className="h-4 w-4 mr-2" />
                                {user.blocked ? "Desbloquear" : "Bloquear"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(user.id);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              variant={user.blocked ? "destructive" : "default"}
                              className="text-xs"
                            >
                              {user.blocked ? "Bloqueado" : "Ativo"}
                            </Badge>
                            
                            {isAdmin && (
                              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                <Crown className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            
                            <Badge 
                              variant={versionStatus.variant}
                              className="text-xs flex items-center gap-1"
                            >
                              {versionStatus.status === 'outdated' && <AlertTriangle className="h-3 w-3" />}
                              {versionStatus.text}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

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
