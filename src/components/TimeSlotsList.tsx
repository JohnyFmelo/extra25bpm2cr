import React, { useState, useEffect } from "react";
import { format, parseISO, isPast, addDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRoundCog, CalendarDays, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
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
}

interface GroupedTimeSlots {
  [key: string]: {
    slots: TimeSlot[];
    dailyCost: number; // Keep track of daily cost
  };
}

// Component TimeSlotLimitControl (Sem alterações)
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
  return <div className="w-full space-y-4">
      {!isAdmin && <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              {userSlotCount >= slotLimit ? <p className="text-orange-600 font-medium">Horários esgotados</p> : <p className="text-gray-700">
                  Escolha {slotLimit - userSlotCount} {slotLimit - userSlotCount === 1 ? 'horário' : 'horários'}
                </p>}
              <p className="text-sm text-gray-500">
                {userSlotCount} de {slotLimit} horários preenchidos
              </p>
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-medium">{userSlotCount}/{slotLimit}</span>
            </div>
          </div>
        </div>}

      {isAdmin && <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Limite de horários por usuário</h3>
              <UserRoundCog className="h-5 w-5 text-gray-500" />
            </div>

            <div className="flex gap-2">
              {predefinedLimits.map(limit => <Button key={limit} onClick={() => onUpdateLimit(limit)} variant={slotLimit === limit ? "default" : "outline"} className="flex-1">
                  {limit}
                </Button>)}
              <Button onClick={() => setShowCustomInput(true)} variant="outline" className="flex-1">
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
                  <Input type="number" min="1" value={customLimit} onChange={e => setCustomLimit(e.target.value)} placeholder="Digite o limite de horários" />
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
        </div>}
    </div>;
};

// Funções auxiliares (Sem alterações)
const getMilitaryRankWeight = (rank: string): number => {
  const rankWeights: {
    [key: string]: number;
  } = {
    "Cel": 12, "Cel PM": 12, "Ten Cel": 11, "Ten Cel PM": 11, "Maj": 10, "Maj PM": 10, "Cap": 9, "Cap PM": 9,
    "1° Ten": 8, "1° Ten PM": 8, "2° Ten": 7, "2° Ten PM": 7, "Sub Ten": 6, "Sub Ten PM": 6,
    "1° Sgt": 5, "1° Sgt PM": 5, "2° Sgt": 4, "2° Sgt PM": 4, "3° Sgt": 3, "3° Sgt PM": 3,
    "Cb": 2, "Cb PM": 2, "Sd": 1, "Sd PM": 1, "Estágio": 0
  };
  return rankWeights[rank] || 0;
};

const getRankCategory = (rank: string): { category: string; hourlyRate: number; } => {
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
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value).replace("R$", "R$ ");
};

