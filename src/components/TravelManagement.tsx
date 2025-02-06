Aqui está o código corrigido e atualizado com base nas suas solicitações. As principais correções incluem:

1. **Correção das datas exibidas no contêiner**: Ajuste para garantir que as datas inicial e final sejam exibidas corretamente, sem subtrair um dia.
2. **Correção do contador de viagens**: Formatação dinâmica para diferenciar entre singular ("viagem") e plural ("viagens").

---

### Código Corrigido

```javascript
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
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
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
  const [dailyAllowance, setDailyAllowance] = useState("");
  const [isEditingAllowance, setIsEditingAllowance] = useState(false);
  const [travels, setTravels] = useState([]);
  const [volunteerCounts, setVolunteerCounts] = useState<{ [key: string]: number }>({});
  const [editingTravel, setEditingTravel] = useState(null);
  // Estado para controlar a expansão dos contêineres arquivados
  const [expandedTravels, setExpandedTravels] = useState([]);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = differenceInDays(end, start) + 1;
      setDailyAllowance(String(days));
    }
  }, [startDate, endDate]);

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
          dailyAllowance: Number(dailyAllowance),
          updatedAt: new Date(),
          // Mantém o status de arquivamento, se existir
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
      // Assegure-se de que travelData.slots seja um número
      const totalSlots = Number(travelData.slots);
      // Garantindo que o campo volunteers seja um array
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

  return (
    <>
      {user.userType === "admin" && (
        <form onSubmit={handleCreateTravel}>
          <h2>{editingTravel ? "Editar Viagem" : "Criar Nova Viagem"}</h2>
          <Label>Destino</Label>
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
            className="w-full"
            placeholder="Digite o destino"
          />
          <Label>Data Inicial</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full"
          />
          <Label>Data Final</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full"
          />
          <Label>Número de Vagas</Label>
          <Input
            type="number"
            value={slots}
            onChange={(e) => setSlots(e.target.value)}
            required
            className="w-full"
            min="1"
          />
          <Label>Diárias</Label>
          <Input
            type="number"
            value={dailyAllowance}
            onChange={(e) => setDailyAllowance(e.target.value)}
            className="w-full"
          />
          <Button type="submit">
            {editingTravel ? "Salvar Alterações" : "Criar Viagem"}
          </Button>
          {editingTravel && (
            <Button
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
        </form>
      )}
      {travels.map((travel) => {
        // Se a viagem estiver arquivada, usamos o estado para definir se ela está expandida
        const isArchived = travel.archived;
        const isExpanded = expandedTravels.includes(travel.id);
        const travelDate = new Date(travel.startDate);
        const today = new Date();
        const showVolunteerButton = travelDate > today && !isArchived;
        const sortedVolunteers = travel.volunteers
          ? sortVolunteers(travel.volunteers)
          : [];

        // Para viagens arquivadas, se não estiver expandida, mostra apenas informações mínimas
        const minimalContent = (
          <div onClick={() => toggleExpansion(travel.id)}>
            <strong>{travel.destination}</strong>
            <p>
              Data Inicial:{" "}
              {new Date(
                new Date(travel.startDate).setHours(0, 0, 0, 0)
              ).toLocaleDateString()}
            </p>
            <p>Diárias: {travel.dailyAllowance}</p>
          </div>
        );

        // Conteúdo completo (similar ao atual) com as demais informações
        const fullContent = (
          <div onClick={isArchived ? () => toggleExpansion(travel.id) : undefined}>
            <h3>{travel.destination}</h3>
            <p>
              Data Inicial:{" "}
              {new Date(
                new Date(travel.startDate).setHours(0, 0, 0, 0)
              ).toLocaleDateString()}
            </p>
            <p>
              Data Final:{" "}
              {new Date(
                new Date(travel.endDate).setHours(0, 0, 0, 0)
              ).toLocaleDateString()}
            </p>
            <p>Vagas: {travel.slots}</p>
            <p>Diárias: {travel.dailyAllowance}</p>
            {travel.volunteers && travel.volunteers.length > 0 && (
              <div>
                <p>Voluntários (ordenados por menor número de viagens):</p>
                {sortedVolunteers.map((volunteerName: string) => (
                  <div key={volunteerName}>
                    <strong>{volunteerName}</strong>:{" "}
                    {volunteerCounts[volunteerName] || 0}{" "}
                    {volunteerCounts[volunteerName] === 1
                      ? "viagem"
                      : "viagens"}
                  </div>
                ))}
              </div>
            )}
            {showVolunteerButton && (
              <Button
                onClick={() => handleVolunteer(travel.id)}
                className="w-full"
                variant={travel.volunteers?.includes(user.name) ? "secondary" : "default"}
                disabled={travel.volunteers?.includes(user.name)}
              >
                {travel.volunteers?.includes(user.name) ? "Já Inscrito" : "Quero ser Voluntário"}
              </Button>
            )}
          </div>
        );

        return (
          <Card
            key={travel.id}
            onClick={isArchived && !isExpanded ? () => toggleExpansion(travel.id) : undefined}
            className={`p-6 hover:shadow-xl transition-shadow relative ${
              isArchived ? "bg-gray-200 cursor-pointer" : "bg-white"
            }`}
          >
            {user.userType === "admin" && (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleEditTravel(travel)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteTravel(travel.id)}>
                    Excluir
                  </DropdownMenuItem>
                  {/* Item de arquivar */}
                  <DropdownMenuItem onClick={() => handleArchive(travel.id, true)}>
                    Arquivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isArchived && !isExpanded ? minimalContent : fullContent}
          </Card>
        );
      })}
    </>
  );
};
```

---

### Principais Alterações:
1. **Datas Corrigidas**:
   - Adicionado `setHours(0, 0, 0, 0)` para evitar deslocamentos de fuso horário.

2. **Contador de Viagens**:
   - Substituído `"viagem(ns)"` por uma condição que verifica se o número de viagens é igual a 1 ou maior.

Se precisar de mais ajustes, estou à disposição! 😊
