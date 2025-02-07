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
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Archive, Plus } from "lucide-react";

export const TravelManagement = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [slots, setSlots] = useState("");
  const [destination, setDestination] = useState("");
  // dailyAllowance armazenará o total calculado (em R$) a partir do valor da diária e do número (possivelmente fracionário) de diárias
  const [dailyAllowance, setDailyAllowance] = useState("");
  // Novo campo: valor da diária (custo por dia) – não é obrigatório
  const [dailyRate, setDailyRate] = useState("");
  // Toggle: se ativado, o último dia conta como meia diária
  const [halfLastDay, setHalfLastDay] = useState(false);
  const [isEditingAllowance, setIsEditingAllowance] = useState(false);
  const [travels, setTravels] = useState<any[]>([]);
  const [volunteerCounts, setVolunteerCounts] = useState<{ [key: string]: number }>({});
  const [editingTravel, setEditingTravel] = useState<any>(null);
  const [expandedTravels, setExpandedTravels] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Busca a contagem de viagens dos voluntários
  useEffect(() => {
    const fetchVolunteerCounts = async () => {
      try {
        const travelsRef = collection(db, "travels");
        const travelsSnapshot = await getDocs(travelsRef);
        const counts: { [key: string]: number } = {};
        const today = new Date();

        travelsSnapshot.docs.forEach((doc) => {
          const travel = doc.data();
          const travelStart = new Date(travel.startDate + "T00:00:00");
          
          // Só conta viagens que já começaram ou já passaram
          if (today >= travelStart && travel.volunteers) {
            travel.volunteers.forEach((volunteer: string) => {
              counts[volunteer] = (counts[volunteer] || 0) + 1;
            });
          }
        });

        setVolunteerCounts(counts);
      } catch (error) {
        console.error("Erro ao buscar contagem de voluntários:", error);
      }
    };

    fetchVolunteerCounts();
  }, []);

  // Atualiza a lista de viagens em tempo real
  useEffect(() => {
    const q = query(collection(db, "travels"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const travelsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTravels(travelsData);
    });

    return () => unsubscribe();
  }, []);

  // Calcula o total (valor em R$) com base nas datas, no valor da diária e se o último dia vale meia
  useEffect(() => {
    if (startDate && endDate && dailyRate) {
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T00:00:00");
      const numDays = differenceInDays(end, start) + 1;
      const count = halfLastDay ? numDays - 0.5 : numDays;
      const totalCost = count * Number(dailyRate);
      setDailyAllowance(String(totalCost));
    } else {
      setDailyAllowance("");
    }
  }, [startDate, endDate, dailyRate, halfLastDay]);

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
          archived: false,
        });

        toast({
          title: "Sucesso",
          description: "Viagem criada com sucesso!",
        });
      }

      // Limpa os campos e fecha o modal
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

  const handleEditTravel = (travel: any) => {
    setEditingTravel(travel);
    setStartDate(travel.startDate);
    setEndDate(travel.endDate);
    setSlots(String(travel.slots));
    setDestination(travel.destination);
    setDailyAllowance(String(travel.dailyAllowance));
    setDailyRate(String(travel.dailyRate));
    setHalfLastDay(travel.halfLastDay || false);
    setIsModalOpen(true);
  };

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

      const travelData = travelSnap.data();
      const totalSlots = Number(travelData.slots);
      const currentVolunteers: string[] = Array.isArray(travelData.volunteers)
        ? travelData.volunteers
        : [];

      if (currentVolunteers.includes(volunteerInfo)) {
        // Se já é voluntário, remove da lista
        const updatedVolunteers = currentVolunteers.filter(v => v !== volunteerInfo);
        await updateDoc(travelRef, {
          volunteers: updatedVolunteers,
        });

        const today = new Date();
        const travelStart = new Date(travelData.startDate + "T00:00:00");
        
        // Atualiza a contagem apenas se a viagem já começou
        if (today >= travelStart) {
          setVolunteerCounts((prev) => ({
            ...prev,
            [volunteerInfo]: Math.max((prev[volunteerInfo] || 0) - 1, 0),
          }));
        }

        toast({
          title: "Sucesso",
          description: "Você desistiu da viagem com sucesso.",
        });
        return;
      }

      if (currentVolunteers.length >= totalSlots) {
        toast({
          title: "Aviso",
          description: "Não há mais vagas disponíveis.",
        });
        return;
      }

      const updatedVolunteers = [...currentVolunteers, volunteerInfo];
      await updateDoc(travelRef, {
        volunteers: updatedVolunteers,
      });

      const today = new Date();
      const travelStart = new Date(travelData.startDate + "T00:00:00");
      
      // Atualiza a contagem apenas se a viagem já começou
      if (today >= travelStart) {
        setVolunteerCounts((prev) => ({
          ...prev,
          [volunteerInfo]: (prev[volunteerInfo] || 0) + 1,
        }));
      }

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

  const handleUnvolunteer = async (timeSlot: any) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const volunteerInfo = `${user.rank} ${user.warName}`; // Using the same format as when volunteering

      if (!volunteerInfo) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado. Por favor, faça login novamente.",
          variant: "destructive"
        });
        return;
      }

      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used - 1,
        volunteers: (timeSlot.volunteers || []).filter((v: string) => v !== volunteerInfo)
      };

      const result = await dataOperations.update(
        updatedSlot,
        {
          date: timeSlot.date,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time
        }
      );

      if (!result.success) {
        throw new Error('Failed to update time slot');
      }

      toast({
        title: "Desmarcado!",
        description: "Extra desmarcada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao desmarcar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desmarcar a Extra.",
        variant: "destructive"
      });
    }
  };

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
      "Estágio": 0
    };
    
    return rankWeights[rank] || 0;
  };

  const sortVolunteers = (volunteers: string[], slots: number) => {
    if (!volunteers?.length) return [];
    
    // Estrutura para armazenar voluntários processados
    const processedVolunteers = volunteers.map(volunteer => {
      const [rank, ...nameParts] = volunteer.split(' ');
      const name = nameParts.join(' ');
      return {
        fullName: volunteer,
        rank,
        count: volunteerCounts[volunteer] || 0,
        rankWeight: getMilitaryRankWeight(rank)
      };
    });

    // Ordena por: menor número de viagens, depois por maior patente (rankWeight)
    const sortedVolunteers = processedVolunteers.sort((a, b) => {
      if (a.count !== b.count) {
        return a.count - b.count; // Menor número de viagens primeiro
      }
      return b.rankWeight - a.rankWeight; // Maior patente primeiro em caso de empate
    });

    // Marca os primeiros 'slots' voluntários como selecionados
    return sortedVolunteers.map((volunteer, index) => ({
      ...volunteer,
      selected: index < slots
    }));
  };

  const toggleExpansion = (travelId: string) => {
    setExpandedTravels((prev) =>
      prev.includes(travelId)
        ? prev.filter((id) => id !== travelId)
        : [...prev, travelId]
    );
  };

  const formattedTravelCount = (count: number) => {
    return count === 1 ? "1 viagem" : `${count} viagens`;
  };

  return (
    <div className="p-6 space-y-8 relative">
      {/* Lista de viagens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {travels
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .map((travel) => {
            const travelStart = new Date(travel.startDate + "T00:00:00");
            const travelEnd = new Date(travel.endDate + "T00:00:00");
            const today = new Date();

            // Define cor de fundo e badge de status conforme a situação da viagem
            let cardBg = "bg-white";
            let statusBadge = null;
            if (today < travelStart) {
              // Viagem ainda não iniciou
              statusBadge = (
                <div className="absolute top-2 right-12 bg-[#3B82F6] text-white px-2 py-1 text-xs rounded">
                  Em aberto
                </div>
              );
            } else if (today >= travelStart && today <= travelEnd) {
              // Viagem em andamento
              cardBg = "bg-green-100";
              statusBadge = (
                <div className="absolute top-2 right-12 bg-green-500 text-white px-2 py-1 text-xs rounded">
                  Em transito
                </div>
              );
            } else if (today > travelEnd) {
              // Viagem encerrada
              cardBg = "bg-gray-100";
              statusBadge = (
                <div className="absolute top-2 right-12 bg-gray-300 text-gray-700 px-2 py-1 text-xs rounded">
                  Encerrada
                </div>
              );
            }

            // Calcula o número de diárias
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

            const minimalContent = (
              <div className="cursor-pointer" onClick={() => toggleExpansion(travel.id)}>
                <h3 className="text-xl font-semibold">{travel.destination}</h3>
                <p>Data Inicial: {new Date(travel.startDate + "T00:00:00").toLocaleDateString()}</p>
                <p>{diariasLine}</p>
              </div>
            );

            const fullContent = (
              <div>
                <div className="mb-2 cursor-pointer" onClick={() => toggleExpansion(travel.id)}>
                  <h3 className="text-xl font-semibold text-primary">{travel.destination}</h3>
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>Data Inicial: {new Date(travel.startDate + "T00:00:00").toLocaleDateString()}</p>
                  <p>Data Final: {new Date(travel.endDate + "T00:00:00").toLocaleDateString()}</p>
                  <p>Vagas: {travel.slots}</p>
                  <p>{diariasLine}</p>
                  {travel.volunteers && travel.volunteers.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Classificação:</h4>
                      <ul className="space-y-1">
                        {sortVolunteers(travel.volunteers, travel.slots).map((volunteer) => (
                          <li
                            key={volunteer.fullName}
                            className={`text-sm p-2 rounded flex justify-between items-center ${
                              volunteer.selected 
                                ? 'bg-green-100 border border-green-200'
                                : 'bg-gray-50 border border-gray-100'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {volunteer.selected && (
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              )}
                              <span className={`${volunteer.selected ? 'font-medium' : ''}`}>
                                {volunteer.fullName}
                              </span>
                            </div>
                            <span className={`text-xs ${volunteer.selected ? 'text-green-700' : 'text-gray-500'}`}>
                              {formattedTravelCount(volunteer.count)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {/* O botão de "Quero ser Voluntário" só aparece se a viagem ainda não iniciou */}
                {today < travelStart && !travel.archived && (
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
              >
                {/* Badge de status */}
                {statusBadge}
                {user.userType === "admin" && (
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

      {/* Modal para criar/editar viagem */}
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
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="halfLastDay"
                      checked={halfLastDay}
                      onChange={(e) => setHalfLastDay(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {halfLastDay ? "On" : "Off"}
                    </span>
                  </label>
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

      {/* Botão flutuante para administradores */}
      {user.userType === "admin" && (
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
