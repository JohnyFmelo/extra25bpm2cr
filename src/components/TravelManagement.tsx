//Viagens2
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
import { CalendarDays, Users, Clock } from "lucide-react";

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
  selectedVolunteers?: string[];  // Somente os que foram selecionados
  archived: boolean;
  isLocked?: boolean;
}

// ---------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------
export const TravelManagement = () => {
  // -----------------------------
  // ESTADOS GERAIS
  // -----------------------------
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [slots, setSlots] = useState("");
  const [destination, setDestination] = useState("");
  const [dailyAllowance, setDailyAllowance] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [halfLastDay, setHalfLastDay] = useState(false);

  const [travels, setTravels] = useState<Travel[]>([]);
  const [volunteerCounts, setVolunteerCounts] = useState<{ [key: string]: number }>({});
  const [diaryCounts, setDiaryCounts] = useState<{ [key: string]: number }>({});

  // Para editar viagem
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);

  // Controle de expansão de cartões
  const [expandedTravels, setExpandedTravels] = useState<string[]>([]);

  // Modal de criação/edição
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal de exibição das regras (exemplo)
  const [showRankingRules, setShowRankingRules] = useState(false);

  const { toast } = useToast();

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
      const currentVolunteers = Array.isArray(travelData.volunteers)
        ? travelData.volunteers
        : [];

      // Se já estiver na lista, remove (desistir). Se não estiver, adiciona
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
        // Bloqueando a viagem agora (Processar diária).
        const allVolunteers = travelData.volunteers ?? [];

        // Monta objetos para ordenação
        const processed = allVolunteers.map((volunteer) => {
          const [rank] = volunteer.split(" ");
          return {
            fullName: volunteer,
            rank,
            diaryCount: diaryCounts[volunteer] || 0,
            rankWeight: getMilitaryRankWeight(rank),
            // "appliedAtIndex" = posição no array "volunteers"
            appliedAtIndex: travelData.volunteers.indexOf(volunteer),
          };
        });

        // Ordena:
        //  1) Maior patente (antiguidade)
        //  2) menor diária
        //  3) quem chegou primeiro (appliedAtIndex)
        processed.sort((a, b) => {
          if (a.rankWeight !== b.rankWeight) {
            return b.rankWeight - a.rankWeight;  // desc (maior patente primeiro)
          }
          if (a.diaryCount !== b.diaryCount) {
            return a.diaryCount - b.diaryCount;  // asc (menor diária primeiro)
          }
          return a.appliedAtIndex - b.appliedAtIndex; // asc (quem se inscreveu primeiro)
        });


        // Pega até o limite de vagas
        const selectedVolunteers = processed.slice(0, travelData.slots);

        await updateDoc(travelRef, {
          isLocked: true,
          selectedVolunteers: selectedVolunteers.map((v) => v.fullName),
        });
      } else {
        // Desbloqueando a viagem (reabrir vagas)
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
  // 8) FUNÇÃO PARA CALCULAR PESO DAS PATENTES
  // ---------------------------------------------------
  const getMilitaryRankWeight = (rank: string): number => {
    const rankWeights: { [key: string]: number } = {
      "Cel": 12,
      "Cel PM": 12,
      "Ten Cel": 11,
      "Ten Cel PM": 11,
      "Maj": 10,
      "Maj PM": 10,
      "Cap": 9,
      "Cap PM": 9,
      "1° Ten": 8,
      "1° Ten PM": 8,
      "2° Ten": 7,
      "2° Ten PM": 7,
      "Sub Ten": 6,
      "Sub Ten PM": 6,
      "1° Sgt": 5,
      "1° Sgt PM": 5,
      "2° Sgt": 4,
      "2° Sgt PM": 4,
      "3° Sgt": 3,
      "3° Sgt PM": 3,
      "Cb": 2,
      "Cb PM": 2,
      "Sd": 1,
      "Sd PM": 1,
      "Estágio": 0,
    };
    return rankWeights[rank] || 0;
  };

  // ---------------------------------------------------
  // 9) FUNÇÕES DE FORMATAÇÃO
  // ---------------------------------------------------
  const formattedTravelCount = (count: number) => {
    return count === 1 ? "1 viagem" : `${count} viagens`;
  };

  const formattedDiaryCount = (count: number) => {
    const formattedCount = count.toLocaleString("pt-BR", {
      minimumFractionDigits: count % 1 !== 0 ? 1 : 0,
      maximumFractionDigits: 1,
    });
    return `${formattedCount} ${count === 1 ? 'diária' : 'diárias'}`;
  };

  // ---------------------------------------------------
  // 10) OBTÉM LISTA DE VOLUNTÁRIOS A EXIBIR + ORDENAÇÃO
  // ---------------------------------------------------
  const getSortedVolunteers = (travel: Travel) => {
    // Se a viagem estiver bloqueada, mostramos apenas selectedVolunteers
    // Se não estiver bloqueada, mostramos todos de volunteers
    const baseList = travel.isLocked
      ? travel.selectedVolunteers || []
      : travel.volunteers || [];

    // Monta array de objetos
    const processed = baseList.map((volunteer) => {
      const [rank] = volunteer.split(" ");
      return {
        fullName: volunteer,
        rank,
        diaryCount: diaryCounts[volunteer] || 0,
        rankWeight: getMilitaryRankWeight(rank),
        appliedAtIndex: (travel.volunteers || []).indexOf(volunteer),
      };
    });

    // Se estiver bloqueada, assumimos que todos ali estão "isSelected"
    // Se não estiver, quem ficaria no top X é "potencialmente selecionado"
    const totalSlots = travel.slots || 1;
    const isLocked = travel.isLocked;

    // Ordena:
    // 1) Maior patente (antiguidade)
    // 2) Menor diária
    // 3) Quem chegou primeiro
    processed.sort((a, b) => {
      if (a.rankWeight !== b.rankWeight) {
        return b.rankWeight - a.rankWeight; // 1) Maior patente (antiguidade) - DESCENDING
      }
      if (a.diaryCount !== b.diaryCount) {
        return a.diaryCount - b.diaryCount; // 2) Menor diária - ASCENDING
      }
      return a.appliedAtIndex - b.appliedAtIndex; // 3) Quem chegou primeiro - ASCENDING
    });


    return processed.map((item, idx) => {
      const isSelected = isLocked
        ? true
        : idx < totalSlots; // se não está bloqueada, top 'slots' são "selecionados"
      return { ...item, isSelected };
    });
  };

  // ---------------------------------------------------
  // 11) EXPANDIR/COLAPSAR CARTÕES
  // ---------------------------------------------------
  const toggleExpansion = (travelId: string) => {
    setExpandedTravels((prev) =>
      prev.includes(travelId)
        ? prev.filter((id) => id !== travelId)
        : [...prev, travelId]
    );
  };

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <>
      {showRankingRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="p-6 bg-white shadow-xl max-w-md w-full relative border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Regras de Ordenação</h2>
            <ol className="list-decimal list-inside text-sm space-y-2 text-gray-600">
              <li>Graduação mais antiga (peso maior) primeiro.</li>
              <li>Em caso de empate, menor quantidade de diárias.</li>
              <li>Se ainda houver empate, quem se inscreveu primeiro.</li>
            </ol>
            <Button
              className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => setShowRankingRules(false)}
            >
              Fechar
            </Button>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {travels
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .map((travel) => {
            const travelStart = new Date(travel.startDate + "T00:00:00");
            const travelEnd = new Date(travel.endDate + "T00:00:00");
            const today = new Date();
            const isLocked = travel.isLocked;
            const sortedVolunteers = getSortedVolunteers(travel);

            // Cálculo correto de diárias
            const numDays = differenceInDays(travelEnd, travelStart) + 1;
            const dailyCount = travel.halfLastDay ? numDays - 0.5 : numDays;
            const formattedCount = dailyCount.toLocaleString("pt-BR", {
              minimumFractionDigits: dailyCount % 1 !== 0 ? 1 : 0,
              maximumFractionDigits: 1,
            });
            const totalCost = travel.dailyRate ? dailyCount * Number(travel.dailyRate) : 0;

            let cardBg = "bg-white";
            let statusBadge = null;
            const rightPos = isAdmin ? "right-12" : "right-2";

            // Define status do cartão
            if (today < travelStart) {
              if (isLocked) {
                statusBadge = (
                  <div className={`absolute top-3 ${rightPos} bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 text-xs rounded-full shadow-sm`}>
                    Processando diária
                  </div>
                );
              } else {
                statusBadge = (
                  <div className={`absolute top-3 ${rightPos} bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 text-xs rounded-full shadow-sm flex items-center gap-2`}>
                    Em aberto
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRankingRules(true);
                      }}
                      className="hover:bg-white/20 rounded-full p-1 transition-colors"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </div>
                );
              }
            } else if (today >= travelStart && today <= travelEnd) {
              cardBg = "bg-gradient-to-br from-green-50 to-green-100";
              statusBadge = (
                <div className={`absolute top-3 ${rightPos} bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 text-xs rounded-full shadow-sm`}>
                  Em transito
                </div>
              );
            } else if (today > travelEnd) {
              cardBg = "bg-gradient-to-br from-gray-50 to-gray-100";
              statusBadge = (
                <div className={`absolute top-3 ${rightPos} bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1.5 text-xs rounded-full shadow-sm`}>
                  Encerrada
                </div>
              );
            }

            return (
              <Card
                key={travel.id}
                className={`relative overflow-hidden ${cardBg} border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 ${
                  travel.archived ? "opacity-75" : ""
                }`}
              >
                {statusBadge}

                {/* Menu Admin */}
                {isAdmin && (
                  <DropdownMenu>
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
                      <DropdownMenuItem
                        className="text-red-600 gap-2"
                        onClick={() => handleDeleteTravel(travel.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchive(travel.id, true)} className="gap-2">
                        <Archive className="h-4 w-4" />
                        Arquivar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleLock(travel.id)} className="gap-2">
                        {isLocked ? (
                          <>
                            <LockOpen className="h-4 w-4" />
                            Reabrir vagas
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4" />
                            Processar diária
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-blue-900">
                        {travel.destination}
                      </h3>
                      <div className="space-y-2 text-gray-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-blue-500" />
                          <p>Início: {travelStart.toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-blue-500" />
                          <p>Fim: {travelEnd.toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <p>Vagas: {travel.slots}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <p>{formattedCount} diárias
                            {travel.dailyRate && totalCost > 0 && (
                              <span className="text-blue-600 font-medium ml-1">
                                ({totalCost.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {sortedVolunteers.length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Voluntários:</h4>
                        <div className="space-y-2">
                          {sortedVolunteers.map((vol) => (
                            <div
                              key={vol.fullName}
                              className={`text-sm p-2 rounded-lg flex justify-between items-center ${
                                vol.isSelected
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {vol.isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                )}
                                <span className={vol.isSelected ? "font-medium text-green-900" : "text-gray-700"}>
                                  {vol.fullName}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs block ${vol.isSelected ? "text-green-700" : "text-gray-500"}`}>
                                  {formattedTravelCount(volunteerCounts[vol.fullName] || 0)}
                                </span>
                                <span className={`text-xs block ${vol.isSelected ? "text-green-700" : "text-gray-500"}`}>
                                  {formattedDiaryCount(diaryCounts[vol.fullName] || 0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botão de voluntariar */}
                    {today < travelStart && !travel.archived && !isLocked && (
                      <div className="mt-3">
                        <Button
                          onClick={() => handleVolunteer(travel.id)}
                          className={`w-full shadow-sm ${
                            travel.volunteers?.includes(`${user.rank} ${user.warName}`)
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          } text-white font-medium`}
                        >
                          {travel.volunteers?.includes(`${user.rank} ${user.warName}`)
                            ? "Desistir"
                            : "Quero ser Voluntário"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
      </div>

      {/* Botão de criar nova viagem (somente Admin) */}
      {isAdmin && (
        <Button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 rounded-full p-4 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Modal de criação/edição */}
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
              ×
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
    </>
  );
};

export default TravelManagement;
