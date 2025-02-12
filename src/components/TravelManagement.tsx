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

    // Ordena: 
    //  1) menor diária
    //  2) maior patente
    //  3) quem chegou primeiro (appliedAtIndex)
    processed.sort((a, b) => {
      if (a.diaryCount !== b.diaryCount) {
        return a.diaryCount - b.diaryCount;  // asc
      }
      if (a.rankWeight !== b.rankWeight) {
        return b.rankWeight - a.rankWeight;  // desc
      }
      return a.appliedAtIndex - b.appliedAtIndex; // asc
    });

    return processed.map((item, idx) => {
      const isSelected = travel.isLocked ? true : idx < travel.slots; // se não está bloqueada, top 'slots' são "selecionados"
      return { ...item, isSelected };
    });
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
  // RENDER
  // ---------------------------------------------------
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min p-4">
        {travels
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .map((travel) => {
            const sortedVolunteers = getSortedVolunteers(travel);

            return (
              <Card key={travel.id} className="relative overflow-hidden bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300">
                {/* Render do restante da viagem */}
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Voluntários Ordenados */}
                    {sortedVolunteers.length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Voluntários:</h4>
                        <div className="space-y-2">
                          {sortedVolunteers.map((vol) => (
                            <div
                              key={vol.fullName}
                              className={`text-sm p-2 rounded-lg flex justify-between items-center ${vol.isSelected ? 'bg-green-50' : 'bg-gray-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                {vol.isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                )}
                                <span className={vol.isSelected ? "font-medium text-green-900" : "text-gray-700"}>{vol.fullName}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
      </div>
    </>
  );
};

export default TravelManagement;
