
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Search, Edit, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  warName: string;
  rank?: string;
  isVolunteer?: boolean;
  maxSlots?: number;
}

const VolunteersManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [editingSlots, setEditingSlots] = useState<{[key: string]: number}>({});
  const [savingSlots, setSavingSlots] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(userDoc => ({
        id: userDoc.id,
        ...userDoc.data(),
        isVolunteer: userDoc.data().isVolunteer ?? false,
        maxSlots: userDoc.data().maxSlots ?? 1
      }) as User).sort((a, b) => (a.warName || "").localeCompare(b.warName || ""));
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

  const handleToggleVolunteer = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.id);
      const newIsVolunteerStatus = !user.isVolunteer;
      await updateDoc(userRef, {
        isVolunteer: newIsVolunteerStatus
      });
      setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? {
        ...u,
        isVolunteer: newIsVolunteerStatus
      } : u));
      toast({
        title: "Status atualizado",
        description: `${user.warName} agora ${newIsVolunteerStatus ? "é" : "não é"} um voluntário.`
      });
    } catch (error) {
      console.error("Error toggling volunteer status:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível alterar o status de voluntário."
      });
    }
  };

  const handleEditSlots = (userId: string, currentSlots: number) => {
    setEditingSlots(prev => ({ ...prev, [userId]: currentSlots }));
  };

  const handleSaveSlots = async (userId: string) => {
    const newSlots = editingSlots[userId];
    if (newSlots === undefined || newSlots < 0) {
      toast({
        variant: "destructive",
        title: "Valor inválido",
        description: "O limite deve ser um número maior ou igual a 0."
      });
      return;
    }

    setSavingSlots(prev => ({ ...prev, [userId]: true }));
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        maxSlots: newSlots
      });

      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {
        ...u,
        maxSlots: newSlots
      } : u));

      setEditingSlots(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });

      toast({
        title: "Limite atualizado",
        description: `Limite de serviços atualizado para ${newSlots}.`
      });
    } catch (error) {
      console.error("Error updating slots limit:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o limite de serviços."
      });
    } finally {
      setSavingSlots(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleCancelEdit = (userId: string) => {
    setEditingSlots(prev => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    });
  };

  const handleToggleAllVolunteers = async (makeVolunteer: boolean) => {
    if (filteredUsers.length === 0) {
      toast({
        title: "Nenhum usuário visível",
        description: "A busca atual não retornou resultados para atualizar."
      });
      return;
    }
    setIsBulkUpdating(true);
    try {
      const batch = writeBatch(db);
      const filteredUserIds = new Set(filteredUsers.map(u => u.id));
      filteredUserIds.forEach(userId => {
        const userRef = doc(db, "users", userId);
        batch.update(userRef, {
          isVolunteer: makeVolunteer
        });
      });
      await batch.commit();
      setUsers(prevUsers => prevUsers.map(user => filteredUserIds.has(user.id) ? {
        ...user,
        isVolunteer: makeVolunteer
      } : user));
      toast({
        title: "Atualização em massa concluída",
        description: `${filteredUsers.length} usuários foram atualizados com sucesso.`
      });
    } catch (error) {
      console.error("Error during bulk update:", error);
      toast({
        variant: "destructive",
        title: "Erro na atualização em massa",
        description: "Não foi possível atualizar todos os usuários."
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchTerm = searchQuery.toLowerCase();
    const rank = (user.rank || '').toLowerCase();
    const warName = (user.warName || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return rank.includes(searchTerm) || warName.includes(searchTerm) || email.includes(searchTerm);
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>;
  }

  return <div className="w-full max-w-6xl mx-auto p-6 px-0">
      <Card className="shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Users className="h-7 w-7 text-primary" />
            Gerenciar Voluntários
          </CardTitle>
          <p className="mt-2 text-zinc-700">
            Gerencie o status de voluntário e limite de serviços dos usuários cadastrados
          </p>
        </CardHeader>

        <CardContent className="space-y-6 px-[6px]">
          {/* Seção de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar por nome, posto ou e-mail..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11" />
          </div>

          {/* Estatísticas e ações em massa */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-primary-dark">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Total: {filteredUsers.length} usuários</span>
              <span>Voluntários: {filteredUsers.filter(u => u.isVolunteer).length}</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => handleToggleAllVolunteers(true)} disabled={isBulkUpdating || filteredUsers.length === 0} className="min-w-[140px]">
                {isBulkUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Marcar Todos
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleToggleAllVolunteers(false)} disabled={isBulkUpdating || filteredUsers.length === 0} className="min-w-[140px]">
                {isBulkUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Desmarcar Todos
              </Button>
            </div>
          </div>
          
          {/* Lista de usuários */}
          {filteredUsers.length === 0 ? <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum usuário encontrado</p>
              <p className="text-sm">Tente ajustar os termos de busca</p>
            </div> : <div className="space-y-2">
              {filteredUsers.map(user => <div key={user.id} className={`
                    group flex items-center justify-between p-4 rounded-lg border transition-all duration-200
                    ${user.isVolunteer ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'}
                  `}>
                  {/* Informações do usuário */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-2 h-2 rounded-full flex-shrink-0
                        ${user.isVolunteer ? 'bg-green-500' : 'bg-gray-300'}
                      `} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {user.rank && `${user.rank} `}{user.warName}
                        </p>
                        {user.email ? <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {user.email}
                          </p> : <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                            E-mail não informado
                          </p>}
                      </div>
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="flex items-center gap-4 ml-4">
                    {/* Limite de serviços */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600 dark:text-gray-400">
                        Limite:
                      </Label>
                      {editingSlots[user.id] !== undefined ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            value={editingSlots[user.id]}
                            onChange={(e) => setEditingSlots(prev => ({
                              ...prev,
                              [user.id]: parseInt(e.target.value) || 0
                            }))}
                            className="w-16 h-8 text-center"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveSlots(user.id)}
                            disabled={savingSlots[user.id]}
                            className="h-8 w-8 p-0"
                          >
                            {savingSlots[user.id] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelEdit(user.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium min-w-[20px] text-center">
                            {user.maxSlots || 1}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSlots(user.id, user.maxSlots || 1)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Switch de voluntário */}
                    <div className="flex items-center gap-3">
                      <Switch 
                        id={`volunteer-switch-${user.id}`} 
                        checked={!!user.isVolunteer} 
                        onCheckedChange={() => handleToggleVolunteer(user)} 
                        className="data-[state=checked]:bg-green-600" 
                      />
                    </div>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>
    </div>;
};

export default VolunteersManager;
