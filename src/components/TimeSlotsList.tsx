import React, { useState, useEffect } from "react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRoundCog, CalendarDays, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";

// Definição da interface TimeSlot
interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[];
}

// Definição da interface GroupedTimeSlots, agora incluindo dailyCost
interface GroupedTimeSlots {
  [key: string]: {
    slots: TimeSlot[];
    dailyCost: number; // Adicionado dailyCost para cada data
  };
}

// Componente TimeSlotLimitControl
const TimeSlotLimitControl = ({
  slotLimit,
  onUpdateLimit,
  userSlotCount = 0,
  isAdmin = false
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLimit, setCustomLimit] = useState("");
  const predefinedLimits = [1, 2, 3, 4];

  const handleCustomLimitSubmit = () => {
    const limit = parseInt(customLimit);
    if (!isNaN(limit) && limit > 0) {
      onUpdateLimit(limit);
      setShowCustomInput(false);
      setCustomLimit("");
    }
  };

  return (
    <div className="w-full space-y-4">
      {!isAdmin && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              {userSlotCount >= slotLimit ? (
                <p className="text-orange-600 font-medium">Horários esgotados</p>
              ) : (
                <p className="text-gray-700">
                  Escolha {slotLimit - userSlotCount} {slotLimit - userSlotCount === 1 ? 'horário' : 'horários'}
                </p>
              )}
              <p className="text-sm text-gray-500">
                {userSlotCount} de {slotLimit} horários preenchidos
              </p>
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-medium">{userSlotCount}/{slotLimit}</span>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Limite de horários por usuário</h3>
              <UserRoundCog className="h-5 w-5 text-gray-500" />
            </div>

            <div className="flex gap-2">
              {predefinedLimits.map((limit) => (
                <Button
                  key={limit}
                  onClick={() => onUpdateLimit(limit)}
                  variant={slotLimit === limit ? "default" : "outline"}
                  className="flex-1"
                >
                  {limit}
                </Button>
              ))}
              <Button
                onClick={() => setShowCustomInput(true)}
                variant="outline"
                className="flex-1"
              >
                +
              </Button>
            </div>
          </div>

          <Dialog open={showCustomInput} onOpenChange={setShowCustomInput}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Definir limite personalizado</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="1"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(e.target.value)}
                    placeholder="Digite o limite de horários"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomInput(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCustomLimitSubmit}>
                    Confirmar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

// Função getMilitaryRankWeight (mantido como antes)
const getMilitaryRankWeight = (rank: string): number => {
  const rankWeights: { [key: string]: number } = {
    "Cel": 12, "Cel PM": 12, "Ten Cel": 11, "Ten Cel PM": 11, "Maj": 10, "Maj PM": 10, "Cap": 9, "Cap PM": 9,
    "1° Ten": 8, "1° Ten PM": 8, "2° Ten": 7, "2° Ten PM": 7, "Sub Ten": 6, "Sub Ten PM": 6,
    "1° Sgt": 5, "1° Sgt PM": 5, "2° Sgt": 4, "2° Sgt PM": 4, "3° Sgt": 3, "3° Sgt PM": 3,
    "Cb": 2, "Cb PM": 2, "Sd": 1, "Sd PM": 1, "Estágio": 0,
  };
  return rankWeights[rank] || 0;
};

// Função getRankCategory para determinar a categoria da patente e o valor por hora
const getRankCategory = (rank: string): { category: string; hourlyRate: number } => {
  const cbSdRanks = ["Sd", "Sd PM", "Cb", "Cb PM"];
  // Correção: Adicionado todas as patentes de Sgt e SubTen na categoria correta
  const stSgtRanks = ["3° Sgt", "3° Sgt PM", "2° Sgt", "2° Sgt PM", "1° Sgt", "1° Sgt PM", "Sub Ten", "Sub Ten PM", "Sub Ten", "Sub Ten PM"];
  const oficiaisRanks = ["2° Ten", "2° Ten PM", "1° Ten", "1° Ten PM", "Cap", "Cap PM", "Maj", "Maj PM", "Ten Cel", "Ten Cel PM", "Cel", "Cel PM"];

  if (cbSdRanks.includes(rank)) return { category: "Cb/Sd", hourlyRate: 41.13 };
  if (stSgtRanks.includes(rank)) return { category: "St/Sgt", hourlyRate: 56.28 };
  if (oficiaisRanks.includes(rank)) return { category: "Oficiais", hourlyRate: 87.02 };
  return { category: "Outros", hourlyRate: 0 }; // Categoria padrão e valor 0 para outras patentes
};

// Componente TimeSlotsList
const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slotLimit, setSlotLimit] = useState<number>(0);
  const { toast } = useToast();
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  const isAdmin = userData?.userType === 'admin';

  const calculateTimeDifference = (startTime: string, endTime: string): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);

    if (endHour < startHour || (endHour === 0 && startHour > 0)) {
      endHour += 24;
    }

    let diffHours = endHour - startHour;
    let diffMinutes = endMinute - startMinute;

    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }

    const totalHours = diffHours + (diffMinutes / 60); // Total de horas, incluindo frações

    return `${totalHours}`; // Retorna o total de horas como string para cálculo de custo
  };

  useEffect(() => {
    const fetchSlotLimit = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'slotLimit'));
        if (settingsDoc.exists()) {
          setSlotLimit(settingsDoc.data().value || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar limite de slots:', error);
      }
    };

    fetchSlotLimit();

    setIsLoading(true);
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          volunteers: data.volunteers || [],
          slots_used: data.slots_used || 0,
          total_slots: data.total_slots || data.slots || 0,
        };
      });
      setTimeSlots(formattedSlots);
      setIsLoading(false);
    }, (error) => {
      console.error('Erro ao ouvir horários:', error);
      toast({
        title: "Erro ao atualizar horários",
        description: "Não foi possível receber atualizações em tempo real.",
        variant: "destructive"
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleVolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    const userSlotCount = timeSlots.reduce((count, slot) =>
      slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0
    );

    if (userSlotCount >= slotLimit && !isAdmin) {
      toast({
        title: "Limite atingido!🚫",
        description: `Você atingiu o limite de ${slotLimit} horário${slotLimit === 1 ? '' : 's'} por usuário.`,
        variant: "destructive"
      });
      return;
    }

    const slotsForDate = timeSlots.filter(slot => slot.date === timeSlot.date);
    const isAlreadyRegistered = slotsForDate.some(slot =>
      slot.volunteers?.includes(volunteerName)
    );

    if (isAlreadyRegistered) {
      toast({
        title: "Erro ⛔",
        description: "Você já está registrado em um horário nesta data.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used + 1,
        volunteers: [...(timeSlot.volunteers || []), volunteerName]
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
        throw new Error('Falha ao atualizar o horário');
      }

      toast({
        title: "Sucesso!✅🤠",
        description: "Extra marcada. Aguarde a escala."
      });
    } catch (error) {
      console.error('Erro ao voluntariar:', error);
      toast({
        title: "Erro 🤔",
        description: "Não foi possível reservar a Extra.",
        variant: "destructive"
      });
    }
  };

  const handleUnvolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({
        title: "Erro 🤔",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used - 1,
        volunteers: (timeSlot.volunteers || []).filter(v => v !== volunteerName)
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
        throw new Error('Falha ao atualizar o horário');
      }

      toast({
        title: "Desmarcado! 👀🤔",
        description: "Extra desmarcada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao desmarcar:', error);
      toast({
        title: "Erro ⛔",
        description: "Não foi possível desmarcar a Extra.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSlotLimit = async (limit: number) => {
    if (isNaN(limit) || limit < 0) {
      toast({
        title: "Erro 😵‍💫",
        description: "Por favor, insira um número válido.",
        variant: "destructive"
      });
      return;
    }

    try {
      await setDoc(doc(db, 'settings', 'slotLimit'), { value: limit });
      setSlotLimit(limit);
      toast({
        title: "Sucesso",
        description: "Limite de horários atualizado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao atualizar limite de slots:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o limite de horários.",
        variant: "destructive"
      });
    }
  };

  // Modificado groupTimeSlotsByDate para calcular dailyCost
  const groupTimeSlotsByDate = (slots: TimeSlot[]): GroupedTimeSlots => {
    return slots.reduce((groups: GroupedTimeSlots, slot) => {
      const date = slot.date;
      if (!groups[date]) {
        groups[date] = { slots: [], dailyCost: 0 }; // Inicializa com slots e dailyCost
      }
      groups[date].slots.push(slot);
      return groups;
    }, {});
  };

  const isVolunteered = (timeSlot: TimeSlot) => {
    return timeSlot.volunteers?.includes(volunteerName);
  };

  const isSlotFull = (timeSlot: TimeSlot) => {
    return timeSlot.slots_used === timeSlot.total_slots;
  };

  const formatDateHeader = (date: string) => {
    return format(parseISO(date), "EEE - dd/MM/yyyy", { locale: ptBR })
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const shouldShowVolunteerButton = (slot: TimeSlot) => {
    const userDataString = localStorage.getItem('user');
    const userData = userDataString ? JSON.parse(userDataString) : null;

    if (userData?.rank === "Estágio") {
      return false;
    }

    if (isVolunteered(slot)) {
      return true;
    }

    if (isSlotFull(slot)) {
      return true;
    }

    const userSlotCount = timeSlots.reduce((count, s) =>
      s.volunteers?.includes(volunteerName) ? count + 1 : count, 0
    );

    if (userSlotCount >= slotLimit && !isAdmin) {
      return false;
    }

    const slotsForDate = timeSlots.filter(s => s.date === timeSlot.date);
    const isVolunteeredForDate = slotsForDate.some(s =>
      s.volunteers?.includes(volunteerName)
    );

    return !isVolunteeredForDate;
  };

  const canVolunteerForSlot = (slot: TimeSlot) => {
    if (isAdmin) return true;

    const userSlotCount = timeSlots.reduce((count, s) =>
      s.volunteers?.includes(volunteerName) ? count + 1 : count, 0
    );

    return userSlotCount < slotLimit;
  };

  const sortVolunteers = (volunteers: string[]) => {
    if (!volunteers) return [];

    return volunteers.sort((a, b) => {
      const rankA = a.split(" ")[0];
      const rankB = b.split(" ")[0];
      return getMilitaryRankWeight(rankB) - getMilitaryRankWeight(rankA);
    });
  };

  // Calcula groupedTimeSlots e dailyCost dentro do useEffect para usar timeSlots atualizado
  const [calculatedGroupedTimeSlots, setCalculatedGroupedTimeSlots] = useState<GroupedTimeSlots>({});
  useEffect(() => {
    const grouped = groupTimeSlotsByDate(timeSlots);
    let totalCostCounter = { "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Total Geral": 0 };

    Object.keys(grouped).forEach(date => {
      let dailyCost = 0;
      grouped[date].slots.forEach(slot => {
        slot.volunteers?.forEach(volunteerFullName => {
          const volunteerRank = volunteerFullName.split(" ")[0];
          const rankInfo = getRankCategory(volunteerRank);
          const hours = parseFloat(calculateTimeDifference(slot.start_time, slot.end_time));
          const slotCost = hours * rankInfo.hourlyRate;
          dailyCost += slotCost;
          totalCostCounter[rankInfo.category] = (totalCostCounter[rankInfo.category] || 0) + slotCost;
          totalCostCounter["Total Geral"] = (totalCostCounter["Total Geral"] || 0) + slotCost;
        });
      });
      grouped[date].dailyCost = dailyCost; // Adiciona dailyCost ao grupo de datas
    });
    setCalculatedGroupedTimeSlots(grouped);
    setTotalCostSummary(totalCostCounter); // Atualiza o resumo total de custos
  }, [timeSlots]);


  const userSlotCount = timeSlots.reduce((count, slot) =>
    slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0
  );

  const [volunteerToRemove, setVolunteerToRemove] = useState<{ name: string; timeSlot: TimeSlot } | null>(null);

  const handleRemoveVolunteer = async (timeSlot: TimeSlot, volunteerName: string) => {
    try {
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used - 1,
        volunteers: (timeSlot.volunteers || []).filter(v => v !== volunteerName)
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
        throw new Error('Falha ao remover voluntário');
      }

      toast({
        title: "Sucesso! ✅",
        description: `${volunteerName} foi removido deste horário.`
      });
    } catch (error) {
      console.error('Erro ao remover voluntário:', error);
      toast({
        title: "Erro ⛔",
        description: "Não foi possível remover o voluntário.",
        variant: "destructive"
      });
    }
  };

  const [totalCostSummary, setTotalCostSummary] = useState<{ "Cb/Sd": number, "St/Sgt": number, "Oficiais": number, "Total Geral": number }>({ "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Total Geral": 0 });


  if (isLoading) {
    return <div className="p-4">Carregando horários...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <TimeSlotLimitControl
        slotLimit={slotLimit}
        onUpdateLimit={handleUpdateSlotLimit}
        userSlotCount={userSlotCount}
        isAdmin={isAdmin}
      />

      {Object.entries(calculatedGroupedTimeSlots).sort().map(([date, groupedData]) => {
        const { slots, dailyCost } = groupedData;
        const isDatePast = isPast(parseISO(date));
        const isCollapsed = isDatePast;
        const sortedSlots = [...slots].sort((a, b) => {
          const timeA = a.start_time;
          const timeB = b.start_time;
          return timeA.localeCompare(timeB);
        });

        return (
          <div key={date} className="bg-white rounded-lg shadow-sm">
            <div className="p-4 md:p-5">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className={`h-5 w-5 ${isDatePast ? 'text-gray-500' : 'text-blue-500'}`} />
                    <h3 className="font-medium text-lg text-gray-800">
                      {formatDateHeader(date)}
                    </h3>
                    {isAdmin && <span className="text-sm text-green-600 font-semibold">R$ {dailyCost.toFixed(2)}</span>} {/* Exibe o custo diário para admins */}
                  </div>
                  <Badge variant={isDatePast ? "outline" : "secondary"} className={`${isDatePast ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                    {isDatePast ? "Extra Encerrada" : "Extra"}
                  </Badge>
                </div>
              </div>

              {!isCollapsed && (
                <div className="space-y-3 mt-4">
                  {sortedSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`border rounded-lg p-4 space-y-2 transition-all ${isSlotFull(slot) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <p className="font-medium text-gray-900">
                              {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)} - {calculateTimeDifference(slot.start_time, slot.end_time).slice(0,4)} Horas
                            </p>
                          </div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${isSlotFull(slot) ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            <span className="text-sm font-medium">
                              {isSlotFull(slot)
                                ? 'Vagas Esgotadas'
                                : `${slot.total_slots - slot.slots_used} ${slot.total_slots - slot.slots_used === 1 ? 'vaga disponível' : 'vagas disponíveis'}`
                              }
                            </span>
                          </div>
                        </div>
                        {shouldShowVolunteerButton(slot) && (
                          isVolunteered(slot) ? (
                            <Button
                              onClick={() => handleUnvolunteer(slot)}
                              variant="destructive"
                              size="sm"
                              className="shadow-sm hover:shadow"
                            >
                              Desmarcar
                            </Button>
                          ) : !isSlotFull(slot) && canVolunteerForSlot(slot) && (
                            <Button
                              onClick={() => handleVolunteer(slot)}
                              className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow"
                              size="sm"
                            >
                              Voluntário
                            </Button>
                          )
                        )}
                      </div>
                      {slot.volunteers && slot.volunteers.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium mb-2 text-gray-700">Voluntários:</p>
                          <div className="space-y-1">
                            {sortVolunteers(slot.volunteers).map((volunteer, index) => (
                              <div key={index} className="text-sm text-gray-600 pl-2 border-l-2 border-gray-300 flex justify-between items-center">
                                <span>{volunteer}</span>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500"
                                    onClick={() => setVolunteerToRemove({ name: volunteer, timeSlot: slot })}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isAdmin && ( // Renderiza o resumo de custos somente para administradores
        <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Resumo de Custos Totais</h2>
          <div className="space-y-2">
            <p><strong>Cb/Sd:</strong> R$ {totalCostSummary["Cb/Sd"]?.toFixed(2)}</p>
            <p><strong>St/Sgt:</strong> R$ {totalCostSummary["St/Sgt"]?.toFixed(2)}</p>
            <p><strong>Oficiais:</strong> R$ {totalCostSummary["Oficiais"]?.toFixed(2)}</p>
            <p className="font-semibold"><strong>Total Geral:</strong> R$ {totalCostSummary["Total Geral"]?.toFixed(2)}</p>
          </div>
        </div>
      )}


      <AlertDialog
        open={!!volunteerToRemove}
        onOpenChange={() => setVolunteerToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover voluntário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {volunteerToRemove?.name} deste horário?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (volunteerToRemove) {
                  handleRemoveVolunteer(volunteerToRemove.timeSlot, volunteerToRemove.name);
                  setVolunteerToRemove(null);
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeSlotsList;
