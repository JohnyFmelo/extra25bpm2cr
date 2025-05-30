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
import { MoreHorizontal, Edit, Trash2, Archive, Plus, Lock, LockOpen, Info, X, MapPin, UserPlus } from "lucide-react";
import { Switch } from "./ui/switch";
import { CalendarDays, Users, Clock, Calendar, Navigation } from "lucide-react";
import AddVolunteerDialog from "./AddVolunteerDialog";

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
  const [volunteerCounts, setVolunteerCounts] = useState<{ [key: string]: number; }>({});
  const [diaryCounts, setDiaryCounts] = useState<{ [key: string]: number; }>({});
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);
  const [expandedTravels, setExpandedTravels] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRankingRules, setShowRankingRules] = useState(false);
  const [selectedVolunteers, setSelectedVolunteers] = useState<{ [travelId: string]: string[]; }>({});
  const [addVolunteerDialogOpen, setAddVolunteerDialogOpen] = useState(false);
  const [selectedTravelId, setSelectedTravelId] = useState<string>("");

  const { toast } = useToast();
  
  // Garanta que 'user' no localStorage tenha 'userType: "admin"' para isAdmin ser true
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.userType === "admin";

  useEffect(() => {
    const travelsRef = collection(db, "travels");
    const q = query(travelsRef);
    const unsubscribe = onSnapshot(q, snapshot => {
      const counts: { [key: string]: number; } = {};
      const diaryCount: { [key: string]: number; } = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      snapshot.docs.forEach(doc => {
        const travel = doc.data() as Travel;
        const travelStart = new Date(travel.startDate + "T00:00:00");
        const travelEnd = new Date(travel.endDate + "T00:00:00");

        if (
          (today < travelStart && travel.isLocked) || 
          (today >= travelStart && today <= travelEnd) ||
          (today > travelEnd)
        ) {
          const finalList =
            travel.isLocked && travel.selectedVolunteers && travel.selectedVolunteers.length > 0
              ? travel.selectedVolunteers
              : travel.volunteers || [];

          finalList.forEach((volunteer: string) => {
            counts[volunteer] = (counts[volunteer] || 0) + 1;
            if (travelEnd >= travelStart) {
                const days = differenceInDays(travelEnd, travelStart) + 1;
                const diaryDays = travel.halfLastDay ? days - 0.5 : days;
                diaryCount[volunteer] = (diaryCount[volunteer] || 0) + diaryDays;
            } else {
                diaryCount[volunteer] = (diaryCount[volunteer] || 0);
            }
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
    if (new Date(endDate) < new Date(startDate)) {
        toast({
            title: "Datas inválidas",
            description: "A data final não pode ser anterior à data inicial.",
            variant: "destructive",
        });
        return;
    }
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
          archived: editingTravel.archived || false,
        });
        toast({ title: "Sucesso", description: "Viagem atualizada com sucesso!" });
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
          isLocked: false,
        });
        toast({ title: "Sucesso", description: "Viagem criada com sucesso!" });
      }
      setStartDate(""); setEndDate(""); setSlots(""); setDestination("");
      setDailyAllowance(""); setDailyRate(""); setHalfLastDay(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating/updating travel:", error);
      toast({ title: "Erro", description: "Erro ao salvar viagem.", variant: "destructive" });
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
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta viagem permanentemente? Esta ação não pode ser desfeita.");
    if (!confirmDelete) {
        return;
    }
    try {
      await deleteDoc(doc(db, "travels", travelId));
      toast({ title: "Sucesso", description: "Viagem excluída com sucesso!" });
    } catch (error) {
      console.error("Error deleting travel:", error);
      toast({ title: "Erro", description: "Erro ao excluir viagem.", variant: "destructive" });
    }
  };

  const handleArchive = async (travelId: string, newArchivedState: boolean) => {
    try {
      const travelRef = doc(db, "travels", travelId);
      await updateDoc(travelRef, { archived: newArchivedState });
      toast({
        title: "Sucesso",
        description: newArchivedState ? "Viagem arquivada com sucesso!" : "Viagem desarquivada com sucesso!"
      });
    } catch (error) {
      console.error("Error archiving/unarchiving travel:", error);
      toast({ title: "Erro", description: "Erro ao arquivar/desarquivar a viagem.", variant: "destructive" });
    }
  };

  const handleVolunteer = async (travelId: string) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const volunteerInfo = `${currentUser.rank} ${currentUser.warName}`;
      if (!currentUser.rank || !currentUser.warName) {
        toast({ title: "Erro", description: "Usuário não encontrado. Faça login.", variant: "destructive" });
        return;
      }
      const travelRef = doc(db, "travels", travelId);
      const travelSnap = await getDoc(travelRef);
      if (!travelSnap.exists()) throw new Error("Viagem não encontrada");
      
      const travelData = travelSnap.data() as Travel;
      if (travelData.isLocked) {
        toast({ title: "Ação não permitida", description: "Viagem com diárias processadas. Não é possível se candidatar/desistir.", variant: "destructive" });
        return;
      }

      const currentVolunteers = Array.isArray(travelData.volunteers) ? travelData.volunteers : [];
      if (currentVolunteers.includes(volunteerInfo)) {
        const updatedVolunteers = currentVolunteers.filter(v => v !== volunteerInfo);
        await updateDoc(travelRef, { volunteers: updatedVolunteers });
        toast({ title: "Sucesso", description: "Você desistiu da viagem." });
      } else {
        const updatedVolunteers = [...currentVolunteers, volunteerInfo];
        await updateDoc(travelRef, { volunteers: updatedVolunteers });
        toast({ title: "Sucesso", description: "Você se candidatou com sucesso!" });
      }
    } catch (error) {
      console.error("Error volunteering:", error);
      toast({ title: "Erro", description: "Erro ao se candidatar/desistir.", variant: "destructive" });
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
        const autoSelectCandidates = allVolunteers.filter(v => !manualSelections.includes(v));
        
        const processed = autoSelectCandidates.map(volunteer => ({
          fullName: volunteer,
          rank: getVolunteerRank(volunteer),
          diaryCount: diaryCounts[volunteer] || 0,
          rankWeight: getMilitaryRankWeight(getVolunteerRank(volunteer)),
          originalIndex: allVolunteers.indexOf(volunteer)
        }));

        processed.sort((a, b) => {
          if (a.diaryCount !== b.diaryCount) return a.diaryCount - b.diaryCount;
          if (a.rankWeight !== b.rankWeight) return b.rankWeight - a.rankWeight;
          return a.originalIndex - b.originalIndex;
        });

        const availableSlots = Math.max(0, (travelData.slots || 0) - manualSelections.length);
        const autoSelectedVolunteers = processed.slice(0, availableSlots).map(v => v.fullName);
        const finalSelectedVolunteers = [...manualSelections, ...autoSelectedVolunteers];
        
        await updateDoc(travelRef, { isLocked: true, selectedVolunteers: finalSelectedVolunteers });
        toast({ title: "Sucesso", description: "Viagem bloqueada e diárias processadas!" });
      } else { 
        await updateDoc(travelRef, { isLocked: false, selectedVolunteers: [] });
        setSelectedVolunteers(prev => {
          const updated = { ...prev };
          delete updated[travelId];
          return updated;
        });
        toast({ title: "Sucesso", description: "Viagem reaberta!" });
      }
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast({ title: "Erro", description: "Erro ao alterar o status da viagem.", variant: "destructive" });
    }
  };

  const cbSdRanks = ["Sd", "Sd PM", "Cb", "Cb PM"];
  const stSgtRanks = ["3° Sgt", "3° Sgt PM", "2° Sgt", "2° Sgt PM", "1° Sgt", "1° Sgt PM", "Sub Ten", "Sub Ten PM"];
  const oficiaisRanks = ["2° Ten", "2° Ten PM", "1° Ten", "1° Ten PM", "Cap", "Cap PM", "Maj", "Maj PM", "Ten Cel", "Ten Cel PM", "Cel", "Cel PM"];

  const getVolunteerRank = (volunteerFullName: string): string => {
    if (!volunteerFullName || typeof volunteerFullName !== 'string') return "N/A";
    const parts = volunteerFullName.split(" ");
    if (parts.length >= 3 && (parts[1] === "Sgt" || parts[1] === "Ten") && parts[2] === "PM") {
        return `${parts[0]} ${parts[1]} ${parts[2]}`;
    }
    if (parts.length >= 2 && (parts[1] === "Sgt" || parts[1] === "Ten" || parts[0] === "Sub" || parts[0] === "Ten")) {
        const twoPartRank = `${parts[0]} ${parts[1]}`;
        if ([...stSgtRanks, ...oficiaisRanks].includes(twoPartRank)) return twoPartRank;
    }
    return parts[0];
  };
  
  const getMilitaryRankWeight = (rank: string): number => {
    if (cbSdRanks.includes(rank)) return 1;
    if (stSgtRanks.includes(rank)) return 2;
    if (oficiaisRanks.includes(rank)) return 3;
    return 0;
  };

  const formattedTravelCount = (count: number) => count === 1 ? "1 viagem" : `${count} viagens`;
  const formattedDiaryCount = (count: number) => {
    const fmtCount = count.toLocaleString("pt-BR", { minimumFractionDigits: count % 1 !== 0 ? 1 : 0, maximumFractionDigits: 1 });
    return `${fmtCount} ${count === 1 ? 'diária' : 'diárias'}`;
  };

  const getSortedVolunteers = (travel: Travel): {
    fullName: string; rank: string; diaryCount: number; rankWeight: number;
    originalIndex: number; isSelected: boolean; isManual: boolean;
  }[] => {
    const allRegisteredVolunteers = travel.volunteers || [];
    const manualSelectionsForThisTravel = selectedVolunteers[travel.id] || [];
    
    let displayList = allRegisteredVolunteers.map((volunteerName, index) => {
        const rank = getVolunteerRank(volunteerName);
        return {
            fullName: volunteerName,
            rank,
            diaryCount: diaryCounts[volunteerName] || 0,
            rankWeight: getMilitaryRankWeight(rank),
            originalIndex: index,
            isSelected: false, 
            isManual: manualSelectionsForThisTravel.includes(volunteerName),
        };
    });

    displayList.sort((a, b) => {
        if (!travel.isLocked) {
            if (a.isManual && !b.isManual) return -1;
            if (!a.isManual && b.isManual) return 1;
        }
        if (a.diaryCount !== b.diaryCount) return a.diaryCount - b.diaryCount;
        if (a.rankWeight !== b.rankWeight) return b.rankWeight - a.rankWeight;
        return a.originalIndex - b.originalIndex;
    });

    if (travel.isLocked) {
        const finalSelected = travel.selectedVolunteers || [];
        displayList = displayList.map(v => ({ ...v, isSelected: finalSelected.includes(v.fullName) }));
        displayList = displayList.filter(v => v.isSelected);
        displayList.sort((a,b) => {
            return finalSelected.indexOf(a.fullName) - finalSelected.indexOf(b.fullName);
        });

    } else {
        let slotsToFill = travel.slots || 0;
        let autoSelectedCount = 0;

        displayList = displayList.map(v => {
            let currentIsSelected = false;
            if (v.isManual) {
                currentIsSelected = true;
            } else if ((manualSelectionsForThisTravel.length + autoSelectedCount) < slotsToFill) {
                currentIsSelected = true;
                autoSelectedCount++;
            }
            return { ...v, isSelected: currentIsSelected };
        });
    }
    return displayList;
  };

  const toggleExpansion = (travelId: string) => {
    setExpandedTravels(prev => prev.includes(travelId) ? prev.filter(id => id !== travelId) : [...prev, travelId]);
  };

  const handleRemoveVolunteer = async (travelId: string, volunteerName: string) => {
    const confirmRemove = window.confirm(`Tem certeza que deseja remover "${volunteerName}" da lista de inscritos para esta viagem? Esta ação não remove o usuário do sistema.`);
    if (!confirmRemove) {
        return; 
    }

    try {
      const travelRef = doc(db, "travels", travelId);
      const travelSnap = await getDoc(travelRef);
      if (!travelSnap.exists()) throw new Error("Viagem não encontrada");
      const travelData = travelSnap.data() as Travel;

      if (travelData.isLocked) {
          toast({ title: "Ação não permitida", description: "Não é possível remover voluntários de uma viagem processada.", variant: "destructive" });
          return;
      }

      const updatedVolunteers = (travelData.volunteers || []).filter(v => v !== volunteerName);
      const currentManual = selectedVolunteers[travelId] || [];
      const updatedManual = currentManual.filter(name => name !== volunteerName);

      await updateDoc(travelRef, { volunteers: updatedVolunteers });
      setSelectedVolunteers(prev => ({ ...prev, [travelId]: updatedManual }));
      toast({ title: "Sucesso", description: "Voluntário removido da viagem." });
    } catch (error) {
      console.error("Erro ao remover voluntário:", error);
      toast({ title: "Erro", description: "Erro ao remover voluntário.", variant: "destructive" });
    }
  };

  const handleManualVolunteerSelection = async (travelId: string, volunteerName: string, slots: number) => {
    const travel = travels.find(t => t.id === travelId);
    if (!travel || travel.isLocked) {
        toast({ title: "Ação não permitida", description: "Não se pode selecionar manualmente para viagens processadas.", variant: "destructive" });
        return;
    }
    const currentManualSelections = selectedVolunteers[travelId] || [];
    const isAlreadySelected = currentManualSelections.includes(volunteerName);

    if (isAlreadySelected) {
      setSelectedVolunteers(prev => ({ ...prev, [travelId]: currentManualSelections.filter(name => name !== volunteerName) }));
    } else {
      if (currentManualSelections.length < slots) {
        setSelectedVolunteers(prev => ({ ...prev, [travelId]: [...currentManualSelections, volunteerName] }));
      } else {
        toast({ title: "Limite de vagas atingido", description: `Máximo de ${slots} voluntários manuais atingido.`, variant: "destructive" });
      }
    }
  };
  
  const handleOpenAddVolunteerDialog = (travelId: string) => {
    const travel = travels.find(t => t.id === travelId);
    if (travel && travel.isLocked) {
        toast({ title: "Ação não permitida", description: "Não é possível adicionar voluntários a viagens processadas.", variant: "destructive" });
        return;
    }
    setSelectedTravelId(travelId);
    setAddVolunteerDialogOpen(true);
  };

  return <>
      {showRankingRules && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="p-6 bg-white shadow-xl max-w-md w-full relative border border-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Regras de Ordenação Automática</h2>
            <ol className="list-decimal list-inside text-sm space-y-2 text-gray-600">
              <li>Menor quantidade de diárias acumuladas.</li>
              <li>Em caso de empate: Maior graduação (peso hierárquico).</li>
              <li>Se persistir o empate: Ordem de inscrição na viagem (quem se inscreveu primeiro).</li>
            </ol>
            <Button className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setShowRankingRules(false)}>
              Entendi
            </Button>
          </Card>
        </div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-transparent">
        {travels
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .map(travel => {
            const travelStart = new Date(travel.startDate + "T00:00:00");
            const travelEnd = new Date(travel.endDate + "T00:00:00");
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isLocked = travel.isLocked ?? false;
            const displayVolunteersList = getSortedVolunteers(travel); 
            
            let numDays = 0;
            if (travelEnd >= travelStart) numDays = differenceInDays(travelEnd, travelStart) + 1;
            const dailyCount = travel.halfLastDay ? numDays - 0.5 : numDays;
            const formattedDailyCount = formattedDiaryCount(dailyCount);
            const totalCost = (travel.dailyRate && dailyCount > 0) ? dailyCount * Number(travel.dailyRate) : 0;

            let cardBg = "bg-white";
            let statusBadge = null;
            const rightPosDropdown = "right-2";
            const rightPosStatus = isAdmin ? "right-12 sm:right-14" : "right-2"; 

            if (today < travelStart) {
              if (isLocked) {
                cardBg = "bg-gradient-to-br from-orange-50 to-orange-100";
                statusBadge = <div className={`absolute top-3 ${rightPosStatus} bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 text-xs rounded-full shadow-sm whitespace-nowrap`}>
                        Processando diária
                      </div>;
              } else {
                statusBadge = <div className={`absolute top-3 ${rightPosStatus} bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 text-xs rounded-full shadow-sm whitespace-nowrap`}>
                        Em aberto
                        <button onClick={e => { e.stopPropagation(); setShowRankingRules(true); }} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                          <Info className="h-3 w-3" />
                        </button>
                      </div>;
              }
            } else if (today >= travelStart && today <= travelEnd) {
              cardBg = "bg-gradient-to-br from-green-50 to-green-100";
              statusBadge = <div className={`absolute top-3 ${rightPosStatus} bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 text-xs rounded-full shadow-sm whitespace-nowrap`}>
                      Em trânsito
                    </div>;
            } else {
              cardBg = "bg-gradient-to-br from-gray-50 to-gray-100";
              statusBadge = <div className={`absolute top-3 ${rightPosStatus} bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1.5 text-xs rounded-full shadow-sm whitespace-nowrap`}>
                      Encerrada
                    </div>;
            }
            
            const canUserVolunteer = today < travelStart && !travel.archived && !isLocked;
            const isUserVolunteered = travel.volunteers?.includes(`${user.rank} ${user.warName}`);

        return <Card 
                    key={travel.id} 
                    className={`relative overflow-hidden ${cardBg} border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg ${travel.archived ? "opacity-60 hover:opacity-100" : ""}`}
                >
                {statusBadge}

                {isAdmin && <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`absolute top-2 ${rightPosDropdown} h-8 w-8 p-0 hover:bg-black/10 rounded-full z-10`}>
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleEditTravel(travel)} className="gap-2"><Edit className="h-4 w-4" />Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchive(travel.id, !travel.archived)} className="gap-2">
                        <Archive className="h-4 w-4" />{travel.archived ? "Desarquivar" : "Arquivar"}
                      </DropdownMenuItem>
                      {today <= travelEnd && (
                        <DropdownMenuItem onClick={() => handleToggleLock(travel.id)} className="gap-2">
                          {isLocked ? <><LockOpen className="h-4 w-4" />Reabrir vagas</> : <><Lock className="h-4 w-4" />Processar diária</>}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-600 gap-2 hover:!bg-red-50 hover:!text-red-700" onClick={() => handleDeleteTravel(travel.id)}>
                        <Trash2 className="h-4 w-4" />Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>}

                <div className="p-4 cursor-pointer" onClick={() => toggleExpansion(travel.id)}>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-1.5 text-blue-900 pr-8">
                        {travel.destination || "Destino não informado"}
                      </h3>
                      <div className="space-y-1.5 text-sm text-gray-700">
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-500 shrink-0" /><p>Destino: {travel.destination || "N/A"}</p></div>
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500 shrink-0" /><p>Início: {travelStart.toLocaleDateString()}</p></div>
                        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-500 shrink-0" /><p>Fim: {travelEnd.toLocaleDateString()}</p></div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-500 shrink-0" /><p>Vagas: {travel.slots}</p></div>
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500 shrink-0" />
                          <p>{formattedDailyCount}
                            {travel.dailyRate && totalCost > 0 && <span className="text-blue-700 font-medium ml-1">
                                ({totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 })})
                              </span>}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {(expandedTravels.includes(travel.id) || displayVolunteersList.length > 0 || (isAdmin && !isLocked && today < travelStart)) && (
                    <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-sm text-gray-800">
                            { (travel.volunteers?.length || 0) === 1 ? "Voluntário" : "Voluntários" } ({travel.volunteers?.length || 0} { (travel.volunteers?.length || 0) === 1 ? "inscrito" : "inscritos" })
                            {/* A informação de selecionados ainda pode ser útil aqui se a viagem estiver bloqueada,
                                mas se a instrução é remover completamente desta linha específica: */}
                            {/* {isLocked ? ` (${displayVolunteersList.filter(v => v.isSelected).length} selecionados)` : ''} */}
                            {/* Se a intenção é remover TOTALMENTE o 'selecionados' daqui, deixe como acima.
                                Se quiser mostrar os selecionados QUANDO a viagem estiver processada,
                                pode-se adicionar de volta, mas o pedido foi para remover. */}
                          </h4>
                          {isAdmin && today < travelStart && !isLocked && (
                            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleOpenAddVolunteerDialog(travel.id); }}>
                              <UserPlus className="h-3.5 w-3.5 mr-1.5" />Adicionar
                            </Button>
                          )}
                        </div>
                        {displayVolunteersList.length > 0 ? (
                          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                            {displayVolunteersList.map(vol => (
                            <div 
                                key={vol.fullName} 
                                title={isAdmin && !isLocked && today < travelStart ? "Duplo clique para selecionar/desselecionar manualmente" : ""}
                                className={`text-sm p-2 rounded-md flex justify-between items-center transition-colors
                                            ${vol.isManual && !isLocked ? 'bg-yellow-50 border border-yellow-300 hover:bg-yellow-100' 
                                              : vol.isSelected ? 'bg-green-100 border border-green-300 hover:bg-green-200' 
                                              : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                                            }
                                            ${isAdmin && !isLocked && today < travelStart ? 'cursor-pointer' : ''}
                                          `}
                                onDoubleClick={() => {
                                  if (isAdmin && !isLocked && today < travelStart) {
                                    handleManualVolunteerSelection(travel.id, vol.fullName, travel.slots);
                                  }
                                }}>
                              <div className="flex items-center gap-2 overflow-hidden">
                                {(vol.isSelected || (vol.isManual && !isLocked)) && <div className={`w-2 h-2 rounded-full shrink-0 ${vol.isSelected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>}
                                <span className={`truncate ${vol.isSelected ? "font-medium text-green-800" : vol.isManual && !isLocked ? 'font-medium text-yellow-800' : "text-gray-800"}`}>
                                  {vol.fullName}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0">
                                <span className={`text-xs ${vol.isSelected ? "text-green-700" : vol.isManual && !isLocked ? 'text-yellow-700' : "text-gray-500"}`}>
                                  {formattedTravelCount(volunteerCounts[vol.fullName] || 0)}
                                </span>
                                <span className={`text-xs ${vol.isSelected ? "text-green-700" : vol.isManual && !isLocked ? 'text-yellow-700' : "text-gray-500"}`}>
                                  {formattedDiaryCount(diaryCounts[vol.fullName] || 0)}
                                </span>
                                {isAdmin && today < travelStart && !isLocked && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-100 rounded-full text-red-500" 
                                    onClick={e => { e.stopPropagation(); handleRemoveVolunteer(travel.id, vol.fullName); }}
                                    title="Remover voluntário da viagem">
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            {isLocked ? "Nenhum voluntário selecionado para esta viagem." : "Nenhum voluntário inscrito ainda."}
                          </p>
                        )}
                      </div>
                    )}

                    {canUserVolunteer && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <Button
                            onClick={(e) => { e.stopPropagation(); handleVolunteer(travel.id); }}
                            className={`w-full shadow-sm transition-colors ${isUserVolunteered ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"} text-white font-medium`}
                            // O botão só fica desabilitado se canUserVolunteer for false,
                            // o que já é tratado pelo if que envolve este bloco.
                            // Se o usuário já está voluntariado, o botão é para desistir.
                            // Se não está, é para se voluntariar. Não há mais limite de vagas para inscrição.
                            title={isUserVolunteered ? "Desistir da viagem" : "Quero ser voluntário"}
                        >
                          {isUserVolunteered ? "Desistir da Viagem" : "Quero ser Voluntário"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>;
          })}
      </div>

      {/* Botão Flutuante MODIFICADO para ter a aparência do primeiro código */}
      {/* Lembre-se que este botão só aparece se 'isAdmin' for true. */}
      {isAdmin && <Button 
                    onClick={() => setIsModalOpen(true)} 
                    className="fixed bottom-6 right-6 rounded-full p-4 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 my-[69px] mx-0 px-[18px] text-base py-[26px] z-30" // Aplicadas classes do primeiro código + z-30
                    >
          <Plus className="h-6 w-6" /> {/* Ícone ajustado para h-6 w-6 */}
        </Button>}

      {isModalOpen && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="p-6 bg-white shadow-2xl max-w-lg w-full relative rounded-lg">
            <button onClick={() => { setIsModalOpen(false); setEditingTravel(null); setStartDate(""); setEndDate(""); setSlots(""); setDestination(""); setDailyAllowance(""); setDailyRate(""); setHalfLastDay(false);}} 
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100" title="Fechar">
              <X className="h-5 w-5"/>
            </button>
            <form onSubmit={handleCreateTravel} className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingTravel ? "Editar Viagem" : "Criar Nova Viagem"}
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="destination" className="text-sm font-medium text-gray-700">Destino</Label>
                  <Input id="destination" type="text" value={destination} onChange={e => setDestination(e.target.value)} required placeholder="Ex: Operação Fronteira Segura" className="w-full mt-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">Data Inicial</Label>
                    <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">Data Final</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slots" className="text-sm font-medium text-gray-700">Número de Vagas</Label>
                    <Input id="slots" type="number" value={slots} onChange={e => setSlots(e.target.value)} required min="1" placeholder="Ex: 3" className="w-full mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="dailyRate" className="text-sm font-medium text-gray-700">Valor da Diária (R$)</Label>
                    <Input id="dailyRate" type="number" value={dailyRate} onChange={e => setDailyRate(e.target.value)} placeholder="Opcional (Ex: 310.75)" step="0.01" min="0" className="w-full mt-1" />
                  </div>
                </div>
                <div className="flex items-center pt-2">
                  <Switch id="halfLastDay" checked={halfLastDay} onCheckedChange={setHalfLastDay} />
                  <Label htmlFor="halfLastDay" className="ml-2.5 text-sm font-medium text-gray-700 cursor-pointer select-none">
                    Considerar meia diária no último dia
                  </Label>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" className="w-full sm:w-auto flex-grow bg-blue-600 hover:bg-blue-700">
                  {editingTravel ? "Salvar Alterações" : "Criar Viagem"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingTravel(null); setStartDate(""); setEndDate(""); setSlots(""); setDestination(""); setDailyAllowance(""); setDailyRate(""); setHalfLastDay(false);}} className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>}

      <AddVolunteerDialog
        open={addVolunteerDialogOpen}
        onOpenChange={setAddVolunteerDialogOpen}
        travelId={selectedTravelId}
        currentVolunteers={travels.find(t => t.id === selectedTravelId)?.volunteers || []}
        onVolunteersAdded={() => {
          toast({
            title: "Sucesso",
            description: "Voluntários adicionados com sucesso!"
          });
        }}
      />
    </>;
};
export default TravelManagement;
