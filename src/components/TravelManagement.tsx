import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { collection, addDoc, onSnapshot, query, getDoc, doc, updateDoc, deleteDoc, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Archive, Plus, Lock, LockOpen, Info, X, MapPin } from "lucide-react";
import { Switch } from "./ui/switch";
import { CalendarDays, Users, Clock, Calendar, Navigation } from "lucide-react";
import UserSelectionDialog from "./UserSelectionDialog";

interface Travel {
  id: string;
  startDate: string;
  endDate: string;
  slots: number;
  destination: string;
  dailyAllowance?: number | null;
  dailyRate?: number | null;
  halfLastDay: boolean;
  volunteers: string[];
  selectedVolunteers?: string[];
  archived: boolean;
  isLocked?: boolean;
}

export const TravelManagement = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [slots, setSlots] = useState("");
  const [destination, setDestination] = useState("");
  const [dailyAllowance, setDailyAllowance] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [halfLastDay, setHalfLastDay] = useState(false);
  const [travels, setTravels] = useState<Travel[]>([]);
  const [volunteerCounts, setVolunteerCounts] = useState<{
    [key: string]: number;
  }>({});
  const [diaryCounts, setDiaryCounts] = useState<{
    [key: string]: number;
  }>({});
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);
  const [expandedTravels, setExpandedTravels] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRankingRules, setShowRankingRules] = useState(false);
  const [selectedVolunteers, setSelectedVolunteers] = useState<{
    [travelId: string]: string[];
  }>({});
  const [isUserSelectionDialogOpen, setIsUserSelectionDialogOpen] = useState(false);
  const [currentTravelId, setCurrentTravelId] = useState<string | null>(null);

  const {
    toast
  } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.userType === "admin";

  useEffect(() => {
    const travelsRef = collection(db, "travels");
    const q = query(travelsRef);
    const unsubscribe = onSnapshot(q, snapshot => {
      const counts: {
        [key: string]: number;
      } = {};
      const diaryCount: {
        [key: string]: number;
      } = {};
      const today = new Date();
      snapshot.docs.forEach(doc => {
        const travel = doc.data() as Travel;
        const travelStart = new Date(travel.startDate + "T00:00:00");
        const travelEnd = new Date(travel.endDate + "T00:00:00");

        // Update filter to match the Index page: only count trips that are either:
        // 1. In transit (current) OR
        // 2. Open (future without lock) OR 
        // 3. Past (already happened)
        if (today >= travelStart && today <= travelEnd ||
        // In transit
        today < travelStart && !travel.isLocked ||
        // Open without lock
        today > travelEnd) {
          // Past
          const finalList = travel.selectedVolunteers && travel.selectedVolunteers.length > 0 ? travel.selectedVolunteers : travel.volunteers || [];
          finalList.forEach((volunteer: string) => {
            counts[volunteer] = (counts[volunteer] || 0) + 1;
            const days = differenceInDays(travelEnd, travelStart) + 1;
            const diaryDays = travel.halfLastDay ? days - 0.5 : days;
            diaryCount[volunteer] = (diaryCount[volunteer] || 0) + diaryDays;
          });
        }
      });
      setVolunteerCounts(counts);
      setDiaryCounts(diaryCount);
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const q = query(collection(db, "travels"));
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const travelsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Travel[];
      setTravels(travelsData);
    });
    return () => unsubscribe();
  }, []);
  const handleCreateTravel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTravel) {
        const travelRef = doc(db, "travels", editingTravel.id);
        await updateDoc(travelRef, {
          startDate,
          endDate,
          slots: Number(slots),
          destination,
          dailyAllowance: dailyAllowance ? Number(dailyAllowance) : null,
          dailyRate: dailyRate ? Number(dailyRate) : null,
          halfLastDay,
          updatedAt: new Date(),
          archived: editingTravel.archived || false
        });
        toast({
          title: "Sucesso",
          description: "Viagem atualizada com sucesso!"
        });
        setEditingTravel(null);
      } else {
        await addDoc(collection(db, "travels"), {
          startDate,
          endDate,
          slots: Number(slots),
          destination,
          dailyAllowance: dailyAllowance ? Number(dailyAllowance) : null,
          dailyRate: dailyRate ? Number(dailyRate) : null,
          halfLastDay,
          createdAt: new Date(),
          volunteers: [],
          selectedVolunteers: [],
          archived: false,
          isLocked: false
        });
        toast({
          title: "Sucesso",
          description: "Viagem criada com sucesso!"
        });
      }
      setStartDate("");
      setEndDate("");
      setSlots("");
      setDestination("");
      setDailyAllowance("");
      setDailyRate("");
      setHalfLastDay(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating/updating travel:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar viagem.",
        variant: "destructive"
      });
    }
  };
  const handleEditTravel = (travel: Travel) => {
    setEditingTravel(travel);
    setStartDate(travel.startDate);
    setEndDate(travel.endDate);
    setSlots(String(travel.slots));
    setDestination(travel.destination);
    setDailyAllowance(String(travel.dailyAllowance || ""));
    setDailyRate(String(travel.dailyRate || ""));
    setHalfLastDay(travel.halfLastDay || false);
    setIsModalOpen(true);
  };
  const handleDeleteTravel = async (travelId: string) => {
    try {
      await deleteDoc(doc(db, "travels", travelId));
      toast({
        title: "Sucesso",
        description: "Viagem excluída com sucesso!"
      });
    } catch (error) {
      console.error("Error deleting travel:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir viagem.",
        variant: "destructive"
      });
    }
  };
  const handleArchive = async (travelId: string, archived: boolean) => {
    try {
      const travelRef = doc(db, "travels", travelId);
      await updateDoc(travelRef, {
        archived
      });
      toast({
        title: "Sucesso",
        description: archived ? "Viagem arquivada com sucesso!" : "Viagem desarquivada com sucesso!"
      });
    } catch (error) {
      console.error("Error archiving travel:", error);
      toast({
        title: "Erro",
        description: "Erro ao arquivar a viagem.",
        variant: "destructive"
      });
    }
  };
  const handleVolunteer = async (travelId: string) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const volunteerInfo = `${user.rank} ${user.warName}`;
      if (!volunteerInfo) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado. Por favor, faça login novamente.",
          variant: "destructive"
        });
        return;
      }
      const travelRef = doc(db, "travels", travelId);
      const travelSnap = await getDoc(travelRef);
      if (!travelSnap.exists()) {
        throw new Error("Viagem não encontrada");
      }
      const travelData = travelSnap.data() as Travel;
      const currentVolunteers = Array.isArray(travelData.volunteers) ? travelData.volunteers : [];
      if (currentVolunteers.includes(volunteerInfo)) {
        const updatedVolunteers = currentVolunteers.filter(v => v !== volunteerInfo);
        await updateDoc(travelRef, {
          volunteers: updatedVolunteers
        });
        toast({
          title: "Sucesso",
          description: "Você desistiu da viagem com sucesso."
        });
        return;
      }
      const updatedVolunteers = [...currentVolunteers, volunteerInfo];
      await updateDoc(travelRef, {
        volunteers: updatedVolunteers
      });
      toast({
        title: "Sucesso",
        description: "Você se candidatou com sucesso!"
      });
    } catch (error) {
      console.error("Error volunteering:", error);
      toast({
        title: "Erro",
        description: "Erro ao se candidatar.",
        variant: "destructive"
      });
    }
  };
  const handleToggleLock = async (travelId: string) => {
    try {
      const travelRef = doc(db, "travels", travelId);
      const travelSnap = await getDoc(travelRef);
      if (!travelSnap.exists()) return;
      const travelData = travelSnap.data() as Travel;
      const isCurrentlyLocked = travelData.isLocked ?? false;
      if (!isCurrentlyLocked) {
        const allVolunteers = travelData.volunteers ?? [];
        const manualSelections = selectedVolunteers[travelId] || [];

        // Volunteers to process are those who are not manually selected yet
        const autoSelectVolunteers = allVolunteers.filter(v => !manualSelections.includes(v));
        const processed = autoSelectVolunteers.map(volunteer => {
          const rank = getVolunteerRank(volunteer); // Usando a nova função
          return {
            fullName: volunteer,
            rank,
            diaryCount: diaryCounts[volunteer] || 0,
            rankWeight: getMilitaryRankWeight(rank),
            appliedAtIndex: allVolunteers.indexOf(volunteer),
            originalIndex: allVolunteers.indexOf(volunteer)
          };
        });
        processed.sort((a, b) => {
          if (a.diaryCount !== b.diaryCount) {
            return a.diaryCount - b.diaryCount;
          }
          if (a.rankWeight !== b.rankWeight) {
            return b.rankWeight - a.rankWeight;
          }
          return a.originalIndex - b.originalIndex;
        });

        // Take slots after considering manual selections
        const availableSlots = Math.max(0, (travelData.slots || 0) - manualSelections.length);
        const autoSelectedVolunteers = processed.slice(0, availableSlots);

        // Combine manual and auto selected volunteers
        const finalSelectedVolunteers = [...manualSelections, ...autoSelectedVolunteers.map(v => v.fullName)];
        await updateDoc(travelRef, {
          isLocked: true,
          selectedVolunteers: finalSelectedVolunteers
        });
      } else {
        await updateDoc(travelRef, {
          isLocked: false,
          selectedVolunteers: []
        });
        setSelectedVolunteers(prev => {
          const updatedSelections = {
            ...prev
          };
          delete updatedSelections[travelId];
          return updatedSelections;
        });
      }
      toast({
        title: "Sucesso",
        description: !isCurrentlyLocked ? "Viagem bloqueada e diárias processadas!" : "Viagem reaberta!"
      });
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar o status da viagem.",
        variant: "destructive"
      });
    }
  };
  const cbSdRanks = ["Sd", "Sd PM", "Cb", "Cb PM"];
  const stSgtRanks = ["3° Sgt", "3° Sgt PM", "2° Sgt", "2�� Sgt PM", "1° Sgt", "1° Sgt PM", "Sub Ten", "Sub Ten PM"];
  const oficiaisRanks = ["2° Ten", "2° Ten PM", "1° Ten", "1° Ten PM", "Cap", "Cap PM", "Maj", "Maj PM", "Ten Cel", "Ten Cel PM", "Cel", "Cel PM"];

  // Nova função para extrair a patente corretamente
  const getVolunteerRank = (volunteerFullName: string): string => {
    const parts = volunteerFullName.split(" ");
    if (parts.length >= 2 && (parts[1] === "Sgt" || parts[1] === "Ten")) {
      return `${parts[0]} ${parts[1]}${parts[2] ? ` ${parts[2]}` : ''}`.trim(); // Para patentes como "1° Sgt PM" ou "Sub Ten"
    }
    return parts[0]; // Para outras patentes (ex: "Cel", "Cb", "Sd")
  };
  const getMilitaryRankWeight = (rank: string): number => {
    if (cbSdRanks.includes(rank)) return 1;
    if (stSgtRanks.includes(rank)) return 2;
    if (oficiaisRanks.includes(rank)) return 3;
    return 0; // Retorna 0 para patentes desconhecidas
  };
  const formattedTravelCount = (count: number) => {
    return count === 1 ? "1 viagem" : `${count} viagens`;
  };
  const formattedDiaryCount = (count: number) => {
    const formattedCount = count.toLocaleString("pt-BR", {
      minimumFractionDigits: count % 1 !== 0 ? 1 : 0,
      maximumFractionDigits: 1
    });
    return `${formattedCount} ${count === 1 ? 'diária' : 'diárias'}`;
  };
  const getSortedVolunteers = (travel: Travel): {
    fullName: string;
    rank: string;
    diaryCount: number;
    rankWeight: number;
    appliedAtIndex: number;
    originalIndex: number;
    isSelected: boolean;
    isManual: boolean;
  }[] => {
    const baseList = travel.isLocked ? travel.selectedVolunteers || [] : travel.volunteers || [];
    const manualSelections = selectedVolunteers[travel.id] || [];
    const processed = baseList.map(volunteer => {
      const rank = getVolunteerRank(volunteer); // Usando a nova função
      return {
        fullName: volunteer,
        rank,
        diaryCount: diaryCounts[volunteer] || 0,
        rankWeight: getMilitaryRankWeight(rank),
        appliedAtIndex: (travel.volunteers || []).indexOf(volunteer),
        originalIndex: (travel.volunteers || []).indexOf(volunteer),
        isManuallySelected: manualSelections.includes(volunteer) // Check if manually selected
      };
    });
    const totalSlots = travel.slots || 1;
    const isLocked = travel.isLocked;

    // Filter out manually selected to auto-select the rest
    const autoSelectCandidates = processed.filter(v => !v.isManuallySelected);
    autoSelectCandidates.sort((a, b) => {
      if (a.diaryCount !== b.diaryCount) {
        return a.diaryCount - b.diaryCount;
      }
      if (a.rankWeight !== b.rankWeight) {
        return b.rankWeight - a.rankWeight;
      }
      return a.originalIndex - b.originalIndex;
    });
    const autoSelectedNames = autoSelectCandidates.slice(0, Math.max(0, totalSlots - manualSelections.length)).map(v => v.fullName);
    return processed.map(item => {
      const isSelected = item.isManuallySelected || (isLocked ? travel.selectedVolunteers?.includes(item.fullName) : autoSelectedNames.includes(item.fullName));
      const isManual = item.isManuallySelected;
      return {
        ...item,
        isSelected,
        isManual
      };
    });
  };
  const toggleExpansion = (travelId: string) => {
    setExpandedTravels(prev => prev.includes(travelId) ? prev.filter(id => id !== travelId) : [...prev, travelId]);
  };
  const handleRemoveVolunteer = async (travelId: string, volunteerName: string) => {
    try {
      const travelRef = doc(db, "travels", travelId);
      const travelSnap = await getDoc(travelRef);
      if (!travelSnap.exists()) {
        throw new Error("Viagem não encontrada");
      }
      const travelData = travelSnap.data() as Travel;
      const updatedVolunteers = travelData.volunteers.filter(v => v !== volunteerName);
      await updateDoc(travelRef, {
        volunteers: updatedVolunteers
      });
      toast({
        title: "Sucesso",
        description: "Voluntário removido da viagem."
      });
    } catch (error) {
      console.error("Erro ao remover voluntário:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover voluntário da viagem.",
        variant: "destructive"
      });
    }
  };
  const handleManualVolunteerSelection = async (travelId: string, volunteerName: string, slots: number) => {
    const currentManualSelections = selectedVolunteers[travelId] || [];
    const isAlreadySelectedManually = currentManualSelections.includes(volunteerName);
    if (isAlreadySelectedManually) {
      // Deselect if already manually selected
      setSelectedVolunteers(prev => ({
        ...prev,
        [travelId]: currentManualSelections.filter(name => name !== volunteerName)
      }));
    } else {
      if (currentManualSelections.length < slots) {
        // Select if not already selected and within slot limit
        setSelectedVolunteers(prev => ({
          ...prev,
          [travelId]: [...currentManualSelections, volunteerName]
        }));
      } else {
        // Show toast if trying to exceed slot limit - using 'destructive' instead of 'warning'
        toast({
          title: "Limite de vagas atingido",
          description: `Você já selecionou o número máximo de ${slots} voluntários para esta viagem.`,
          variant: "destructive"
        });
      }
    }
  };
  const handleAddVolunteersManually = (travelId: string) => {
    setCurrentTravelId(travelId);
    setIsUserSelectionDialogOpen(true);
  };

  const handleVolunteersSelected = async (selectedUsers: string[]) => {
    if (!currentTravelId) return;
    
    try {
      const travelRef = doc(db, "travels", currentTravelId);
      const travelSnap = await getDoc(travelRef);
      
      if (!travelSnap.exists()) {
        throw new Error("Viagem não encontrada");
      }
      
      const travelData = travelSnap.data() as Travel;
      const currentVolunteers = Array.isArray(travelData.volunteers) ? travelData.volunteers : [];
      
      // Add new volunteers (that aren't already in the list)
      const newVolunteers = selectedUsers.filter(user => !currentVolunteers.includes(user));
      const updatedVolunteers = [...currentVolunteers, ...newVolunteers];
      
      await updateDoc(travelRef, {
        volunteers: updatedVolunteers
      });
      
      toast({
        title: "Sucesso",
        description: `${newVolunteers.length} voluntários adicionados à viagem.`
      });
    } catch (error) {
      console.error("Error adding volunteers:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar voluntários.",
        variant: "destructive"
      });
    }
  };

  return <>
      {showRankingRules && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="p-6 bg-white shadow-xl max-w-md w-full relative border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Regras de Ordenação</h2>
            <ol className="list-decimal list-inside text-sm space-y-2 text-gray-600">
              <li>Menor quantidade de diárias primeiro (quem tem menos diárias acumuladas, fica no topo).</li>
              <li>Em caso de empate na quantidade de diárias:
                <ol type="a" className="list-decimal list-inside text-sm space-y-2 text-gray-600 ml-4">
                  <li>Graduação mais antiga (maior peso) fica acima.</li>
                  <li>Se ainda persistir o empate, a ordem de inscrição (quem se inscreveu primeiro) define a ordem.</li>
                </ol>
              </li>
            </ol>
            <Button className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setShowRankingRules(false)}>
              Fechar
            </Button>
          </Card>
        </div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 px-0 mx-0">
        {travels.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(travel => {
        const travelStart = new Date(travel.startDate + "T00:00:00");
        const travelEnd = new Date(travel.endDate + "T00:00:00");
        const today = new Date();
        const isLocked = travel.isLocked;

        // Skip displaying travels with "Processing diary" status
        // Only show "em aberto" (not locked future trips) or "em transito" (current trips)
        const isInTransit = today >= travelStart && today <= travelEnd;
        const isOpen = today < travelStart && !isLocked;
        if (!(isInTransit || isOpen) && travel.archived) {
          return null; // Skip rendering this trip
        }
        const sortedVolunteers = getSortedVolunteers(travel);
        const numDays = differenceInDays(travelEnd, travelStart) + 1;
        const dailyCount = travel.halfLastDay ? numDays - 0.5 : numDays;
        const formattedCount = dailyCount.toLocaleString("pt-BR", {
          minimumFractionDigits: dailyCount % 1 !== 0 ? 1 : 0,
          maximumFractionDigits: 1
        });
        const totalCost = travel.dailyRate ? dailyCount * Number(travel.dailyRate) : 0;
        let cardBg = "bg-white";
        let statusBadge = null;
        const rightPos = isAdmin ? "right-12" : "right-2";
        if (isOpen) {
          statusBadge = <div className={`absolute top-3 ${rightPos} bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 text-xs rounded-full shadow-sm flex items-center gap-2`}>
                    Em aberto
                    <X className="h-3 w-3 ml-1" />
                    <button onClick={e => {
              e.stopPropagation();
              setShowRankingRules(true);
            }} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                      <Info className="h-3 w-3" />
                    </button>
                  </div>;
        } else if (isInTransit) {
          cardBg = "bg-gradient-to-br from-green-50 to-green-100";
          statusBadge = <div className={`absolute top-3 ${rightPos} bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 text-xs rounded-full shadow-sm`}>
                  Em trânsito
                </div>;
        } else if (today > travelEnd) {
          cardBg = "bg-gradient-to-br from-gray-50 to-gray-100";
          statusBadge = <div className={`absolute top-3 ${rightPos} bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1.5 text-xs rounded-full shadow-sm`}>
                  Encerrada
                </div>;
        }
        return <Card key={travel.id} className={`relative overflow-hidden ${cardBg} border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 ${travel.archived ? "opacity-75" : ""}`}>
                {statusBadge}

                {isAdmin && <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-black/5">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleEditTravel(travel)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 gap-2" onClick={() => handleDeleteTravel(travel.id)}>
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchive(travel.id, true)} className="gap-2">
                        <Archive className="h-4 w-4" />
                        Arquivar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleLock(travel.id)} className="gap-2">
                        {isLocked ? <>
                            <LockOpen className="h-4 w-4" />
                            Reabrir vagas
                          </> : <>
                            <Lock className="h-4 w-4" />
                            Processar diária
                          </>}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>}

                <div className="p-4" onClick={() => toggleExpansion(travel.id)}>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-blue-900">
                        {travel.destination}
                      </h3>
                      <div className="space-y-2 text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <p>{travel.destination}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <p>{isInTransit ? 'Período: ' : 'Início: '}
                            {travelStart.toLocaleDateString()}
                            {isInTransit && ` até ${travelEnd.toLocaleDateString()}`}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <p>Vagas: {travel.slots}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <p>{formattedCount} diárias
                            {travel.dailyRate && totalCost > 0 && <span className="text-blue-600 font-medium ml-1">
                                ({totalCost.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })})
                              </span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    {sortedVolunteers.length > 0 && <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-700">Voluntários:</h4>
                          
                          {/* Add the "+" icon button here */}
                          {isAdmin && !travel.isLocked && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-1 rounded-full hover:bg-blue-50 text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddVolunteersManually(travel.id);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {sortedVolunteers.map(vol => <div key={vol.fullName} className={`text-sm p-2 rounded-lg flex justify-between items-center ${vol.isSelected ? 'bg-green-50 border border-green-200' : vol.isManual ? 'bg-blue-100 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`} onDoubleClick={() => {
                    if (isAdmin && !travel.isLocked) {
                      handleManualVolunteerSelection(travel.id, vol.fullName, travel.slots);
                    }
                  }}>
                              <div className="flex items-center gap-2">
                                {vol.isSelected && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                                <span className={`${vol.isSelected ? "font-medium text-green-900" : vol.isManual ? 'text-blue-900 font-medium' : "text-gray-700"}`}>
                                  {vol.fullName}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs block ${vol.isSelected ? "text-green-700" : vol.isManual ? 'text-blue-700' : "text-gray-500"}`}>
                                  {formattedTravelCount(volunteerCounts[vol.fullName] || 0)}
                                </span>
                                <span className={`text-xs block ${vol.isSelected ? "text-green-700" : vol.isManual ? 'text-blue-700' : "text-gray-500"}`}>
                                  {formattedDiaryCount(diaryCounts[vol.fullName] || 0)}
                                </span>
                                {isAdmin && today < travelStart && !travel.isLocked && <Button variant="ghost" size="icon" className="hover:bg-red-100 rounded-full text-red-500" onClick={e => {
                        e.stopPropagation();
                        handleRemoveVolunteer(travel.id, vol.fullName);
                      }}>
                                    <X className="h-4 w-4" />
                                  </Button>}
                              </div>
                            </div>)}
                        </div>
                      </div>}

                    {today < travelStart && !travel.archived && !isLocked && <div className="mt-3">
                        <Button onClick={() => handleVolunteer(travel.id)} className={`w-full shadow-sm ${travel.volunteers?.includes(`${user.rank} ${user.warName}`) ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"} text-white font-medium`}>
                          {travel.volunteers?.includes(`${user.rank} ${user.warName}`) ? "Desistir" : "Quero ser Voluntário"}
                        </Button>
                      </div>}
                  </div>
                </div>
              </Card>;
      })}
      </div>

      {/* User Selection Dialog */}
      <UserSelectionDialog
        open={isUserSelectionDialogOpen}
        onOpenChange={setIsUserSelectionDialogOpen}
        onSelect={handleVolunteersSelected}
        title="Adicionar Voluntários"
      />

      {isAdmin && <Button onClick={() => setIsModalOpen(true)} className="fixed bottom-6 right-6 rounded-full p-4 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 my-[69px] mx-0 px-[18px] text-base py-[26px]">
          <Plus className="h-6 w-6" />
        </Button>}

      {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="p-6 bg-white shadow-lg max-w-lg w-full relative">
            <button onClick={() => {
          setIsModalOpen(false);
          setEditingTravel(null);
          setStartDate("");
          setEndDate("");
          setSlots("");
          setDestination("");
          setDailyAllowance("");
          setDailyRate("");
          setHalfLastDay(false);
        }} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-xl">
              ×
            </button>
            <form onSubmit={handleCreateTravel} className="space-y-6">
              <h2 className="text-2xl font-semibold text-primary">
                {editingTravel ? "Editar Viagem" : "Criar Nova Viagem"}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destino</Label>
                  <Input id="destination" type="text" value={destination} onChange={e => setDestination(e.target.value)} required placeholder="Digite o destino" className="w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data Inicial</Label>
                    <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data Final</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slots">Número de Vagas</Label>
                    <Input id="slots" type="number" value={slots} onChange={e => setSlots(e.target.value)} required min="1" className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dailyRate">Valor da Diária</Label>
                    <Input id="dailyRate" type="number" value={dailyRate} onChange={e => setDailyRate(e.target.value)} placeholder="Opcional" className="w-full" />
                  </div>
                </div>
                <div className="flex items-center">
                  <Label htmlFor="halfLastDay" className="mr-2 text-sm">
                    Último dia meia diária
                  </Label>
                  <Switch id="halfLastDay" checked={halfLastDay} onCheckedChange={setHalfLastDay} />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <Button type="submit" className="w-full md:w-auto">
                  {editingTravel ? "Salvar Alterações" : "Criar Viagem"}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
              setIsModalOpen(false);
              setEditingTravel(null);
              setStartDate("");
              setEndDate("");
              setSlots("");
              setDestination("");
              setDailyAllowance("");
              setDailyRate("");
              setHalfLastDay(false);
            }} className="w-full md:w-auto">
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>}
    </>;
};
export default TravelManagement;
