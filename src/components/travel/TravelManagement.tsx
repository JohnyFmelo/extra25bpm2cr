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

// Add interface for expanded user info
interface UserInfo {
  rank: string;
  warName: string;
  rankSeniority: number; // Data de antiguidade na graduação (timestamp)
}

export const TravelManagement = () => {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [showRankingRules, setShowRankingRules] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);
  const [diaryCounts, setDiaryCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const isAdmin = true; // Supondo que você tem uma maneira de verificar se o usuário é administrador

  useEffect(() => {
    const q = query(collection(db, "travels"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const travelsData: Travel[] = [];
      querySnapshot.forEach((doc) => {
        travelsData.push({ id: doc.id, ...doc.data() } as Travel);
      });
      setTravels(travelsData);
    });

    return () => unsubscribe();
  }, []);

  const getSortedVolunteers = (travel: Travel) => {
    const baseList = travel.isLocked ? travel.selectedVolunteers || [] : travel.volunteers || [];
    const processed = baseList.map((volunteer) => {
      const [rank] = volunteer.split(" ");
      const volunteerUser = JSON.parse(localStorage.getItem(`user_${volunteer}`) || "{}") as UserInfo;
      return {
        fullName: volunteer,
        rank,
        diaryCount: diaryCounts[volunteer] || 0,
        rankWeight: getMilitaryRankWeight(rank),
        rankSeniority: volunteerUser.rankSeniority || 0, // Timestamp da antiguidade na graduação
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
      if (a.rankSeniority !== b.rankSeniority && a.rank === b.rank) {
        return a.rankSeniority - b.rankSeniority;
      }
      return a.appliedAtIndex - b.appliedAtIndex;
    });

    return processed.map((item, idx) => ({
      item,
      isSelected: isLocked ? true : idx < totalSlots,
    }));
  };

  const handleVolunteer = async (travelId: string) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}") as UserInfo;
      const volunteerInfo = `${userInfo.rank} ${userInfo.warName}`;
      if (!volunteerInfo) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado. Por favor, faça login novamente.",
          variant: "destructive"
        });
        return;
      }

      localStorage.setItem(`user_${volunteerInfo}`, JSON.stringify({
        rank: userInfo.rank,
        warName: userInfo.warName,
        rankSeniority: userInfo.rankSeniority
      }));

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
          volunteers: updatedVolunteers,
        });
        localStorage.removeItem(`user_${volunteerInfo}`);
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

  return (
    <>
      {showRankingRules && (
        <div>
          Regras de Ordenação:
          <ul>
            <li>Menor quantidade de diárias primeiro.</li>
            <li>Em caso de empate, graduação mais antiga (peso maior) fica acima.</li>
            <li>Se ainda houver empate, quem se inscreveu primeiro fica acima.</li>
          </ul>
          <button onClick={() => setShowRankingRules(false)}>Fechar</button>
        </div>
      )}
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

          if (today < travelStart) {
            if (travel.isLocked) {
              statusBadge = <span>Processando diária</span>;
            } else {
              statusBadge = <span>Em aberto</span>;
            }
          } else if (today >= travelStart && today <= travelEnd) {
            cardBg = "bg-gradient-to-br from-green-50 to-green-100";
            statusBadge = <span>Em transito</span>;
          } else if (today > travelEnd) {
            cardBg = "bg-gradient-to-br from-gray-50 to-gray-100";
            statusBadge = <span>Encerrada</span>;
          }

          return (
            <Card key={travel.id} className={cardBg}>
              {/* Render other travel details here */}
              <Button onClick={() => handleToggleLock(travel.id)}>{travel.isLocked ? "Reabrir" : "Bloquear"}</Button>
            </Card>
          );
        })}
      {isAdmin && (
        <Button onClick={() => setIsModalOpen(true)} className="fixed bottom-6 right-6 rounded-full p-4 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          +
        </Button>
      )}
      {isModalOpen && (
        <CreateEditTravelModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTravel(null);
          }}
          editingTravel={editingTravel}
        />
      )}
    </>
  );
};

export default TravelManagement;
