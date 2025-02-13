
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Plus } from "lucide-react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Travel } from "./types";
import { TravelCard } from "./TravelCard";
import { getMilitaryRankWeight, calculateDailyCount, formatTravelCount, formatDiaryCount } from "./utils";
import { CreateEditTravelModal } from "./CreateEditTravelModal";

export const TravelManagement = () => {
  // -----------------------------
  // ESTADOS
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
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);
  const [expandedTravels, setExpandedTravels] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRankingRules, setShowRankingRules] = useState(false);

  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.userType === "admin";

  // -----------------------------
  // EFEITOS
  // -----------------------------
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

        if (
          (today < travelStart && travel.isLocked) ||
          (today >= travelStart && today <= travelEnd) ||
          (today > travelEnd)
        ) {
          const finalList =
            travel.selectedVolunteers && travel.selectedVolunteers.length > 0
              ? travel.selectedVolunteers
              : travel.volunteers || [];

          finalList.forEach((volunteer: string) => {
            counts[volunteer] = (counts[volunteer] || 0) + 1;
            const dailyCount = calculateDailyCount(travel.startDate, travel.endDate, travel.halfLastDay);
            diaryCount[volunteer] = (diaryCount[volunteer] || 0) + dailyCount;
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
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const travelsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Travel[];
      setTravels(travelsData);
    });

    return () => unsubscribe();
  }, []);

  // -----------------------------
  // HANDLERS
  // -----------------------------
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
          selectedVolunteers: [],
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

  const handleToggleLock = async (travelId: string) => {
    try {
      const travelRef = doc(db, "travels", travelId);
      const travelSnap = await getDoc(travelRef);

      if (!travelSnap.exists()) return;

      const travelData = travelSnap.data() as Travel;
      const isCurrentlyLocked = travelData.isLocked ?? false;

      if (!isCurrentlyLocked) {
        const allVolunteers = travelData.volunteers ?? [];
        const processed = allVolunteers.map((volunteer) => {
          const [rank] = volunteer.split(" ");
          return {
            fullName: volunteer,
            rank,
            diaryCount: diaryCounts[volunteer] || 0,
            rankWeight: getMilitaryRankWeight(rank),
            appliedAtIndex: travelData.volunteers.indexOf(volunteer),
          };
        });

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

  const getSortedVolunteers = (travel: Travel) => {
    const baseList = travel.isLocked
      ? travel.selectedVolunteers || []
      : travel.volunteers || [];

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

    const totalSlots = travel.slots || 1;
    const isLocked = travel.isLocked;

    processed.sort((a, b) => {
      if (a.diaryCount !== b.diaryCount) {
        return a.diaryCount - b.diaryCount;
      }
      if (a.rankWeight !== b.rankWeight) {
        return b.rankWeight - a.rankWeight;
      }
      return a.appliedAtIndex - b.appliedAtIndex;
    });

    return processed.map((item, idx) => ({
      ...item,
      isSelected: isLocked ? true : idx < totalSlots,
    }));
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <>
      {showRankingRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="p-6 bg-white shadow-xl max-w-md w-full relative border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Regras de Ordenação</h2>
            <ol className="list-decimal list-inside text-sm space-y-2 text-gray-600">
              <li>Menor quantidade de diárias primeiro.</li>
              <li>Em caso de empate, graduação mais antiga (peso maior) fica acima.</li>
              <li>Se ainda houver empate, quem se inscreveu primeiro fica acima.</li>
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
            const dailyCount = calculateDailyCount(travel.startDate, travel.endDate, travel.halfLastDay);
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
              if (travel.isLocked) {
                statusBadge = (
                  <div className={`absolute top-3 ${rightPos} bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 text-xs rounded-full shadow-sm`}>
                    Processando diária
                  </div>
                );
              } else {
                statusBadge = (
                  <div className={`absolute top-3 ${rightPos} bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 text-xs rounded-full shadow-sm`}>
                    Em aberto
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
              <TravelCard
                key={travel.id}
                travel={travel}
                isAdmin={isAdmin}
                user={user}
                formattedCount={formattedCount}
                totalCost={totalCost}
                cardBg={cardBg}
                statusBadge={statusBadge}
                volunteerCounts={volunteerCounts}
                diaryCounts={diaryCounts}
                sortedVolunteers={getSortedVolunteers(travel)}
                onEdit={handleEditTravel}
                onDelete={handleDeleteTravel}
                onArchive={handleArchive}
                onToggleLock={handleToggleLock}
                onVolunteer={handleVolunteer}
                formattedTravelCount={formatTravelCount}
                formattedDiaryCount={formatDiaryCount}
              />
            );
          })}
      </div>

      {isAdmin && (
        <Button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 rounded-full p-4 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {isModalOpen && (
        <CreateEditTravelModal
          editingTravel={editingTravel}
          startDate={startDate}
          endDate={endDate}
          slots={slots}
          destination={destination}
          dailyAllowance={dailyAllowance}
          dailyRate={dailyRate}
          halfLastDay={halfLastDay}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setSlots={setSlots}
          setDestination={setDestination}
          setDailyAllowance={setDailyAllowance}
          setDailyRate={setDaily