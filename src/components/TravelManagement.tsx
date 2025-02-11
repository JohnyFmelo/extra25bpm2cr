import { useState, useEffect } from "react"; 
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Archive, Plus, Lock, LockOpen, Info } from "lucide-react";
import { Switch } from "./ui/switch";

// ---------------------------------------------------
// INTERFACES
// ---------------------------------------------------
interface Travel {
  id: string;
  startDate: string;
  endDate: string;
  slots: number;
  destination: string;
  dailyAllowance?: number | null;
  dailyRate?: number | null;
  halfLastDay: boolean;
  volunteers: string[];           // Todos que se inscreveram
  selectedVolunteers?: string[];  // Somente os que foram selecionados (definidos automaticamente ou via seleção manual)
  archived: boolean;
  isLocked?: boolean;
}

// ---------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------
export const TravelManagement = () => {
  // Estados do formulário
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [slots, setSlots] = useState("");
  const [destination, setDestination] = useState("");
  const [dailyAllowance, setDailyAllowance] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [halfLastDay, setHalfLastDay] = useState(false);

  // Lista de viagens
  const [travels, setTravels] = useState<Travel[]>([]);

  // Contadores globais de viagens e diárias por voluntário
  const [volunteerCounts, setVolunteerCounts] = useState<{ [key: string]: number }>({});
  const [diaryCounts, setDiaryCounts] = useState<{ [key: string]: number }>({});

  // Para edição de viagem
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);

  // Controle de expansão dos cartões
  const [expandedTravels, setExpandedTravels] = useState<string[]>([]);

  // Modal de criação/edição
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Viagens bloqueadas
  const [lockedTravels, setLockedTravels] = useState<string[]>([]);

  // Modal para exibição das regras de ordenação
  const [isRankingRulesModalOpen, setIsRankingRulesModalOpen] = useState(false);

  // Modal de seleção manual (apenas para admin)
  const [isManualSelectionModalOpen, setIsManualSelectionModalOpen] = useState(false);
  const [manualSelectionTravel, setManualSelectionTravel] = useState<Travel | null>(null);
  const [manualSelectedVolunteers, setManualSelectedVolunteers] = useState<string[]>([]);

  const { toast } = useToast();

  // Usuário logado
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.userType === "admin";

  // ---------------------------------------------------
  // 1) EFEITO PARA CALCULAR DIÁRIAS E VIAGENS
  // ---------------------------------------------------
  useEffect(() => {
    const travelsRef = collection(db, "travels");
    const q = query(travelsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts: { [key: string]: number } = {};
      const diaryCount: { [key: string]: number } = {};
      const today = new Date();

      snapshot.docs.forEach((doc) => {
        const travel = doc.data() as Travel;
        const travelStart = new Date(travel.startDate + "T00:00:00");
        const travelEnd = new Date(travel.endDate + "T00:00:00");

        // Se a viagem já passou, está em andamento ou está bloqueada no futuro
        if (
          (today < travelStart && travel.isLocked) ||
          (today >= travelStart && today <= travelEnd) ||
          (today > travelEnd)
        ) {
          // Se existir selectedVolunteers e não estiver vazio, usamos-o; caso contrário, usamos volunteers
          const finalList =
            travel.selectedVolunteers && travel.selectedVolunteers.length > 0
              ? travel.selectedVolunteers
              : travel.volunteers || [];

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

  // ---------------------------------------------------
  // 2) EFEITO PARA CARREGAR VIAGENS
  // ---------------------------------------------------
  useEffect(() => {
    const q = query(collection(db, "travels"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const travelsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Travel[];
      setTravels(travelsData);
      
      const lockedTravelIds = travelsData
        .filter(travel => travel.isLocked)
        .map(travel => travel.id);
      setLockedTravels(lockedTravelIds);
    });

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------
  // 3) CRIAR OU EDITAR VIAGEM
  // ---------------------------------------------------
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
          archived: editingTravel.archived || false,
        });

        toast({
          title: "Sucesso",
          description: "Viagem atualizada com sucesso!",
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
          selectedVolunteers: [], // inicia vazio
          archived: false,
          isLocked: false,
        });

        toast({
          title: "Sucesso",
          description: "Viagem criada com sucesso!",
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
        variant: "destructive",
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

  // ---------------------------------------------------
  // 4) EXCLUIR VIAGEM
  // ---------------------------------------------------
  const handleDeleteTravel = async (travelId: string) => {
    try {
      await deleteDoc(doc(db, "travels", travelId));
      toast({
        title: "Sucesso",
        description: "Viagem excluída com sucesso!",
      });
    } catch (error) {
      console.error("Error deleting travel:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir viagem.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------------------------------
  // 5) ARQUIVAR VIAGEM
  // ---------------------------------------------------
  const handleArchive = async (travelId: string, archived: boolean) => {
    try {
      const travelRef = doc(db, "travels", travelId);
      await updateDoc(travelRef, { archived });
      toast({
        title: "Sucesso",
        description: archived
          ? "Viagem arquivada com sucesso!"
          : "Viagem desarquivada com sucesso!",
      });
    } catch (error) {
      console.error("Error archiving travel:", error);
      toast({
        title: "Erro",
        description: "Erro ao arquivar a viagem.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------------------------------
  // 6) VOLUNTARIAR-SE
  // ---------------------------------------------------
  const handleVolunteer = async (travelId: string) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const volunteerInfo = `${user.rank} ${user.warName}`;

      if (!volunteerInfo) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado. Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      const travelRef = doc(db, "travels", travelId);
      const travelSnap = await getDoc(travelRef);

      if (!travelSnap.exists()) {
        throw new Error("Viagem não encontrada");
      }

      const travelData = travelSnap.data() as Travel;
      const currentVolunteers = Array.isArray(travelData.volunteers)
        ? travelData.volunteers
        : [];

      // Se já estiver inscrito, remove (desistir); se não, adiciona
      if (currentVolunteers.includes(volunteerInfo)) {
        const updatedVolunteers = currentVolunteers.filter(v => v !== volunteerInfo);
        await updateDoc(travelRef, {
          volunteers: updatedVolunteers,
        });

        toast({
          title: "Sucesso",
          description: "Você desistiu da viagem com sucesso.",
        });
        return;
      }

      const updatedVolunteers = [...currentVolunteers, volunteerInfo];
      await updateDoc(travelRef, {
        volunteers: updatedVolunteers,
      });

      toast({
        title: "Sucesso",
        description: "Você se candidatou com sucesso!",
      });
    } catch (error) {
      console.error("Error volunteering:", error);
      toast({
        title: "Erro",
        description: "Erro ao se candidatar.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------------------------------
  // 7) TRAVAR / PROCESSAR DIÁRIA (SEM EXCLUIR VOLUNTÁRIOS)
  // ---------------------------------------------------
  const handleToggleLock = async (travelId: string) => {
    try {
      const travelRef = doc(db, "travels", travelId);
      const travelSnap = await getDoc(travelRef);

      if (!travelSnap.exists()) return;

      const travelData = travelSnap.data() as Travel;
      const isCurrentlyLocked = travelData.isLocked ?? false;

      if (!isCurrentlyLocked) {
        // Ao travar, define automaticamente os selecionados
        const allVolunteers = travelData.volunteers ?? [];

        const processed = allVolunteers.map((volunteer, index) => {
          const [rank] = volunteer.split(" ");
          return {
            fullName: volunteer,
            rank,
            diaryCount: diaryCounts[volunteer] || 0,
            rankWeight: getMilitaryRankWeight(rank),
            appliedAtIndex: travelData.volunteers.indexOf(volunteer), // Ordem de chegada
          };
        });

        // Ordena: menor diárias, se empate maior patente e, se ainda empate, quem chegou primeiro
        processed.sort((a, b) => {
          if (a.diaryCount !== b.diaryCount) {
            return a.diaryCount - b.diaryCount;
          }
          if (a.rankWeight !== b.rankWeight) {
            return b.rankWeight - a.rankWeight;
          }
          return a.appliedAtIndex - b.appliedAtIndex;
        });

        const selectedVolunteers = processed.slice(0, travelData.slots);

        await updateDoc(travelRef, {
          isLocked: true,
          selectedVolunteers: selectedVolunteers.map((v) => v.fullName),
        });
      } else {
        await updateDoc(travelRef, {
          isLocked: false,
          selectedVolunteers: [],
        });
      }

      toast({
        title: "Sucesso",
        description: !isCurrentlyLocked
          ? "Viagem bloqueada e diárias processadas!"
          : "Viagem reaberta!",
      });
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar o status da viagem.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------------------------------
  // 8) PESO DE PATENTES
  // ---------------------------------------------------
  const getMilitaryRankWeight = (rank: string): number => {
    const rankWeights: { [key: string]: number } = {
      "Cel PM": 12,
      "Ten Cel PM": 11,
      "Maj PM": 10,
      "Cap PM": 9,
      "1° Ten PM": 8,
      "2° Ten PM": 7,
      "Sub Ten PM": 6,
      "1° Sgt PM": 5,
      "2° Sgt PM": 4,
      "3° Sgt PM": 3,
      "Cb PM": 2,
      "Sd PM": 1,
      "Estágio": 0,
    };
    return rankWeights[rank] || 0;
  };

  // ---------------------------------------------------
  // 9) FORMATAÇÕES
  // ---------------------------------------------------
  const formattedTravelCount = (count: number) => {
    return count === 1 ? "1 viagem" : `${count} viagens`;
  };

  const formattedDiaryCount = (count: number) => {
    const formattedCount = count.toLocaleString("pt-BR", {
      minimumFractionDigits: count % 1 !== 0 ? 1 : 0,
      maximumFractionDigits: 1,
    });
    return `${formattedCount} ${count === 1 ? "diária" : "diárias"}`;
  };

  // ---------------------------------------------------
  // 10) FUNÇÃO PARA DETERMINAR QUEM EXIBIR
  //     Se a viagem estiver bloqueada, mostra somente selectedVolunteers;
  //     caso contrário, mostra todos (volunteers).
  // ---------------------------------------------------
  const getVolunteersToDisplay = (travel: Travel) => {
    return travel.isLocked
      ? travel.selectedVolunteers || []
      : travel.volunteers || [];
  };

  // ---------------------------------------------------
  // 11) FUNÇÃO DE ORDENAMENTO DOS VOLUNTÁRIOS (inclui novo critério: ordem de inscrição)
  // ---------------------------------------------------
  const sortVolunteers = (travel: Travel, volunteersList: string[]) => {
    const processedVolunteers = volunteersList.map((volunteer) => {
      const [rank] = volunteer.split(" ");
      return {
        fullName: volunteer,
        rank,
        count: volunteerCounts[volunteer] || 0,
        diaryCount: diaryCounts[volunteer] || 0,
        appliedAtIndex: travel.volunteers.indexOf(volunteer),
        isSelected: travel.selectedVolunteers?.includes(volunteer) || false,
      };
    });

    processedVolunteers.sort((a, b) => {
      // Primeiro: voluntários selecionados vêm antes
      if (a.isSelected && !b.isSelected) return -1;
      if (!a.isSelected && b.isSelected) return 1;
      // Segundo: menor diárias primeiro
      if (a.diaryCount !== b.diaryCount) {
        return a.diaryCount - b.diaryCount;
      }
      // Terceiro: maior patente (peso maior) vem primeiro
      const aRankWeight = getMilitaryRankWeight(a.rank);
      const bRankWeight = getMilitaryRankWeight(b.rank);
      if (aRankWeight !== bRankWeight) {
        return bRankWeight - aRankWeight;
      }
      // Quarto: quem chegou primeiro (menor índice) vem primeiro
      return a.appliedAtIndex - b.appliedAtIndex;
    });

    return processedVolunteers;
  };

  // ---------------------------------------------------
  // 12) EXPANDIR OU RECOLHER CARTÕES
  // ---------------------------------------------------
  const toggleExpansion = (travelId: string) => {
    setExpandedTravels((prev) =>
      prev.includes(travelId)
        ? prev.filter((id) => id !== travelId)
        : [...prev, travelId]
    );
  };

  // ---------------------------------------------------
  // 13) ABRIR MODAL DE SELEÇÃO MANUAL (ADMIN)
  // ---------------------------------------------------
  const openManualSelection = (travel: Travel) => {
    setManualSelectionTravel(travel);
    // Preenche com os já selecionados, se houver; senão, usa todos os inscritos
    setManualSelectedVolunteers(
      travel.selectedVolunteers && travel.selectedVolunteers.length > 0
        ? travel.selectedVolunteers
        : travel.volunteers
    );
    setIsManualSelectionModalOpen(true);
  };

  const handleManualSelectionSubmit = async () => {
    if (!manualSelectionTravel) return;
    try {
      const travelRef = doc(db, "travels", manualSelectionTravel.id);
      await updateDoc(travelRef, {
        isLocked: true,
        selectedVolunteers: manualSelectedVolunteers,
      });
      toast({
        title: "Sucesso",
        description: "Seleção manual atualizada!",
      });
      setIsManualSelectionModalOpen(false);
      setManualSelectionTravel(null);
    } catch (error) {
      console.error("Error in manual selection:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar seleção manual.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------------------------------
  // 14) RENDERIZAÇÃO
  // ---------------------------------------------------
  return (
    <div className="p-6 space-y-8 relative">
      {/* Modal de Regras de Ordenação */}
      {isRankingRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="p-6 bg-white max-w-md w-full relative">
            <h2 className="text-xl font-semibold mb-4">Regras de Reorganização</h2>
            <p className="text-sm">
              1. Ordena-se primeiramente pela quantidade de diárias acumuladas (menor primeiro).<br />
              2. Em caso de empate, a graduação mais alta fica na frente.<br />
              3. Se ainda houver empate na graduação, o voluntário que se inscreveu primeiro (quem chegou primeiro) ficará na frente.
            </p>
            <Button onClick={() => setIsRankingRulesModalOpen(false)} className="mt-4">
              Fechar
            </Button>
          </Card>
        </div>
      )}

      {/* Modal de Seleção Manual (Admin) */}
      {isManualSelectionModalOpen && manualSelectionTravel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="p-6 bg-white max-w-md w-full relative">
            <h2 className="text-xl font-semibold mb-4">Seleção Manual - {manualSelectionTravel.destination}</h2>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {manualSelectionTravel.volunteers.map((volunteer, index) => (
                <li key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={manualSelectedVolunteers.includes(volunteer)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setManualSelectedVolunteers((prev) => [...prev, volunteer]);
                      } else {
                        setManualSelectedVolunteers((prev) =>
                          prev.filter((v) => v !== volunteer)
                        );
                      }
                    }}
                    className="mr-2"
                  />
                  <span>{volunteer}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-4 mt-4">
              <Button onClick={handleManualSelectionSubmit} className="w-full">
                Salvar Seleção
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsManualSelectionModalOpen(false);
                  setManualSelectionTravel(null);
                }}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {travels
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .map((travel) => {
            const travelStart = new Date(travel.startDate + "T00:00:00");
            const travelEnd = new Date(travel.endDate + "T00:00:00");
            const today = new Date();
            const isLocked = travel.isLocked;

            let cardBg = "bg-white";
            let statusBadge = null;
            const rightPos = isAdmin ? "right-12" : "right-2";

            if (today < travelStart) {
              if (isLocked) {
                statusBadge = (
                  <div className={`absolute top-2 ${rightPos} bg-orange-500 text-white px-2 py-1 text-xs rounded`}>
                    Processando diária
                  </div>
                );
              } else {
                statusBadge = (
                  <div className={`absolute top-2 ${rightPos} bg-[#3B82F6] text-white px-2 py-1 text-xs rounded flex items-center`}>
                    Em aberto
                    <button onClick={(e) => { e.stopPropagation(); setIsRankingRulesModalOpen(true); }} className="ml-2">
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                );
              }
            } else if (today >= travelStart && today <= travelEnd) {
              cardBg = "bg-green-100";
              statusBadge = (
                <div className={`absolute top-2 ${rightPos} bg-green-500 text-white px-2 py-1 text-xs rounded`}>
                  Em trânsito
                </div>
              );
            } else if (today > travelEnd) {
              cardBg = "bg-gray-100";
              statusBadge = (
                <div className={`absolute top-2 ${rightPos} bg-gray-300 text-gray-700 px-2 py-1 text-xs rounded`}>
                  Encerrada
                </div>
              );
            }

            // Cálculo de diárias para exibição
            const numDays = differenceInDays(travelEnd, travelStart) + 1;
            const count = travel.halfLastDay ? numDays - 0.5 : numDays;
            const formattedCount = count.toLocaleString("pt-BR", {
              minimumFractionDigits: count % 1 !== 0 ? 1 : 0,
              maximumFractionDigits: 1,
            });
            const totalCost = count * Number(travel.dailyRate);
            const diariasLine = travel.dailyRate
              ? `Diárias: ${formattedCount} (${totalCost.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })})`
              : `Diárias: ${formattedCount}`;

            // Conteúdo reduzido (cartão fechado)
            const minimalContent = (
              <div className="cursor-pointer" onClick={() => toggleExpansion(travel.id)}>
                <h3 className="text-xl font-semibold">{travel.destination}</h3>
                <p>Data Inicial: {travelStart.toLocaleDateString()}</p>
                <p>{diariasLine}</p>
              </div>
            );

            // Determina quais voluntários exibir
            const volunteersToDisplay = travel.isLocked
              ? travel.selectedVolunteers || []
              : travel.volunteers || [];
            const sortedVolunteers = sortVolunteers(travel, volunteersToDisplay);

            // Conteúdo completo (cartão aberto)
            const fullContent = (
              <div>
                <div className="mb-2 cursor-pointer" onClick={() => toggleExpansion(travel.id)}>
                  <h3 className="text-xl font-semibold text-primary">{travel.destination}</h3>
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>Data Inicial: {travelStart.toLocaleDateString()}</p>
                  <p>Data Final: {travelEnd.toLocaleDateString()}</p>
                  <p>Vagas: {travel.slots}</p>
                  <p>{diariasLine}</p>

                  {sortedVolunteers.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Voluntário:</h4>
                      <ul className="space-y-1">
                        {sortedVolunteers.map((vol) => (
                          <li
                            key={vol.fullName}
                            className={`text-sm p-2 rounded flex justify-between items-center ${
                              vol.isSelected 
                                ? "bg-green-100 border border-green-200"
                                : "bg-gray-50 border border-gray-100"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {vol.isSelected && (
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              )}
                              <span className={vol.isSelected ? "font-medium" : ""}>
                                {vol.fullName}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs ${vol.isSelected ? "text-green-700" : "text-gray-500"}`}>
                                {formattedTravelCount(vol.count)}
                              </span>
                              <span className={`text-xs block ${vol.isSelected ? "text-green-700" : "text-gray-500"}`}>
                                {formattedDiaryCount(vol.diaryCount)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {today < travelStart && !travel.archived && !isLocked && (
                  <div className="mt-4">
                    <Button
                      onClick={() => handleVolunteer(travel.id)}
                      className={`w-full ${
                        travel.volunteers?.includes(`${user.rank} ${user.warName}`)
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-[#3B82F6] hover:bg-[#2563eb]"
                      } text-white`}
                    >
                      {travel.volunteers?.includes(`${user.rank} ${user.warName}`)
                        ? "Desistir"
                        : "Quero ser Voluntário"}
                    </Button>
                  </div>
                )}
              </div>
            );

            return (
              <Card
                key={travel.id}
                className={`p-6 hover:shadow-xl transition-shadow relative ${cardBg} ${
                  travel.archived ? "cursor-pointer" : ""
                }`}
                onClick={travel.archived ? () => toggleExpansion(travel.id) : undefined}
                onDoubleClick={today > travelEnd ? () => toggleExpansion(travel.id) : undefined}
              >
                {statusBadge}

                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="absolute top-2 right-2 h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTravel(travel)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteTravel(travel.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchive(travel.id, true)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Arquivar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleLock(travel.id)}>
                        {isLocked ? (
                          <>
                            <LockOpen className="mr-2 h-4 w-4" />
                            Reabrir vagas
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Processar diária
                          </>
                        )}
                      </DropdownMenuItem>
                      {isAdmin && !travel.isLocked && (
                        <DropdownMenuItem onClick={() => openManualSelection(travel)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Seleção Manual
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <div className="space-y-4">
                  {travel.archived && !expandedTravels.includes(travel.id)
                    ? minimalContent
                    : fullContent}
                </div>
              </Card>
            );
          })}
      </div>

      {/* Modal de criação/edição de viagens */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="p-6 bg-white shadow-lg max-w-lg w-full relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingTravel(null);
                setStartDate("");
                setEndDate("");
                setSlots("");
                setDestination("");
                setDailyAllowance("");
                setDailyRate("");
                setHalfLastDay(false);
              }}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-xl"
            >
              &times;
            </button>
            <form onSubmit={handleCreateTravel} className="space-y-6">
              <h2 className="text-2xl font-semibold text-primary">
                {editingTravel ? "Editar Viagem" : "Criar Nova Viagem"}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destino</Label>
                  <Input
                    id="destination"
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                    placeholder="Digite o destino"
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data Inicial</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data Final</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slots">Número de Vagas</Label>
                    <Input
                      id="slots"
                      type="number"
                      value={slots}
                      onChange={(e) => setSlots(e.target.value)}
                      required
                      min="1"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dailyRate">Valor da Diária</Label>
                    <Input
                      id="dailyRate"
                      type="number"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      placeholder="Opcional"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <Label htmlFor="halfLastDay" className="mr-2 text-sm">
                    Último dia meia diária
                  </Label>
                  <Switch
                    id="halfLastDay"
                    checked={halfLastDay}
                    onCheckedChange={setHalfLastDay}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <Button type="submit" className="w-full md:w-auto">
                  {editingTravel ? "Salvar Alterações" : "Criar Viagem"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTravel(null);
                    setStartDate("");
                    setEndDate("");
                    setSlots("");
                    setDestination("");
                    setDailyAllowance("");
                    setDailyRate("");
                    setHalfLastDay(false);
                  }}
                  className="w-full md:w-auto"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Botão para abrir modal de seleção manual (Admin) já está incluído no Dropdown */}

      {/* Botão para criar nova viagem (visível só para Admin) */}
      {isAdmin && (
        <Button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-4 right-4 rounded-full p-4 bg-[#3B82F6] hover:bg-[#2563eb] text-white shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default TravelManagement;
