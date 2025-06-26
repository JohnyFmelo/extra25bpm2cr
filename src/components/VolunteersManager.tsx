import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, writeBatch, query, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Search, UserPlus, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VolunteerServicesDialog from "./VolunteerServicesDialog";
import ConvocacaoConfigDialog from "./ConvocacaoConfigDialog";
import { useConvocation } from "@/hooks/useConvocation";

interface User {
  id: string;
  email: string;
  warName: string;
  rank?: string;
  isVolunteer?: boolean;
  maxSlots?: number;
  SouVoluntario?: boolean | null;
  dataResposta?: string | null;
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
  const [showNonVolunteersOnly, setShowNonVolunteersOnly] = useState(false);
  const [bulkSlotsValue, setBulkSlotsValue] = useState(1);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null);
  const [showServicesDialog, setShowServicesDialog] = useState(false);
  const [showConvocacaoConfigDialog, setShowConvocacaoConfigDialog] = useState(false);
  const { toast } = useToast();
  const { iniciarConvocacao, showConvocacao, convocacaoDeadline, activeConvocation, cancelConvocation } = useConvocation();
  const [timeLeft, setTimeLeft] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    // Listen to users collection for real-time updates
    const usersCollection = collection(db, "users");
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const usersData = snapshot.docs.map(userDoc => ({
        id: userDoc.id,
        ...userDoc.data(),
        isVolunteer: userDoc.data().isVolunteer ?? false,
        maxSlots: userDoc.data().maxSlots ?? 1,
        SouVoluntario: userDoc.data().SouVoluntario ?? null,
        dataResposta: userDoc.data().dataResposta ?? null
      }) as User).sort((a, b) => (a.warName || "").localeCompare(b.warName || ""));
      
      setUsers(usersData);
      setIsLoading(false);
    });

    // Listen to timeSlots for real-time updates
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection);
    const unsubscribeSlots = onSnapshot(q, snapshot => {
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

    return () => {
      unsubscribe();
      unsubscribeSlots();
    };
  }, []);

  // Update timer for active convocation
  useEffect(() => {
    if (!convocacaoDeadline) {
      setTimeLeft("");
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(convocacaoDeadline).getTime();
      const difference = deadlineTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes} minutos`);
        }
      } else {
        setTimeLeft("Prazo expirado");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [convocacaoDeadline]);

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

  const calculateUserServiceCount = (userFullName: string): number => {
    return timeSlots.reduce((count, slot) => {
      if (slot.volunteers && slot.volunteers.includes(userFullName)) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  const handleToggleVolunteer = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.id);
      const newIsVolunteerStatus = !user.isVolunteer;
      await updateDoc(userRef, {
        isVolunteer: newIsVolunteerStatus
      });
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

  const handleBulkSlotsUpdate = async () => {
    if (filteredUsers.length === 0) {
      toast({
        title: "Nenhum usuário visível",
        description: "A busca atual não retornou resultados para atualizar."
      });
      return;
    }
    if (bulkSlotsValue < 0) {
      toast({
        variant: "destructive",
        title: "Valor inválido",
        description: "O limite deve ser um número maior ou igual a 0."
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
          maxSlots: bulkSlotsValue
        });
      });
      await batch.commit();
      toast({
        title: "Limites atualizados",
        description: `${filteredUsers.length} usuários tiveram o limite atualizado para ${bulkSlotsValue}.`
      });
    } catch (error) {
      console.error("Error during bulk slots update:", error);
      toast({
        variant: "destructive",
        title: "Erro na atualização em massa",
        description: "Não foi possível atualizar os limites."
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleServiceCountClick = (userFullName: string) => {
    setSelectedVolunteer(userFullName);
    setShowServicesDialog(true);
  };

  const handleConvocacaoClick = () => {
    setShowConvocacaoConfigDialog(true);
  };

  const handleCancelConvocation = async () => {
    if (activeConvocation?.id) {
      await cancelConvocation(activeConvocation.id);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchTerm = searchQuery.toLowerCase();
    const rank = (user.rank || '').toLowerCase();
    const warName = (user.warName || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const matchesSearch = rank.includes(searchTerm) || warName.includes(searchTerm) || email.includes(searchTerm);
    let matchesVolunteerFilter = true;
    if (showVolunteersOnly && showNonVolunteersOnly) {
      matchesVolunteerFilter = true;
    } else if (showVolunteersOnly) {
      matchesVolunteerFilter = user.isVolunteer;
    } else if (showNonVolunteersOnly) {
      matchesVolunteerFilter = !user.isVolunteer;
    }
    return matchesSearch && matchesVolunteerFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 px-0">
      <style>{`
        .military-item-v2 {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          position: relative;
          border-left: 4px solid #ddd;
          transition: all 0.2s ease;
        }

        .military-item-v2.volunteer {
          border-left-color: #00b894;
          background: linear-gradient(90deg, rgba(0, 184, 148, 0.05) 0%, white 20%);
        }

        .military-item-v2.convocation-volunteer {
          border-left-color: #e17055;
          background: linear-gradient(90deg, rgba(225, 112, 85, 0.1) 0%, white 20%);
        }

        .volunteer-indicator {
          position: absolute;
          top: 8px;
          right: 12px;
          width: 8px;
          height: 8px;
          background: #00b894;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(0, 184, 148, 0.2);
        }

        .convocation-indicator {
          position: absolute;
          top: 8px;
          right: 12px;
          width: 8px;
          height: 8px;
          background: #e17055;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(225, 112, 85, 0.2);
        }
      `}</style>

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

        <CardContent className="space-y-6 px-6">
          {/* Seção de busca */}
          <div className="relative flex items-center">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input 
              placeholder="Pesquisar por nome, posto ou e-mail..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-10 h-11 w-full" 
            />
          </div>

          {/* Status da Convocação Ativa */}
          {convocacaoDeadline && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-800">CONVOCAÇÃO ATIVA</span>
                  </div>
                  <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                    🚨 EXTRAORDINÁRIO
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono text-sm font-semibold">
                      {timeLeft || "Calculando..."}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelConvocation}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Cancelar Convocação
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-sm text-orange-700">
                Convocação para serviço extraordinário em andamento. Prazo para resposta dos militares.
              </div>
            </div>
          )}

          {/* Estatísticas e ações em massa */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 space-y-4">
            {/* Estatísticas */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-800">Total: {filteredUsers.length} usuários</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-700">Voluntários: {filteredUsers.filter(u => u.isVolunteer).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="font-medium text-gray-600">Não Voluntários: {filteredUsers.filter(u => !u.isVolunteer).length}</span>
              </div>
              {convocacaoDeadline && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="font-medium text-orange-700">
                      Aceitaram Convocação: {filteredUsers.filter(u => u.SouVoluntario === true).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-red-700">
                      Recusaram Convocação: {filteredUsers.filter(u => u.SouVoluntario === false).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="font-medium text-gray-700">
                      Sem Resposta: {filteredUsers.filter(u => u.SouVoluntario === null).length}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-blue-200">
              <div className="flex items-center gap-2">
                <Switch 
                  id="volunteers-only" 
                  checked={showVolunteersOnly} 
                  onCheckedChange={setShowVolunteersOnly} 
                  className="data-[state=checked]:bg-blue-600" 
                />
                <Label htmlFor="volunteers-only" className="text-sm font-medium text-blue-700 whitespace-nowrap">
                  Voluntários
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch 
                  id="non-volunteers-only" 
                  checked={showNonVolunteersOnly} 
                  onCheckedChange={setShowNonVolunteersOnly} 
                  className="data-[state=checked]:bg-blue-600" 
                />
                <Label htmlFor="non-volunteers-only" className="text-sm font-medium text-blue-700 whitespace-nowrap">
                  Não Voluntários
                </Label>
              </div>
            </div>
            
            {/* Ações em massa */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-blue-200">
              <Button
                onClick={() => handleToggleAllVolunteers(true)}
                disabled={isBulkUpdating}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isBulkUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Tornar Todos Voluntários
              </Button>
              
              <Button
                onClick={() => handleToggleAllVolunteers(false)}
                disabled={isBulkUpdating}
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {isBulkUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Remover Todos como Voluntários
              </Button>
              
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={bulkSlotsValue}
                  onChange={e => setBulkSlotsValue(parseInt(e.target.value) || 1)}
                  className="w-20 h-8"
                  min="0"
                />
                <Button
                  onClick={handleBulkSlotsUpdate}
                  disabled={isBulkUpdating}
                  size="sm"
                  variant="outline"
                >
                  {isBulkUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Aplicar Limite
                </Button>
              </div>
              
              <Button
                onClick={handleConvocacaoClick}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Nova Convocação
              </Button>
            </div>
          </div>

          {/* Lista de usuários */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {filteredUsers.map((user) => {
              const userFullName = `${user.rank || ''} ${user.warName || ''}`.trim();
              const serviceCount = calculateUserServiceCount(userFullName);
              const totalHours = calculateUserTotalHours(userFullName);
              
              const isConvocationVolunteer = user.SouVoluntario === true;
              const hasConvocationResponse = user.SouVoluntario !== null;

              return (
                <div
                  key={user.id}
                  className={`military-item-v2 ${
                    user.isVolunteer ? 'volunteer' : ''
                  } ${isConvocationVolunteer ? 'convocation-volunteer' : ''}`}
                >
                  {user.isVolunteer && <div className="volunteer-indicator"></div>}
                  {isConvocationVolunteer && <div className="convocation-indicator"></div>}
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-2">
                      <div className="font-semibold text-gray-800 text-sm">
                        {user.rank} {user.warName}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      {user.isVolunteer && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Voluntário
                          </span>
                        </div>
                      )}
                      {convocacaoDeadline && hasConvocationResponse && (
                        <div className="mt-1">
                          {isConvocationVolunteer ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aceitou Convocação
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Recusou Convocação
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-700">Serviços</div>
                      <button
                        onClick={() => handleServiceCountClick(userFullName)}
                        className="text-lg font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {serviceCount}
                      </button>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-700">Horas</div>
                      <div className="text-lg font-bold text-green-600">
                        {totalHours.toFixed(1)}h
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <Switch
                        id={`volunteer-${user.id}`}
                        checked={user.isVolunteer}
                        onCheckedChange={() => handleToggleVolunteer(user)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>

                    <div className="flex items-center justify-center">
                      <Input
                        type="number"
                        value={user.maxSlots || 1}
                        onChange={e => handleSlotsChange(user.id, parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {showServicesDialog && selectedVolunteer && (
        <VolunteerServicesDialog
          open={showServicesDialog}
          onOpenChange={setShowServicesDialog}
          volunteerName={selectedVolunteer}
        />
      )}

      {showConvocacaoConfigDialog && (
        <ConvocacaoConfigDialog
          open={showConvocacaoConfigDialog}
          onOpenChange={setShowConvocacaoConfigDialog}
        />
      )}
    </div>
  );
};

export default VolunteersManager;
