--- START OF FILE TimeSlotsList (5).tsx ---

import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO, isPast, addDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRoundCog, CalendarDays, Clock, X, ChevronDown, ChevronUp } from "lucide-react"; // Added ChevronDown, ChevronUp
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import supabase from "@/lib/supabaseClient";

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[];
  description?: string;
  allowedMilitaryTypes?: string[];
}

interface GroupedTimeSlots {
  [key: string]: {
    slots: TimeSlot[];
    dailyCost: number;
  };
}

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
                  Escolha {slotLimit - userSlotCount}{" "}
                  {slotLimit - userSlotCount === 1 ? 'horário' : 'horários'}
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
              {predefinedLimits.map(limit => (
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
                    onChange={e => setCustomLimit(e.target.value)}
                    placeholder="Digite o limite de horários"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCustomInput(false)}>
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

const getMilitaryRankWeight = (rank: string): number => {
  const rankWeights: { [key: string]: number } = {
    "Cel": 12, "Cel PM": 12, "Ten Cel": 11, "Ten Cel PM": 11, "Maj": 10, "Maj PM": 10,
    "Cap": 9, "Cap PM": 9, "1° Ten": 8, "1° Ten PM": 8, "2° Ten": 7, "2° Ten PM": 7,
    "Sub Ten": 6, "Sub Ten PM": 6, "1° Sgt": 5, "1° Sgt PM": 5, "2° Sgt": 4, "2° Sgt PM": 4,
    "3° Sgt": 3, "3° Sgt PM": 3, "Cb": 2, "Cb PM": 2, "Sd": 1, "Sd PM": 1, "Estágio": 0
  };
  return rankWeights[rank] || 0;
};

const getRankCategory = (rank: string): { category: string; hourlyRate: number } => {
  const cbSdRanks = ["Sd", "Sd PM", "Cb", "Cb PM"];
  const stSgtRanks = ["3° Sgt", "3° Sgt PM", "2° Sgt", "2° Sgt PM", "1° Sgt", "1° Sgt PM", "Sub Ten", "Sub Ten PM"];
  const oficiaisRanks = ["2° Ten", "2° Ten PM", "1° Ten", "1° Ten PM", "Cap", "Cap PM", "Maj", "Maj PM", "Ten Cel", "Ten Cel PM", "Cel", "Cel PM"];
  if (cbSdRanks.includes(rank)) return { category: "Cb/Sd", hourlyRate: 41.13 };
  if (stSgtRanks.includes(rank)) return { category: "St/Sgt", hourlyRate: 56.28 };
  if (oficiaisRanks.includes(rank)) return { category: "Oficiais", hourlyRate: 87.02 };
  return { category: "Outros", hourlyRate: 0 };
};

const getVolunteerRank = (volunteerFullName: string): string => {
  const parts = volunteerFullName.split(" ");
  if (parts.length >= 2 && (parts[1] === "Sgt" || parts[1] === "Ten")) {
    return `${parts[0]} ${parts[1]} ${parts[2] || ''}`.trim();
  }
  return parts[0];
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value).replace("R$", "R$ ");
};

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slotLimit, setSlotLimit] = useState<number>(0);
  const [volunteerHours, setVolunteerHours] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  const isAdmin = userData?.userType === 'admin';
  const userService = userData?.service;

  // State for managing collapsed past days for admin
  const [collapsedPastDays, setCollapsedPastDays] = useState<{ [key: string]: boolean }>({});

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
    const totalHours = diffHours + diffMinutes / 60;
    return `${totalHours}`;
  };

  const fetchVolunteerHours = async () => {
    if (!isAdmin) return;
    try {
      const currentMonth = format(new Date(), 'MMMM', { locale: ptBR }).toUpperCase();
      type TableName = "JANEIRO" | "FEVEREIRO" | "MARCO" | "ABRIL" | "MAIO" | "JUNHO" | "JULHO" | "AGOSTO" | "SETEMBRO" | "OUTUBRO" | "NOVEMBRO" | "DEZEMBRO" | "ESCALA";
      let tableName: TableName;
      if (currentMonth === 'JANEIRO') tableName = "JANEIRO";
      else if (currentMonth === 'FEVEREIRO') tableName = "FEVEREIRO";
      else if (currentMonth === 'MARÇO') tableName = "MARCO";
      else if (currentMonth === 'ABRIL') tableName = "ABRIL";
      else if (currentMonth === 'MAIO') tableName = "MAIO";
      else if (currentMonth === 'JUNHO') tableName = "JUNHO";
      else if (currentMonth === 'JULHO') tableName = "JULHO";
      else if (currentMonth === 'AGOSTO') tableName = "AGOSTO";
      else if (currentMonth === 'SETEMBRO') tableName = "SETEMBRO";
      else if (currentMonth === 'OUTUBRO') tableName = "OUTUBRO";
      else if (currentMonth === 'NOVEMBRO') tableName = "NOVEMBRO";
      else tableName = "DEZEMBRO";
      const { data, error } = await supabase.from(tableName).select('Nome, "Total Geral"');
      if (error) {
        console.error('Error fetching volunteer hours:', error);
        return;
      }
      const hoursMap: { [key: string]: string } = {};
      if (data) {
        data.forEach(row => {
          if (row && typeof row === 'object' && 'Nome' in row && 'Total Geral' in row) {
            const nome = row.Nome as string;
            const totalGeral = row['Total Geral'] as string;
            if (nome && totalGeral) {
              hoursMap[nome.trim()] = totalGeral;
            }
          }
        });
      }
      setVolunteerHours(hoursMap);
    } catch (error) {
      console.error('Error in fetchVolunteerHours:', error);
    }
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
    const unsubscribe = onSnapshot(q, snapshot => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let slotDateStr: string;
        if (data.date && typeof data.date.toDate === 'function') {
          slotDateStr = format(data.date.toDate(), 'yyyy-MM-dd');
        } else {
          slotDateStr = data.date as string;
        }
        return {
          id: docSnap.id,
          date: slotDateStr,
          start_time: data.start_time,
          end_time: data.end_time,
          volunteers: data.volunteers || [],
          slots_used: data.slots_used || 0,
          total_slots: data.total_slots || data.slots || 0,
          description: data.description || "",
          allowedMilitaryTypes: data.allowedMilitaryTypes || []
        };
      });
      setTimeSlots(formattedSlots);
      setIsLoading(false);
    }, error => {
      console.error('Erro ao ouvir horários:', error);
      toast({
        title: "Erro ao atualizar horários",
        description: "Não foi possível receber atualizações em tempo real.",
        variant: "destructive"
      });
      setIsLoading(false);
    });
    if (isAdmin) {
      fetchVolunteerHours();
    }
    return () => unsubscribe();
  }, [toast, isAdmin]);

  const handleVolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({ title: "Erro", description: "Usuário não encontrado. Por favor, faça login novamente.", variant: "destructive" });
      return;
    }
    const userSlotCount = timeSlots.reduce((count, slot) => slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0);
    if (userSlotCount >= slotLimit && !isAdmin) {
      toast({ title: "Limite atingido!🚫", description: `Você atingiu o limite de ${slotLimit} horário${slotLimit === 1 ? '' : 's'} por usuário.`, variant: "destructive" });
      return;
    }
    const slotsForDate = timeSlots.filter(slot => slot.date === timeSlot.date);
    const isAlreadyRegistered = slotsForDate.some(slot => slot.volunteers?.includes(volunteerName));
    if (isAlreadyRegistered) {
      toast({ title: "Erro ⛔", description: "Você já está registrado em um horário nesta data.", variant: "destructive" });
      return;
    }
    try {
      const updatedSlot = { ...timeSlot, slots_used: timeSlot.slots_used + 1, volunteers: [...(timeSlot.volunteers || []), volunteerName] };
      const result = await dataOperations.update(updatedSlot, { date: timeSlot.date, start_time: timeSlot.start_time, end_time: timeSlot.end_time });
      if (!result.success) throw new Error('Falha ao atualizar o horário');
      toast({ title: "Sucesso!✅🤠", description: "Extra marcada. Aguarde a escala." });
    } catch (error) {
      console.error('Erro ao voluntariar:', error);
      toast({ title: "Erro 🤔", description: "Não foi possível reservar a Extra.", variant: "destructive" });
    }
  };

  const handleUnvolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({ title: "Erro 🤔", description: "Usuário não encontrado. Por favor, faça login novamente.", variant: "destructive" });
      return;
    }
    try {
      const updatedSlot = { ...timeSlot, slots_used: timeSlot.slots_used - 1, volunteers: (timeSlot.volunteers || []).filter(v => v !== volunteerName) };
      const result = await dataOperations.update(updatedSlot, { date: timeSlot.date, start_time: timeSlot.start_time, end_time: timeSlot.end_time });
      if (!result.success) throw new Error('Falha ao atualizar o horário');
      toast({ title: "Desmarcado! 👀🤔", description: "Extra desmarcada com sucesso!" });
    } catch (error) {
      console.error('Erro ao desmarcar:', error);
      toast({ title: "Erro ⛔", description: "Não foi possível desmarcar a Extra.", variant: "destructive" });
    }
  };

  const handleUpdateSlotLimit = async (limit: number) => {
    if (isNaN(limit) || limit < 0) {
      toast({ title: "Erro 😵‍💫", description: "Por favor, insira um número válido.", variant: "destructive" });
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'slotLimit'), { value: limit });
      setSlotLimit(limit);
      toast({ title: "Sucesso", description: "Limite de horários atualizado com sucesso!" });
    } catch (error) {
      console.error('Erro ao atualizar limite de slots:', error);
      toast({ title: "Erro", description: "Não foi possível atualizar o limite de horários.", variant: "destructive" });
    }
  };

  const groupTimeSlotsByDate = (slots: TimeSlot[]): GroupedTimeSlots => {
    return slots.reduce((groups: GroupedTimeSlots, slot) => {
      const date = slot.date;
      if (!groups[date]) {
        groups[date] = { slots: [], dailyCost: 0 };
      }
      groups[date].slots.push(slot);
      return groups;
    }, {});
  };

  const isVolunteered = (timeSlot: TimeSlot) => timeSlot.volunteers?.includes(volunteerName);
  const isSlotFull = (timeSlot: TimeSlot) => timeSlot.slots_used === timeSlot.total_slots;

  const formatDateHeader = (date: string) => {
    const dayOfWeek = format(parseISO(date), "eee", { locale: ptBR });
    const truncatedDay = dayOfWeek.substring(0, 3);
    return `${truncatedDay.charAt(0).toUpperCase()}${truncatedDay.slice(1)}-${format(parseISO(date), "dd/MM/yy")}`;
  };

  const shouldShowVolunteerButton = (slot: TimeSlot) => {
    const userDataString = localStorage.getItem('user');
    const userData = userDataString ? JSON.parse(userDataString) : null;
    if (userData?.rank === "Estágio") return false;
    if (isVolunteered(slot)) return true;
    if (isSlotFull(slot)) return true;
    const userSlotCount = timeSlots.reduce((count, s) => s.volunteers?.includes(volunteerName) ? count + 1 : count, 0);
    if (userSlotCount >= slotLimit && !isAdmin) return false;
    const slotsForDate = timeSlots.filter(s => s.date === slot.date);
    const isVolunteeredForDate = slotsForDate.some(s => s.volunteers?.includes(volunteerName));
    return !isVolunteeredForDate;
  };

  const canVolunteerForSlot = (slot: TimeSlot) => {
    if (isAdmin) return true;
    const userSlotCount = timeSlots.reduce((count, s) => s.volunteers?.includes(volunteerName) ? count + 1 : count, 0);
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

  const [calculatedGroupedTimeSlots, setCalculatedGroupedTimeSlots] = useState<GroupedTimeSlots>({});
  const [totalCostSummary, setTotalCostSummary] = useState<{ "Cb/Sd": number; "St/Sgt": number; "Oficiais": number; "Total Geral": number; }>({ "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Total Geral": 0 });

  useEffect(() => {
    const slotsToProcess = timeSlots.filter(slot => {
      if (isAdmin || !slot.allowedMilitaryTypes || slot.allowedMilitaryTypes.length === 0 || !userService) {
        return true;
      }
      return slot.allowedMilitaryTypes.includes(userService);
    });
    const grouped = groupTimeSlotsByDate(slotsToProcess);
    const newTotalCostSummary = { "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Total Geral": 0 };
    Object.keys(grouped).forEach(date => {
      let dailyCost = 0;
      grouped[date].slots.forEach(slot => {
        slot.volunteers?.forEach(volunteerFullName => {
          const volunteerRank = getVolunteerRank(volunteerFullName);
          const rankInfo = getRankCategory(volunteerRank);
          if (rankInfo.category !== "Outros") {
            const hours = parseFloat(calculateTimeDifference(slot.start_time, slot.end_time));
            const slotCost = hours * rankInfo.hourlyRate;
            dailyCost += slotCost;
            newTotalCostSummary[rankInfo.category as keyof Omit<typeof newTotalCostSummary, "Total Geral">] += slotCost;
            newTotalCostSummary["Total Geral"] += slotCost;
          }
        });
      });
      grouped[date].dailyCost = dailyCost;
    });
    setCalculatedGroupedTimeSlots(grouped);
    setTotalCostSummary(newTotalCostSummary);
  }, [timeSlots, isAdmin, userService]);

  const userSlotCount = timeSlots.reduce((count, slot) => slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0);
  const [volunteerToRemove, setVolunteerToRemove] = useState<{ name: string; timeSlot: TimeSlot; } | null>(null);

  const handleRemoveVolunteer = async (timeSlot: TimeSlot, volunteerNameToRemove: string) => {
    try {
      const updatedSlot = { ...timeSlot, slots_used: timeSlot.slots_used - 1, volunteers: (timeSlot.volunteers || []).filter(v => v !== volunteerNameToRemove) };
      const result = await dataOperations.update(updatedSlot, { date: timeSlot.date, start_time: timeSlot.start_time, end_time: timeSlot.end_time });
      if (!result.success) throw new Error('Falha ao remover voluntário');
      toast({ title: "Sucesso! ✅", description: `${volunteerNameToRemove} foi removido deste horário.` });
    } catch (error) {
      console.error('Erro ao remover voluntário:', error);
      toast({ title: "Erro ⛔", description: "Não foi possível remover o voluntário.", variant: "destructive" });
    }
  };

  const today = new Date();
  const tomorrow = addDays(today, 1);
  let weeklyCost = 0;
  let weeklyCostDates: string[] = [];
  if (calculatedGroupedTimeSlots) {
    Object.entries(calculatedGroupedTimeSlots).filter(([date]) => {
      const slotDate = parseISO(date);
      const isWeeklyDate = isAfter(slotDate, tomorrow) || format(slotDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
      if (isWeeklyDate) weeklyCostDates.push(date);
      return isWeeklyDate;
    }).forEach(([, groupedData]) => { weeklyCost += groupedData.dailyCost; });
  }

  const formatWeeklyDateRange = () => {
    if (weeklyCostDates.length === 0) return "";
    const sortedDates = weeklyCostDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const startDate = format(parseISO(sortedDates[0]), "eee", { locale: ptBR }).substring(0, 3).toUpperCase();
    const endDate = format(parseISO(sortedDates[sortedDates.length - 1]), "eee", { locale: ptBR }).substring(0, 3).toUpperCase();
    return `${startDate}-${endDate}`;
  };
  const weeklyDateRangeText = formatWeeklyDateRange();

  if (isLoading) {
    return <div className="p-4">Carregando horários...</div>;
  }

  const getVolunteerHours = (volunteerNameParam: string) => {
    if (volunteerHours[volunteerNameParam]) return volunteerHours[volunteerNameParam];
    const volunteerNameParts = volunteerNameParam.split(' ');
    const warName = volunteerNameParts.slice(1).join(' ');
    for (const key in volunteerHours) {
      if (key.includes(warName)) return volunteerHours[key];
    }
    return null;
  };

  const renderAllowedMilitaryTypes = (allowedMilitaryTypes?: string[]) => {
    if (!allowedMilitaryTypes || allowedMilitaryTypes.length === 0) {
      return <span className="text-xs text-gray-400 italic">Sem restrição de categoria</span>;
    }
    return <span className="text-xs text-blue-700 bg-blue-0 rounded px-2 py-1">PM's: {allowedMilitaryTypes.join(", ")}</span>;
  };

  // Handler for admin to toggle collapse state of past days
  const handleTogglePastDayCollapse = (dateToToggle: string) => {
    if (isAdmin && isPast(parseISO(dateToToggle))) {
      setCollapsedPastDays(prev => ({
        ...prev,
        [dateToToggle]: !(prev[dateToToggle] ?? true) // Default to collapsed (true), so first toggle expands
      }));
    }
  };

  return (
    <div className="space-y-6 p-4 py-0 my-0 px-0">
      <TimeSlotLimitControl slotLimit={slotLimit} onUpdateLimit={handleUpdateSlotLimit} userSlotCount={userSlotCount} isAdmin={isAdmin} />

      {isAdmin && totalCostSummary["Total Geral"] > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Resumo de Custos Totais</h2>
          <div className="space-y-2">
            <p><strong>Cb/Sd:</strong> {formatCurrency(totalCostSummary["Cb/Sd"])}</p>
            <p><strong>St/Sgt:</strong> {formatCurrency(totalCostSummary["St/Sgt"])}</p>
            <p><strong>Oficiais:</strong> {formatCurrency(totalCostSummary["Oficiais"])}</p>
            <p className="font-semibold text-green-500"><strong>Total Geral:</strong> {formatCurrency(totalCostSummary["Total Geral"])}</p>
            {weeklyCost > 0 && <p className="font-semibold text-blue-500"><strong>Custo da Semana ({weeklyDateRangeText}):</strong> {formatCurrency(weeklyCost)}</p>}
          </div>
        </div>
      )}

      {Object.entries(calculatedGroupedTimeSlots).sort().map(([date, groupedData]) => {
        const { slots, dailyCost } = groupedData;
        if (slots.length === 0) return null;

        const isDatePast = isPast(parseISO(date));
        
        let currentDayIsCollapsed = false;
        if (isDatePast) {
          if (!isAdmin) {
            currentDayIsCollapsed = true; // Non-admins: past days are always collapsed
          } else {
            // Admins: consult state, default to collapsed
            currentDayIsCollapsed = collapsedPastDays[date] ?? true; 
          }
        }
        // Future days remain expanded by default

        const sortedSlots = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));

        return (
          <div key={date} className="bg-white rounded-lg shadow-sm">
            <div className="p-4 md:p-5 px-[5px]"> {/* Main container for day's content */}
              {/* Header Section - Double clickable for admin on past dates */}
              <div
                className={`flex flex-col items-center ${isAdmin && isDatePast ? 'cursor-pointer hover:bg-gray-50 rounded-md' : ''}`}
                onDoubleClick={isAdmin && isDatePast ? () => handleTogglePastDayCollapse(date) : undefined}
                title={isAdmin && isDatePast ? (currentDayIsCollapsed ? "Duplo clique para expandir" : "Duplo clique para recolher") : ""}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className={`h-5 w-5 ${isDatePast ? 'text-gray-500' : 'text-blue-500'}`} />
                    <h3 className="font-medium text-lg text-gray-800">{formatDateHeader(date)}</h3>
                    {isAdmin && dailyCost > 0 && <span className="text-green-600 font-semibold text-base">{formatCurrency(dailyCost)}</span>}
                  </div>
                  <Badge 
                    variant={isDatePast ? "outline" : "secondary"} 
                    className={`whitespace-nowrap ${isDatePast ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  >
                    {isDatePast ? "Encerrado" : "Próximo"}
                    {isAdmin && isDatePast && (
                      currentDayIsCollapsed ? 
                      <ChevronDown className="h-4 w-4 ml-1 inline-block" /> : 
                      <ChevronUp className="h-4 w-4 ml-1 inline-block" />
                    )}
                  </Badge>
                </div>
              </div>

              {/* Slots Section - Conditionally rendered */}
              {!currentDayIsCollapsed && (
                <div className="space-y-3 mt-4"> {/* This mt-4 provides separation from header */}
                  {sortedSlots.map((slot, idx) => (
                    <div key={slot.id || idx} className={`border rounded-lg p-4 space-y-3 transition-all ${isSlotFull(slot) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      {isAdmin && (
                        <div className="mb-1">
                          {renderAllowedMilitaryTypes(slot.allowedMilitaryTypes)}
                        </div>
                      )}

                      <div className="flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
                            <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <p className="font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                              {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)}-{calculateTimeDifference(slot.start_time, slot.end_time).slice(0, 4)}h
                            </p>
                          </div>
                          {slot.description && <span className="text-gray-700 ml-2 max-w-[200px] truncate">{slot.description}</span>}
                        </div>
                        
                        <div className="flex items-center justify-between">
                           <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${isSlotFull(slot) ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            <span className="text-sm font-medium whitespace-nowrap">
                              {isSlotFull(slot) ? 'Vagas Esgotadas' : `${slot.total_slots - slot.slots_used} ${slot.total_slots - slot.slots_used === 1 ? 'vaga' : 'vagas'}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {slot.volunteers && slot.volunteers.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium mb-2 text-gray-700">Voluntários:</p>
                          <div className="space-y-1">
                            {sortVolunteers(slot.volunteers).map((volunteer, index) => (
                              <div key={index} className="text-sm text-gray-600 pl-2 border-l-2 border-gray-300 flex justify-between items-center">
                                <div className="flex items-center">
                                  <span>{volunteer}</span>
                                  {isAdmin && getVolunteerHours(volunteer) && (
                                    <span className="ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                      {getVolunteerHours(volunteer)}h
                                    </span>
                                  )}
                                </div>
                                {isAdmin && (
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500" onClick={() => setVolunteerToRemove({ name: volunteer, timeSlot: slot })}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-2">
                        {shouldShowVolunteerButton(slot) && (
                          isVolunteered(slot) ? (
                            <Button onClick={() => handleUnvolunteer(slot)} variant="destructive" size="sm" className="w-full shadow-sm hover:shadow">Desmarcar</Button>
                          ) : !isSlotFull(slot) && canVolunteerForSlot(slot) && (
                            <Button onClick={() => handleVolunteer(slot)} className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow w-full" size="sm">Voluntário</Button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <AlertDialog open={!!volunteerToRemove} onOpenChange={() => setVolunteerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover voluntário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {volunteerToRemove?.name} deste horário?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (volunteerToRemove) {
                handleRemoveVolunteer(volunteerToRemove.timeSlot, volunteerToRemove.name);
                setVolunteerToRemove(null);
              }
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeSlotsList;
--- END OF FILE TimeSlotsList (5).tsx ---
