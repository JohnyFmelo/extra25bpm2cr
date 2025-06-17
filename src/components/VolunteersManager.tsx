import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, writeBatch, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Search } from "lucide-react";
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
interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  volunteers?: string[];
}
const VolunteersManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showVolunteersOnly, setShowVolunteersOnly] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchUsers();

    // Listen to timeSlots for real-time updates
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection);
    const unsubscribe = onSnapshot(q, snapshot => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let slotDateStr: string;
        if (data.date && typeof data.date.toDate === 'function') {
          slotDateStr = data.date.toDate().toISOString().split('T')[0];
        } else {
          slotDateStr = data.date as string;
        }
        return {
          id: docSnap.id,
          date: slotDateStr,
          start_time: data.start_time,
          end_time: data.end_time,
          volunteers: data.volunteers || []
        };
      });
      setTimeSlots(formattedSlots);
    });
    return () => unsubscribe();
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
  const calculateTimeDifference = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    if (endHour < startHour || endHour === 0 && startHour > 0) {
      endHour += 24;
    }
    let diffHours = endHour - startHour;
    let diffMinutes = endMinute - startMinute;
    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }
    return diffHours + diffMinutes / 60;
  };
  const calculateUserTotalHours = (userFullName: string): number => {
    return timeSlots.reduce((totalHours, slot) => {
      if (slot.volunteers && slot.volunteers.includes(userFullName)) {
        const hours = calculateTimeDifference(slot.start_time, slot.end_time);
        return totalHours + hours;
      }
      return totalHours;
    }, 0);
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
  const handleSlotsChange = async (userId: string, newSlots: number) => {
    if (newSlots < 0) {
      toast({
        variant: "destructive",
        title: "Valor inválido",
        description: "O limite deve ser um número maior ou igual a 0."
      });
      return;
    }
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        maxSlots: newSlots
      });
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {
        ...u,
        maxSlots: newSlots
      } : u));
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
    }
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
    const matchesSearch = rank.includes(searchTerm) || warName.includes(searchTerm) || email.includes(searchTerm);
    const matchesVolunteerFilter = showVolunteersOnly ? user.isVolunteer : true;
    return matchesSearch && matchesVolunteerFilter;
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
            
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2">
                <Switch id="volunteers-only" checked={showVolunteersOnly} onCheckedChange={setShowVolunteersOnly} className="data-[state=checked]:bg-blue-600" />
                <Label htmlFor="volunteers-only" className="text-sm font-medium text-muted-foreground whitespace-nowrap">Voluntários</Label>
              </div>
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
              {filteredUsers.map(user => {
            const userFullName = `${user.rank || ''} ${user.warName}`.trim();
            const totalHours = calculateUserTotalHours(userFullName);
            const formattedHours = totalHours % 1 === 0 ? totalHours.toString() : totalHours.toFixed(1);
            return <div key={user.id} className={`
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
                          {totalHours > 0 && <p className="text-xs text-blue-600 font-medium">
                              Total: {formattedHours}h
                            </p>}
                        </div>
                      </div>
                    </div>

                    {/* Controles */}
                    <div className="flex items-center gap-4 ml-4">
                      {/* Limite de serviços */}
                      <div className="flex items-center gap-2">
                        
                        <Input type="number" min="0" value={user.maxSlots || 1} onChange={e => handleSlotsChange(user.id, parseInt(e.target.value) || 0)} className="w-16 h-8 text-center" />
                      </div>

                      {/* Switch de voluntário */}
                      <div className="flex items-center gap-3">
                        <Switch id={`volunteer-switch-${user.id}`} checked={!!user.isVolunteer} onCheckedChange={() => handleToggleVolunteer(user)} className="data-[state=checked]:bg-green-600" />
                      </div>
                    </div>
                  </div>;
          })}
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default VolunteersManager;