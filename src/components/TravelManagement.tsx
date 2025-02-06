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
  deleteDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
// Removemos o import do differenceInDays, pois não iremos recalcular diárias automaticamente.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Archive } from "lucide-react";

export const TravelManagement = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [slots, setSlots] = useState("");
  const [destination, setDestination] = useState("");
  // O valor de diárias é agora definido manualmente (ou calculado uma única vez, se desejado)
  const [dailyAllowance, setDailyAllowance] = useState("");
  const [isEditingAllowance, setIsEditingAllowance] = useState(false);
  const [travels, setTravels] = useState<any[]>([]);
  const [volunteerCounts, setVolunteerCounts] = useState<{ [key: string]: number }>({});
  const [editingTravel, setEditingTravel] = useState<any>(null);
  // Estado para controlar a expansão dos contêineres de viagens arquivadas
  const [expandedTravels, setExpandedTravels] = useState<string[]>([]);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Busca a contagem de voluntários (permanece igual)
  useEffect(() => {
    const fetchVolunteerCounts = async () => {
      try {
        const travelsRef = collection(db, "travels");
        const travelsSnapshot = await getDocs(travelsRef);
        const counts: { [key: string]: number } = {};

        travelsSnapshot.docs.forEach((doc) => {
          const travel = doc.data();
          if (travel.volunteers) {
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

  // Escuta em tempo real dos documentos
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

  // Removemos o useEffect que recalculava dailyAllowance a partir das datas

  // Efeito para arquivar automaticamente viagens que já terminaram (data final < hoje)
  useEffect(() => {
    const now = new Date();
    travels.forEach(travel => {
      if (!travel.archived) {
        const end = new Date(travel.endDate);
        if (end < now) {
          const travelRef = doc(db, "travels", travel.id);
          updateDoc(travelRef, { archived: true })
            .catch(err => console.error("Erro ao arquivar automaticamente:", err));
        }
      }
    });
  }, [travels]);

  const handleCreateTravel = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTravel) {
        // Nas edições, as datas permanecem inalteradas (o usuário pode alterar outros campos, como diárias)
        const travelRef = doc(db, "travels", editingTravel.id);
        await updateDoc(travelRef, {
          // Não atualizamos as datas se o objetivo é mantê-las imutáveis
          // startDate e endDate permanecem os mesmos
          slots: Number(slots),
          destination,
          dailyAllowance: Number(dailyAllowance),
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
          // Aqui, você pode optar por calcular a diária uma única vez no momento da criação
          dailyAllowance: Number(dailyAllowance),
          createdAt: new Date(),
          volunteers: [],
          archived: false,
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
    // Ao editar, as datas não são alteradas
    setStartDate(travel.startDate);
    setEndDate(travel.endDate);
    setSlots(String(travel.slots));
    setDestination(travel.destination);
    setDailyAllowance(String(travel.dailyAllowance));
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
    console.log("User:", user);
    try {
      const travelRef = doc(db, "travels", travelId);
      const travelSnap = await getDoc(travelRef);

      if (!travelSnap.exists()) {
        throw new Error("Viagem não encontrada");
      }

      const travelData = travelSnap.data();
      console.log("Travel Data:", travelData);

      const totalSlots = Number(travelData.slots);
      const currentVolunteers: string[] = Array.isArray(travelData.volunteers)
        ? travelData.volunteers
        : [];

      if (currentVolunteers.includes(user.name)) {
        toast({
          title: "Aviso",
          description: "Você já é voluntário desta viagem.",
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

      const updatedVolunteers = [...currentVolunteers, user.name];
      console.log("Updated Volunteers:", updatedVolunteers);
      await updateDoc(travelRef, {
        volunteers: updatedVolunteers,
      });

      setVolunteerCounts((prev) => ({
        ...prev,
        [user.name]: (prev[user.name] || 0) + 1,
      }));

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

  const handleUpdateDailyAllowance = async (travelId: string, newAllowance: string) => {
    try {
      const travelRef = doc(db, "travels", travelId);
      await updateDoc(travelRef, {
        dailyAllowance: Number(newAllowance),
      });
      setIsEditingAllowance(false);
      toast({
        title: "Sucesso",
        description: "Diárias atualizadas com sucesso!",
      });
    } catch (error) {
      console.error("Error updating daily allowance:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar diárias.",
        variant: "destructive",
      });
    }
  };

  const sortVolunteers = (volunteers: string[]) => {
    return [...volunteers].sort((a, b) => {
      const countA = volunteerCounts[a] || 0;
      const countB = volunteerCounts[b] || 0;
      return countA - countB;
    });
  };

  // Função para alternar a expansão dos contêineres de viagens arquivadas
  const toggleExpansion = (travelId: string) => {
    setExpandedTravels((prev) =>
      prev.includes(travelId)
        ? prev.filter((id) => id !== travelId)
        : [...prev, travelId]
    );
  };

  // Separa as viagens não arquivadas e as arquivadas
  const now = new Date();
  const nonArchivedTravels = travels.filter(travel => !travel.archived);
  const archivedTravels = travels.filter(travel => travel.archived);

  return (
    <div className="p-6 space-y-8">
      {user.userType === "admin" && (
        <Card className="p-6 bg-white shadow-lg">
          <form onSubmit={handleCreateTravel} className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary">
              {editingTravel ? "Editar Viagem" : "Criar Nova Viagem"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="destination">Destino</Label>
                <Input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  className="w-full"
                  placeholder="Digite o destino"
                />
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="slots">Número de Vagas</Label>
                <Input
                  id="slots"
                  type="number"
                  value={slots}
                  onChange={(e) => setSlots(e.target.value)}
                  required
                  className="w-full"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyAllowance">Diárias</Label>
                <Input
                  id="dailyAllowance"
                  type="number"
                  value={dailyAllowance}
                  onChange={(e) => setDailyAllowance(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="w-full md:w-auto">
                {editingTravel ? "Salvar Alterações" : "Criar Viagem"}
              </Button>
              {editingTravel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingTravel(null);
                    setStartDate("");
                    setEndDate("");
                    setSlots("");
                    setDestination("");
                    setDailyAllowance("");
                  }}
                  className="w-full md:w-auto"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      {/* Seção de viagens não arquivadas (inclui viagens em vigor e próximas) */}
      <div className="space-y-4">
        {nonArchivedTravels.map((travel) => {
          const start = new Date(travel.startDate);
          const end = new Date(travel.endDate);
          // Viagem em vigor: já começou e ainda não terminou
          const isOngoing = start <= now && end >= now;
          // Viagem que ainda não começou
          const isUpcoming = start > now;
          // Define a cor do contêiner: verde para viagens em vigor, branco para as demais
          const containerClass = isOngoing ? "bg-green-200" : "bg-white";
          
          // Para viagens não arquivadas, exibimos o conteúdo completo
          const fullContent = (
            <div>
              <div className="mb-2">
                <h3 className="text-xl font-semibold text-primary">{travel.destination}</h3>
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>Data Inicial: {new Date(travel.startDate).toLocaleDateString()}</p>
                <p>Data Final: {new Date(travel.endDate).toLocaleDateString()}</p>
                <p>Vagas: {travel.slots}</p>
                <p>Diárias: {travel.dailyAllowance}</p>
                {travel.volunteers && travel.volunteers.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">
                      Voluntários (ordenados por menor número de viagens):
                    </h4>
                    <ul className="space-y-1">
                      {sortVolunteers(travel.volunteers).map((volunteerName: string) => (
                        <li
                          key={volunteerName}
                          className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex justify-between items-center"
                        >
                          <span>{volunteerName}</span>
                          <span className="text-xs text-gray-500">
                            {volunteerCounts[volunteerName] || 0} viagem(ns)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {/* Exibe o botão de voluntariado apenas para viagens que ainda não iniciaram */}
              {isUpcoming && (
                <div className="mt-4">
                  <Button
                    onClick={() => handleVolunteer(travel.id)}
                    className="w-full"
                    variant={travel.volunteers?.includes(user.name) ? "secondary" : "default"}
                    disabled={travel.volunteers?.includes(user.name)}
                  >
                    {travel.volunteers?.includes(user.name) ? "Já Inscrito" : "Quero ser Voluntário"}
                  </Button>
                </div>
              )}
            </div>
          );

          return (
            <Card
              key={travel.id}
              className={`p-6 hover:shadow-xl transition-shadow relative ${containerClass}`}
            >
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
              <div className="space-y-4">{fullContent}</div>
            </Card>
          );
        })}
      </div>

      {/* Seção de viagens arquivadas */}
      {archivedTravels.length > 0 && (
        <div className="pt-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Viagens Arquivadas</h2>
          <div className="space-y-4">
            {archivedTravels.map((travel) => {
              const isExpanded = expandedTravels.includes(travel.id);
              // Conteúdo mínimo: apenas nome, data inicial e diárias
              const minimalContent = (
                <div className="cursor-pointer" onClick={() => toggleExpansion(travel.id)}>
                  <h3 className="text-xl font-semibold">{travel.destination}</h3>
                  <p>Data Inicial: {new Date(travel.startDate).toLocaleDateString()}</p>
                  <p>Diárias: {travel.dailyAllowance}</p>
                </div>
              );

              // Conteúdo completo: todas as informações da viagem
              const fullContent = (
                <div>
                  <div className="mb-2 cursor-pointer" onClick={() => toggleExpansion(travel.id)}>
                    <h3 className="text-xl font-semibold text-primary">{travel.destination}</h3>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>Data Inicial: {new Date(travel.startDate).toLocaleDateString()}</p>
                    <p>Data Final: {new Date(travel.endDate).toLocaleDateString()}</p>
                    <p>Vagas: {travel.slots}</p>
                    <p>Diárias: {travel.dailyAllowance}</p>
                    {travel.volunteers && travel.volunteers.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                          Voluntários (ordenados por menor número de viagens):
                        </h4>
                        <ul className="space-y-1">
                          {sortVolunteers(travel.volunteers).map((volunteerName: string) => (
                            <li
                              key={volunteerName}
                              className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex justify-between items-center"
                            >
                              <span>{volunteerName}</span>
                              <span className="text-xs text-gray-500">
                                {volunteerCounts[volunteerName] || 0} viagem(ns)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );

              return (
                <Card
                  key={travel.id}
                  className="p-6 bg-gray-200 hover:shadow-xl transition-shadow relative cursor-pointer"
                  onClick={() => toggleExpansion(travel.id)}
                >
                  <div className="space-y-4">
                    {isExpanded ? fullContent : minimalContent}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