// Componente principal TimeSlotsList (Com alteração na exibição do valor diário)
const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slotLimit, setSlotLimit] = useState<number>(0);
  const [volunteerHours, setVolunteerHours] = useState<{[key: string]: string}>({});
  const { toast } = useToast();
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  const isAdmin = userData?.userType === 'admin';

  // Função para calcular diferença de tempo (Sem alterações)
  const calculateTimeDifference = (startTime: string, endTime: string): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    if (endHour < startHour || endHour === 0 && startHour > 0) {
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

  // Função fetchVolunteerHours (Sem alterações)
  const fetchVolunteerHours = async () => {
     if (!isAdmin) return;

     try {
       const currentMonth = format(new Date(), 'MMMM', { locale: ptBR }).toUpperCase();

       type TableName = "JANEIRO" | "FEVEREIRO" | "MARCO" | "ABRIL" | "MAIO" | "JUNHO" |
                        "JULHO" | "AGOSTO" | "SETEMBRO" | "OUTUBRO" | "NOVEMBRO" | "DEZEMBRO" | "ESCALA";

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

       const { data, error } = await supabase
         .from(tableName)
         .select('Nome, "Total Geral"');

       if (error) {
         console.error('Error fetching volunteer hours:', error);
         return;
       }

       const hoursMap: {[key: string]: string} = {};

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

  // useEffect para buscar dados (Sem alterações lógicas)
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
          description: data.description || ""
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

  // Handlers de voluntariar/desvoluntariar (Sem alterações)
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
      if (!result.success) { throw new Error('Falha ao atualizar o horário'); }
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
      if (!result.success) { throw new Error('Falha ao atualizar o horário'); }
      toast({ title: "Desmarcado! 👀🤔", description: "Extra desmarcada com sucesso!" });
    } catch (error) {
      console.error('Erro ao desmarcar:', error);
      toast({ title: "Erro ⛔", description: "Não foi possível desmarcar a Extra.", variant: "destructive" });
    }
  };

  // Handler de atualizar limite (Sem alterações)
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

  // Função para agrupar slots (Sem alterações)
  const groupTimeSlotsByDate = (slots: TimeSlot[]): GroupedTimeSlots => {
    return slots.reduce((groups: GroupedTimeSlots, slot) => {
      const date = slot.date;
      if (!groups[date]) {
        groups[date] = { slots: [], dailyCost: 0 }; // Initialize dailyCost
      }
      groups[date].slots.push(slot);
      return groups;
    }, {});
  };

  // Funções de verificação e formatação (Sem alterações)
  const isVolunteered = (timeSlot: TimeSlot) => timeSlot.volunteers?.includes(volunteerName);
  const isSlotFull = (timeSlot: TimeSlot) => timeSlot.slots_used === timeSlot.total_slots;
  const formatDateHeader = (date: string) => {
    const dayOfWeek = format(parseISO(date), "eee", { locale: ptBR });
    const truncatedDay = dayOfWeek.substring(0, 3);
    return `${truncatedDay.charAt(0).toUpperCase()}${truncatedDay.slice(1)}-${format(parseISO(date), "dd/MM/yy")}`;
  };

  // Lógica de exibição de botão (Sem alterações)
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

  // Função para ordenar voluntários (Sem alterações)
  const sortVolunteers = (volunteers: string[]) => {
    if (!volunteers) return [];
    return volunteers.sort((a, b) => getMilitaryRankWeight(getVolunteerRank(b)) - getMilitaryRankWeight(getVolunteerRank(a)));
  };

  // State e useEffect para calcular custos (Sem alterações lógicas)
  const [calculatedGroupedTimeSlots, setCalculatedGroupedTimeSlots] = useState<GroupedTimeSlots>({});
  useEffect(() => {
    const grouped = groupTimeSlotsByDate(timeSlots);
    let totalCostCounter = { "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Total Geral": 0 };
    Object.keys(grouped).forEach(date => {
      let dailyCost = 0;
      grouped[date].slots.forEach(slot => {
        slot.volunteers?.forEach(volunteerFullName => {
          const volunteerRank = getVolunteerRank(volunteerFullName);
          const rankInfo = getRankCategory(volunteerRank);
          const hours = parseFloat(calculateTimeDifference(slot.start_time, slot.end_time));
          const slotCost = hours * rankInfo.hourlyRate;
          dailyCost += slotCost;
          totalCostCounter[rankInfo.category] = (totalCostCounter[rankInfo.category] || 0) + slotCost;
          totalCostCounter["Total Geral"] = (totalCostCounter["Total Geral"] || 0) + slotCost;
        });
      });
      grouped[date].dailyCost = dailyCost; // Store calculated daily cost
    });
    setCalculatedGroupedTimeSlots(grouped);
    setTotalCostSummary(totalCostCounter);
  }, [timeSlots]); // Dependência de timeSlots para recalcular quando mudar

  // State e handler para remover voluntário (Sem alterações)
  const userSlotCount = timeSlots.reduce((count, slot) => slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0);
  const [volunteerToRemove, setVolunteerToRemove] = useState<{ name: string; timeSlot: TimeSlot; } | null>(null);

  const handleRemoveVolunteer = async (timeSlot: TimeSlot, volunteerName: string) => {
    try {
      const updatedSlot = { ...timeSlot, slots_used: timeSlot.slots_used - 1, volunteers: (timeSlot.volunteers || []).filter(v => v !== volunteerName) };
      const result = await dataOperations.update(updatedSlot, { date: timeSlot.date, start_time: timeSlot.start_time, end_time: timeSlot.end_time });
      if (!result.success) { throw new Error('Falha ao remover voluntário'); }
      toast({ title: "Sucesso! ✅", description: `${volunteerName} foi removido deste horário.` });
    } catch (error) {
      console.error('Erro ao remover voluntário:', error);
      toast({ title: "Erro ⛔", description: "Não foi possível remover o voluntário.", variant: "destructive" });
    }
    setVolunteerToRemove(null); // Fecha o AlertDialog
  };

  // State para custo total (Sem alterações)
  const [totalCostSummary, setTotalCostSummary] = useState<{ "Cb/Sd": number; "St/Sgt": number; "Oficiais": number; "Total Geral": number; }>({ "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Total Geral": 0 });

  // Cálculo de custo semanal (Sem alterações)
  const today = new Date();
  const tomorrow = addDays(today, 1);
  let weeklyCost = 0;
  let weeklyCostDates: string[] = [];

  if (calculatedGroupedTimeSlots) {
    Object.entries(calculatedGroupedTimeSlots)
      .filter(([date]) => {
        const slotDate = parseISO(date);
        const isWeeklyDate = isAfter(slotDate, tomorrow) || format(slotDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
        if (isWeeklyDate) {
          weeklyCostDates.push(date);
        }
        return isWeeklyDate;
      })
      .forEach(([, groupedData]) => {
        weeklyCost += groupedData.dailyCost;
      });
  }

  const formatWeeklyDateRange = () => {
    if (weeklyCostDates.length === 0) return "";
    const sortedDates = weeklyCostDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const firstDate = format(parseISO(sortedDates[0]), "dd/MM");
    const lastDate = format(parseISO(sortedDates[sortedDates.length - 1]), "dd/MM");
    return `${firstDate} a ${lastDate}`;
  };


  // Renderização do componente
  return (
    <div className="space-y-8 pb-10">
      <TimeSlotLimitControl
        slotLimit={slotLimit}
        onUpdateLimit={handleUpdateSlotLimit}
        userSlotCount={userSlotCount}
        isAdmin={isAdmin}
      />

      {isLoading ? (
        <div className="text-center text-gray-500">Carregando horários...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(calculatedGroupedTimeSlots)
            .filter(([, groupedData]) => groupedData.slots.length > 0) // Filtra dias sem slots
            .sort(([dateA], [dateB]) => parseISO(dateA).getTime() - parseISO(dateB).getTime()) // Ordena por data
            .map(([date, groupedData]) => {
              const isDayPast = isPast(addDays(parseISO(date), 1)); // Considera o dia inteiro

              return (
                <div key={date} className={`bg-white rounded-lg shadow-md overflow-hidden ${isDayPast ? 'opacity-70' : ''}`}>
                  {/* // ------------- MODIFICAÇÃO AQUI ------------- */}
                  {/* // Exibe o header do dia com a data E o valor diário (para admin) */}
                  <div className="flex items-center justify-between p-4 bg-gray-100 rounded-t-lg">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold text-gray-800">{formatDateHeader(date)}</span>
                    </div>
                    {/* Exibe o valor do dia DENTRO da targeta (cabeçalho) apenas para admin */}
                    {isAdmin && groupedData.dailyCost > 0 && (
                       <Badge variant="outline" className="text-indigo-600 border-indigo-600 font-semibold">
                           {formatCurrency(groupedData.dailyCost)}
                       </Badge>
                     )}
                  </div>
                  {/* // ------------- FIM DA MODIFICAÇÃO ------------- */}


                  <div className="divide-y divide-gray-200">
                    {groupedData.slots
                       .sort((a, b) => a.start_time.localeCompare(b.start_time)) // Ordena slots por hora inicial
                       .map((slot) => {
                       const isSlotVolunteered = isVolunteered(slot);
                       const full = isSlotFull(slot);
                       const canVol = canVolunteerForSlot(slot);
                       const showButton = shouldShowVolunteerButton(slot);
                       const timeDifference = calculateTimeDifference(slot.start_time, slot.end_time);

                       return (
                         <div key={`${slot.date}-${slot.start_time}-${slot.end_time}`} className={`p-4 ${isSlotVolunteered ? 'bg-green-50' : ''} hover:bg-gray-50 transition-colors duration-150`}>
                           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                             <div className="flex-1 space-y-1">
                               <div className="flex items-center space-x-2">
                                 <Clock className="h-4 w-4 text-gray-500" />
                                 <span className="font-medium text-gray-800">
                                   {slot.start_time} - {slot.end_time} ({timeDifference}h)
                                 </span>
                                 <Badge variant={full ? "destructive" : "secondary"} className="ml-2">
                                   {slot.slots_used}/{slot.total_slots} vagas
                                 </Badge>
                               </div>
                               {slot.description && <p className="text-sm text-gray-600 ml-6">{slot.description}</p>}
                               {slot.volunteers && sortVolunteers(slot.volunteers).length > 0 && (
                                <div className="pt-2 ml-6 space-y-1">
                                  <p className="text-xs font-medium text-gray-500 uppercase">Voluntários:</p>
                                  <ul className="space-y-1">
                                      {sortVolunteers(slot.volunteers).map((v, index) => (
                                      <li key={index} className="flex items-center justify-between group text-sm text-gray-700">
                                          <span>{v}{isAdmin && volunteerHours[v] ? ` (${volunteerHours[v]}h)`: ''}</span>
                                          {isAdmin && (
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={() => setVolunteerToRemove({ name: v, timeSlot: slot })}
                                              >
                                                  <X className="h-4 w-4" />
                                              </Button>
                                          )}
                                      </li>
                                      ))}
                                  </ul>
                                </div>
                                )}
                             </div>

                             {!isDayPast && showButton && (
                               <div className="flex-shrink-0">
                                 {isSlotVolunteered ? (
                                   <Button variant="outline" size="sm" onClick={() => handleUnvolunteer(slot)}>
                                     Desmarcar
                                   </Button>
                                 ) : (
                                   <Button
                                     variant="default"
                                     size="sm"
                                     onClick={() => handleVolunteer(slot)}
                                     disabled={full || (!isAdmin && !canVol) || (isSlotFull(slot) && !isVolunteered(slot)) }
                                   >
                                     {full ? "Completo" : "Voluntariar"}
                                   </Button>
                                 )}
                               </div>
                             )}
                           </div>
                         </div>
                       );
                     })}
                  </div>
                    {/* O bloco de custo diário foi MOVIDO para o cabeçalho */}
                    {/* {isAdmin && groupedData.dailyCost > 0 && (
                      <div className="p-4 bg-gray-50 rounded-b-lg text-right">
                        <p className="text-sm font-medium text-gray-700">
                           Custo Diário: <span className="font-bold text-indigo-600">{formatCurrency(groupedData.dailyCost)}</span>
                         </p>
                       </div>
                     )} */}
                </div>
              );
            })}

          {Object.keys(calculatedGroupedTimeSlots).length === 0 && (
             <p className="text-center text-gray-500">Nenhum horário disponível no momento.</p>
           )}
        </div>
      )}

      {/* Sumário de custos (se necessário) */}
      {isAdmin && (totalCostSummary["Total Geral"] > 0 || weeklyCost > 0) && (
        <div className="mt-8 p-6 bg-indigo-50 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4">Resumo de Custos (Estimativa)</h3>
          <div className="space-y-3">
            {weeklyCost > 0 && (
              <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                <span className="text-sm font-medium text-gray-700">Próximos 7 dias ({formatWeeklyDateRange()}):</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(weeklyCost)}</span>
              </div>
            )}
             <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
               <span className="text-sm font-medium text-gray-700">Total Geral (Mês Atual):</span>
               <span className="font-bold text-lg text-indigo-600">{formatCurrency(totalCostSummary["Total Geral"])}</span>
             </div>
             {totalCostSummary["Oficiais"] > 0 && (
                <div className="flex justify-between text-sm text-gray-600 pl-4">
                  <span>Oficiais:</span>
                  <span>{formatCurrency(totalCostSummary["Oficiais"])}</span>
                </div>
             )}
             {totalCostSummary["St/Sgt"] > 0 && (
                <div className="flex justify-between text-sm text-gray-600 pl-4">
                  <span>ST/Sgt:</span>
                  <span>{formatCurrency(totalCostSummary["St/Sgt"])}</span>
                </div>
             )}
              {totalCostSummary["Cb/Sd"] > 0 && (
                 <div className="flex justify-between text-sm text-gray-600 pl-4">
                   <span>Cb/Sd:</span>
                   <span>{formatCurrency(totalCostSummary["Cb/Sd"])}</span>
                 </div>
               )}
          </div>
        </div>
      )}

      {/* AlertDialog para confirmação de remoção */}
      <AlertDialog open={!!volunteerToRemove} onOpenChange={(open) => !open && setVolunteerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <span className="font-semibold">{volunteerToRemove?.name}</span> do horário {volunteerToRemove?.timeSlot.start_time} - {volunteerToRemove?.timeSlot.end_time} no dia {volunteerToRemove ? formatDateHeader(volunteerToRemove.timeSlot.date) : ''}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVolunteerToRemove(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => volunteerToRemove && handleRemoveVolunteer(volunteerToRemove.timeSlot, volunteerToRemove.name)} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default TimeSlotsList;
