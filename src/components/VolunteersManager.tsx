import { useState, useEffect } from "react";
// Adicionado 'writeBatch' para atualizações em massa eficientes
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
// Adicionado o componente Button para as novas ações
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  warName: string;
  rank?: string;
  isVolunteer?: boolean;
}

const VolunteersManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Novo estado para controlar o carregamento da atualização em massa
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
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
      }) as User)
      .sort((a, b) => (a.warName || "").localeCompare(b.warName || ""));
      
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
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
        isVolunteer: newIsVolunteerStatus,
      });

      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id ? { ...u, isVolunteer: newIsVolunteerStatus } : u
        )
      );

      toast({
        title: "Status atualizado",
        description: `${user.warName} agora ${newIsVolunteerStatus ? "é" : "não é"} um voluntário.`,
      });
    } catch (error) {
      console.error("Error toggling volunteer status:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível alterar o status de voluntário.",
      });
    }
  };

  // Nova função para marcar/desmarcar todos os usuários filtrados
  const handleToggleAllVolunteers = async (makeVolunteer: boolean) => {
    if (filteredUsers.length === 0) {
      toast({
        title: "Nenhum usuário visível",
        description: "A busca atual não retornou resultados para atualizar.",
      });
      return;
    }

    setIsBulkUpdating(true);
    try {
      const batch = writeBatch(db);
      const filteredUserIds = new Set(filteredUsers.map(u => u.id));

      filteredUserIds.forEach(userId => {
        const userRef = doc(db, "users", userId);
        batch.update(userRef, { isVolunteer: makeVolunteer });
      });

      await batch.commit();

      setUsers(prevUsers =>
        prevUsers.map(user =>
          filteredUserIds.has(user.id)
            ? { ...user, isVolunteer: makeVolunteer }
            : user
        )
      );

      toast({
        title: "Atualização em massa concluída",
        description: `${filteredUsers.length} usuários foram atualizados com sucesso.`,
      });
    } catch (error) {
      console.error("Error during bulk update:", error);
      toast({
        variant: "destructive",
        title: "Erro na atualização em massa",
        description: "Não foi possível atualizar todos os usuários.",
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
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Gerenciar Voluntários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          {/* MELHORIA: Cor do ícone fixada para garantir visibilidade */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Pesquisar por nome, posto ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>

        {/* NOVO: Botões para ações em massa */}
        <div className="flex flex-wrap gap-2 pt-2">
            <Button
                size="sm"
                onClick={() => handleToggleAllVolunteers(true)}
                disabled={isBulkUpdating || filteredUsers.length === 0}
            >
                {isBulkUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Marcar Visíveis como Voluntários
            </Button>
            <Button
                size="sm"
                variant="secondary"
                onClick={() => handleToggleAllVolunteers(false)}
                disabled={isBulkUpdating || filteredUsers.length === 0}
            >
                {isBulkUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Desmarcar Visíveis
            </Button>
        </div>
        
        {/* MELHORIA: Layout da lista agora é responsivo e mais legível */}
        <div className="space-y-3">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className={`
                  flex flex-col items-start gap-3 
                  sm:flex-row sm:items-center sm:justify-between
                  p-4 rounded-lg border transition-colors
                  ${user.isVolunteer ? 'bg-accent/50 dark:bg-accent/20' : 'hover:bg-muted/50'}
                `}
              >
                {/* Seção de informações do usuário */}
                <div>
                  <p className="font-semibold">{user.rank} {user.warName}</p>
                  {user.email ? (
                    // Cor do e-mail melhorada para maior contraste
                    <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/70 italic">E-mail não informado</p>
                  )}
                </div>

                {/* Seção do switch, alinhado à direita em telas pequenas */}
                <div className="flex w-full items-center justify-end space-x-2 sm:w-auto">
                  <Switch
                    id={`volunteer-switch-${user.id}`}
                    checked={!!user.isVolunteer}
                    onCheckedChange={() => handleToggleVolunteer(user)}
                  />
                  <Label htmlFor={`volunteer-switch-${user.id}`} className="cursor-pointer text-sm">
                    Voluntário
                  </Label>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VolunteersManager;
