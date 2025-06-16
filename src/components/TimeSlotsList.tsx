import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO, isPast, addDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase"; // Supondo que dataOperations.update() exista e funcione
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot, doc, getDoc, setDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore"; // Adicionado updateDoc, arrayRemove, arrayUnion
import { db } from "@/lib/firebase";
import { UserRoundCog, CalendarDays, Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TimeSlot {
  id: string; // ID deve ser string e obrigatório após buscar do Firebase
  date: string;
  start_time: string;
  end_time:string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[];
  description?: string;
  allowedMilitaryTypes?: string[];
}

interface VolunteerHoursMap { // Interface para o estado das horas dos voluntários
  [volunteerName: string]: number;
}

interface GroupedTimeSlots {
  [key: string]: {
    slots: TimeSlot[];
    dailyCost: number;
  };
}

// TimeSlotLimitControl Component
const TimeSlotLimitControl = ({ /* ...props... */ slotLimit, onUpdateLimit, userSlotCount = 0, isAdmin = false }: {
  slotLimit: number;
  onUpdateLimit: (limit: number) => void;
  userSlotCount?: number;
  isAdmin?: boolean;
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLimit, setCustomLimit] = useState("");
  const predefinedLimits = [1, 2, 3, 4];

  const handleCustomLimitSubmit = () => {
    const limit = parseInt(customLimit);
    if (!isNaN(limit) && limit >= 0) { // Permitir 0 para "sem limite" se desejado, ou > 0
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
              {slotLimit > 0 && userSlotCount >= slotLimit ? (
                <p className="text-orange-600 font-medium">Limite de horários atingido</p>
              ) : slotLimit > 0 ? (
                <p className="text-gray-700">
                  Escolha {slotLimit - userSlotCount}{' '}
                  {slotLimit - userSlotCount === 1 ? 'horário restante' : 'horários restantes'}
                </p>
              ) : (
                 <p className="text-gray-700">Você pode se voluntariar em horários.</p>
              )}
              {slotLimit > 0 && (
                <p className="text-sm text-gray-500">
                  {userSlotCount} de {slotLimit} horários preenchidos
                </p>
              )}
            </div>
            {slotLimit > 0 && (
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-700 font-medium">{userSlotCount}/{slotLimit}</span>
                </div>
            )}
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
                Outro
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
                    min="0" // Permitir 0 para "sem limite"
                    value={customLimit}
                    onChange={e => setCustomLimit(e.target.value)}
                    placeholder="Digite o limite (0 para sem limite)"
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

// Utility functions
const getMilitaryRankWeight = (rank: string): number => {
  const rankWeights: { [key: string]: number } = {
    "Cel": 12,"Cel PM": 12, "Ten Cel": 11, "Ten Cel PM": 11,"Maj": 10, "Maj PM": 10, "Cap": 9,"Cap PM": 9,
    "1° Ten": 8,"1° Ten PM": 8,"2° Ten": 7,"2° Ten PM": 7,"Sub Ten": 6,"Sub Ten PM": 6,"1° Sgt": 5,"1° Sgt PM": 5,
    "2° Sgt": 4,"2° Sgt PM": 4,"3° Sgt": 3,"3° Sgt PM": 3,"Cb": 2,"Cb PM": 2,"Sd": 1,"Sd PM": 1,"Estágio": 0,
  };
  return rankWeights[rank] || rankWeights[rank.split(" ")[0]] || 0;
};

const getRankCategory = (rank: string): { category: string; hourlyRate: number } => {
  const rankCleaned = rank.split(" ")[0]; // Pega a parte principal do posto. Ex: "Sd" de "Sd EV"
  const cbSdRanks = ["Sd", "Cb"];
  const stSgtRanks = ["3Sgt", "2Sgt", "1Sgt", "SubTen", "ST", "Sgt", "Sub"]; // Adicionar variações
  const oficiaisRanks = ["2Ten", "1Ten", "Cap", "Maj", "TenCel", "Cel", "TC", "Ten"];

  const simplifiedRank = rank.replace("°", "").replace(" ", "").replace("PM",""); // Ex: "1° Sgt PM" -> "1Sgt"

  if (cbSdRanks.some(r => simplifiedRank.includes(r))) return { category: "Cb/Sd", hourlyRate: 41.13 };
  if (stSgtRanks.some(r => simplifiedRank.includes(r))) return { category: "St/Sgt", hourlyRate: 56.28 };
  if (oficiaisRanks.some(r => simplifiedRank.includes(r))) return { category: "Oficiais", hourlyRate: 87.02 };
  
  // Fallback para os originais se a simplificação não funcionar
  if (["Sd", "Sd PM", "Cb", "Cb PM"].includes(rank)) return { category: "Cb/Sd", hourlyRate: 41.13 };
  if (["3° Sgt", "3° Sgt PM", "2° Sgt", "2° Sgt PM", "1° Sgt", "1° Sgt PM", "Sub Ten", "Sub Ten PM"].includes(rank)) return { category: "St/Sgt", hourlyRate: 56.28 };
  if (["2° Ten", "2° Ten PM", "1° Ten", "1° Ten PM", "Cap", "Cap PM", "Maj", "Maj PM", "Ten Cel", "Ten Cel PM", "Cel", "Cel PM"].includes(rank)) return { category: "Oficiais", hourlyRate: 87.02 };

  return { category: "Outros", hourlyRate: 0 };
};

const getVolunteerRank = (volunteerFullName: string): string => {
  const parts = volunteerFullName.split(" ");
  if (parts.length >= 2) {
      if (["Sgt", "Ten", "Cel", "CB", "SD", "Maj", "Cap", "Sub"].some(p => parts[1].toUpperCase().startsWith(p))) {
           return `${parts[0]} ${parts[1]}`;
      }
  }
  return parts[0];
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Function to sort volunteers by military rank (this was missing!)
const sortVolunteers = (volunteers: string[]): string[] => {
  return [...volunteers].sort((a, b) => {
    const rankA = getVolunteerRank(a);
    const rankB = getVolunteerRank(b);
    const weightA = getMilitaryRankWeight(rankA);
    const weightB = getMilitaryRankWeight(rankB);
    return weightB - weightA; // Higher rank first
  });
};

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Começar carregando
  const [slotLimit, setSlotLimit] = useState<number>(0); // Default sem limite
  const [volunteerTotalHours, setVolunteerTotalHours] = useState<VolunteerHoursMap>({}); // CORRIGIDO: tipo e nome
  const { toast } = useToast();
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  const isAdmin = userData?.userType === 'admin';
  const userService = userData?.service; // Ex: 'PATAMO', 'GUARDA', etc. (para allowedMilitaryTypes)
  const [collapsedDates, setCollapsedDates] = useState<{ [key: string]: boolean }>({});
  const [volunteerToRemove, setVolunteerToRemove] = useState<{ name: string; timeSlot: TimeSlot; } | null>(null);

  // CORRIGIDO: Retorna número
  const calculateSlotDuration = (startTime: string, endTime: string): number => {
    if(!startTime || !endTime) return 0;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Lida com horários que viram a meia-noite
    if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
      endHour += 24;
    }
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    const diffMinutes = endTotalMinutes - startTotalMinutes;
    return diffMinutes / 60; // Retorna em horas decimais
  };

  // NOVO: Calcula o total de horas de cada voluntário a partir dos timeSlots
  const calculateAllVolunteersTotalHours = (slots: TimeSlot[]): VolunteerHoursMap => {
    const hoursMap: VolunteerHoursMap = {};
    slots.forEach(slot => {
      if (slot.volunteers && slot.volunteers.length > 0) {
        const slotDuration = calculateSlotDuration(slot.start_time, slot.end_time);
        slot.volunteers.forEach(volunteer => {
          hoursMap[volunteer] = (hoursMap[volunteer] || 0) + slotDuration;
        });
      }
    });
    return hoursMap;
  };

  useEffect(() => {
    setIsLoading(true);
    const fetchSlotLimit = async () => {
      try {
        // Assegure-se que o caminho 'settings' e documento 'slotLimit' existem no seu Firestore
        const settingsDoc = await getDoc(doc(db, 'settings', 'userSlotLimit')); // Mudado para userSlotLimit como no seu onUpdate
        if (settingsDoc.exists()) {
          setSlotLimit(settingsDoc.data().value || 0); // Default 0 se value não existir
        } else {
          // Opcional: criar o documento se não existir com um valor padrão
           await setDoc(doc(db, 'settings', 'userSlotLimit'), { value: 0 });
           setSlotLimit(0); // Garante que slotLimit seja definido
        }
      } catch (error) {
        console.error('Erro ao buscar limite de slots:', error);
        // Não mostrar toast aqui, pode ser comum o doc não existir inicialmente
      }
    };

    fetchSlotLimit(); // Chamar independente de ser admin ou não, pois o usuário precisa saber o limite

    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection); // Adicione ordenação se necessário ex: orderBy("date"), orderBy("start_time")
    
    const unsubscribe = onSnapshot(q, snapshot => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let slotDateStr: string;
        if (data.date && typeof data.date.toDate === 'function') {
          slotDateStr = format(data.date.toDate(), 'yyyy-MM-dd');
        } else if (typeof data.date === 'string' && data.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            slotDateStr = data.date; // Já está no formato yyyy-MM-dd
        } else {
            console.warn(`Data em formato inválido para o slot ${docSnap.id}:`, data.date, "Usando data atual como fallback.");
            slotDateStr = format(new Date(), 'yyyy-MM-dd'); // Fallback, ou tratar como erro
        }
        return {
          id: docSnap.id,
          date: slotDateStr,
          start_time: data.start_time || "00:00", // Default para evitar erros
          end_time: data.end_time || "00:00",   // Default
          volunteers: data.volunteers || [],
          // slots_used é melhor calculado pelo tamanho do array volunteers para consistência
          slots_used: (data.volunteers || []).length, 
          total_slots: data.total_slots || data.slots || 0,
          description: data.description || "",
          allowedMilitaryTypes: data.allowedMilitaryTypes || []
        };
      });

      setTimeSlots(formattedSlots);
      // CALCULAR E ATUALIZAR AS HORAS TOTAIS DOS VOLUNTÁRIOS AQUI:
      setVolunteerTotalHours(calculateAllVolunteersTotalHours(formattedSlots));

      // Re-inicializar collapsed state para novas datas (mantendo as já existentes)
      const newCollapsedDatesState = { ...collapsedDates };
      formattedSlots.forEach(slot => {
        // Se a data não existe em collapsedDates E é passada E não é admin, então colapsa.
        if (newCollapsedDatesState[slot.date] === undefined && isPast(parseISO(slot.date)) && !isAfter(parseISO(slot.date), addDays(new Date(), -1)) && !isAdmin) {
          newCollapsedDatesState[slot.date] = true;
        } else if (newCollapsedDatesState[slot.date] === undefined) {
          // Se não for definida, padrão para não colapsada (false)
          newCollapsedDatesState[slot.date] = false;
        }
      });
      setCollapsedDates(newCollapsedDatesState);

      setIsLoading(false);
    }, error => {
      console.error('Erro ao ouvir horários:', error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível carregar os horários. Verifique sua conexão.",
        variant: "destructive"
      });
      setIsLoading(false);
    });

    // REMOVIDO: fetchVolunteerHours(); 
    // As horas agora são calculadas dinamicamente a partir dos timeSlots.

    return () => unsubscribe();
  }, [isAdmin]); // Removido toast, pois ele muda e causaria re-execução. O ideal é usar o toast fora do useEffect se ele for dinâmico.


  const handleVolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({ title: "Erro", description: "Usuário não identificado. Faça login novamente.", variant: "destructive" });
      return;
    }
    if (!timeSlot.id) {
        toast({ title: "Erro", description: "Identificador do horário inválido.", variant: "destructive" });
        return;
    }
    // Verifica o limite de slots do usuário ANTES de qualquer coisa
    const currentUserSlotCount = timeSlots.reduce(
        (count, slot) => slot.volunteers?.includes(volunteerName) ? count + 1 : count,
        0
      );
  
    if (slotLimit > 0 && currentUserSlotCount >= slotLimit && !isAdmin) { // slotLimit > 0 significa que há um limite
    toast({ title: "Limite atingido!🚫", description: `Você já atingiu o limite de ${slotLimit} horário(s).`, variant: "destructive" });
    return;
    }
    
    // Verifica se já está voluntariado em ALGUM slot NESTA MESMA DATA
    const isAlreadyRegisteredOnDate = timeSlots.some(
        slot => slot.date === timeSlot.date && slot.volunteers?.includes(volunteerName)
    );
    if (isAlreadyRegisteredOnDate) {
        toast({ title: "Erro ⛔", description: "Você já está voluntariado em um horário nesta data.", variant: "destructive" });
        return;
    }
    // Verifica se o slot está cheio
    if (timeSlot.slots_used >= timeSlot.total_slots) {
        toast({ title: "Erro", description: "Este horário já está lotado.", variant: "destructive"});
        return;
    }

    // Verifica se o tipo de militar é permitido
    if (timeSlot.allowedMilitaryTypes && timeSlot.allowedMilitaryTypes.length > 0 && userService && !timeSlot.allowedMilitaryTypes.includes(userService) && !isAdmin) {
        toast({ title: "Não Qualificado", description: `Este horário é apenas para: ${timeSlot.allowedMilitaryTypes.join(", ")}.`, variant: "destructive" });
        return;
    }


    try {
      const slotRef = doc(db, 'timeSlots', timeSlot.id);
      await updateDoc(slotRef, {
        volunteers: arrayUnion(volunteerName),
        // slots_used será atualizado automaticamente pelo listener com base no length de volunteers
      });

      toast({ title: "Sucesso!✅🤠", description: "Extra marcada. Aguarde a escala." });
    } catch (error) {
      console.error('Erro ao voluntariar:', error);
      toast({ title: "Erro 🤔", description: "Não foi possível reservar a Extra.", variant: "destructive" });
    }
  };

  const handleUnvolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({ title: "Erro 🤔", description: "Usuário não identificado. Faça login novamente.", variant: "destructive" });
      return;
    }
    if (!timeSlot.id) {
        toast({ title: "Erro", description: "Identificador do horário inválido.", variant: "destructive" });
        return;
    }

    try {
      const slotRef = doc(db, 'timeSlots', timeSlot.id);
      await updateDoc(slotRef, {
        volunteers: arrayRemove(volunteerName),
        // slots_used será atualizado automaticamente
      });
      toast({ title: "Desmarcado! 👀🤔", description: "Extra desmarcada com sucesso!" });
    } catch (error) {
      console.error('Erro ao desmarcar:', error);
      toast({ title: "Erro ⛔", description: "Não foi possível desmarcar a Extra.", variant: "destructive" });
    }
  };


  const handleUpdateSlotLimit = async (limit: number) => {
    if (isNaN(limit) || limit < 0) { // Permitir 0 para sem limite
      toast({ title: "Erro 😵‍💫", description: "Por favor, insira um número válido (0 para sem limite).", variant: "destructive" });
      return;
    }
    try {
      // Usar um nome de documento consistente, ex: 'userSlotLimit'
      await setDoc(doc(db, 'settings', 'userSlotLimit'), { value: limit });
      // setSlotLimit(limit); // O listener já vai atualizar, ou pode manter para feedback imediato
      toast({ title: "Sucesso", description: `Limite de horários atualizado para ${limit === 0 ? 'sem limite' : limit}!`});
    } catch (error) {
      console.error('Erro ao atualizar limite de slots:', error);
      toast({ title: "Erro", description: "Não foi possível atualizar o limite.", variant: "destructive" });
    }
  };

  // GroupTimeSlotsByDate e formatação (mantidas com pequenas melhorias)
  const groupTimeSlotsByDate = (slots: TimeSlot[]): GroupedTimeSlots => {
    return slots.reduce((groups: GroupedTimeSlots, slot) => {
      const date = slot.date;
      if (!groups[date]) {
        groups[date] = { slots: [], dailyCost: 0 }; // dailyCost será calculado depois
      }
      groups[date].slots.push(slot);
      return groups;
    }, {});
  };

  const isVolunteeredInSlot = (timeSlot: TimeSlot) => timeSlot.volunteers?.includes(volunteerName);
  const isSpecificSlotFull = (timeSlot: TimeSlot) => timeSlot.slots_used >= timeSlot.total_slots;

  const formatDateHeader = (date: string) => {
    try {
        const parsed = parseISO(date);
        const dayOfWeek = format(parsed, "eee", { locale: ptBR });
        const truncatedDay = dayOfWeek.substring(0, 3);
        return `${truncatedDay.charAt(0).toUpperCase()}${truncatedDay.slice(1)}. ${format(parsed, "dd/MM/yy")}`; // Ponto após dia da semana
    } catch(e) {
        console.error("Erro ao formatar data do cabeçalho:", date, e);
        return date; // Retorna a data original se houver erro
    }
  };


  // Recalculado userSlotCount usando useMemo para eficiência
  const userSlotCount = useMemo(() => {
    if (!volunteerName) return 0;
    return timeSlots.reduce(
      (count, slot) => slot.volunteers?.includes(volunteerName) ? count + 1 : count,
      0
    );
  }, [timeSlots, volunteerName]);


  // `calculatedGroupedTimeSlots` e `totalCostSummary` agora usam useMemo
  const calculatedGroupedTimeSlotsAndCosts = useMemo(() => {
    // Filtra primeiro os slots baseados no tipo de militar do usuário, se aplicável
    const slotsToProcess = timeSlots.filter(slot => {
        if (isAdmin || !slot.allowedMilitaryTypes || slot.allowedMilitaryTypes.length === 0 || !userService) {
          return true; // Admin vê tudo, ou sem restrição, ou usuário sem tipo de serviço definido
        }
        return slot.allowedMilitaryTypes.includes(userService);
      });

    const grouped: GroupedTimeSlots = groupTimeSlotsByDate(slotsToProcess);
    const newTotalCostSummary = { "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Outros": 0, "Total Geral": 0 };

    Object.keys(grouped).forEach(date => {
      let dailyTotalCost = 0;
      grouped[date].slots.forEach(slot => {
        if(slot.volunteers) {
            slot.volunteers.forEach(volFullName => {
            const volRank = getVolunteerRank(volFullName);
            const rankInfo = getRankCategory(volRank);
            const slotDurationHours = calculateSlotDuration(slot.start_time, slot.end_time);
            const slotCostForVolunteer = slotDurationHours * rankInfo.hourlyRate;
            
            dailyTotalCost += slotCostForVolunteer;
            const categoryKey = rankInfo.category as keyof typeof newTotalCostSummary;
            newTotalCostSummary[categoryKey] = (newTotalCostSummary[categoryKey] || 0) + slotCostForVolunteer;
            newTotalCostSummary["Total Geral"] += slotCostForVolunteer;
            });
        }
      });
      grouped[date].dailyCost = dailyTotalCost;
    });
    return { grouped, totalCostSummary: newTotalCostSummary };
  }, [timeSlots, isAdmin, userService]);

  const { grouped: calculatedGroupedTimeSlots, totalCostSummary } = calculatedGroupedTimeSlotsAndCosts;


  const handleActualRemoveVolunteer = async () => { // Renomeado para evitar conflito
    if (!volunteerToRemove || !volunteerToRemove.timeSlot.id) return;
    try {
      const slotRef = doc(db, 'timeSlots', volunteerToRemove.timeSlot.id);
      await updateDoc(slotRef, {
        volunteers: arrayRemove(volunteerToRemove.name),
        // slots_used será atualizado automaticamente pelo listener
      });
      toast({ title: "Sucesso! ✅", description: `${volunteerToRemove.name} foi removido.` });
    } catch (error) {
      console.error('Erro ao remover voluntário:', error);
      toast({ title: "Erro ⛔", description: "Não foi possível remover o voluntário.", variant: "destructive"});
    } finally {
        setVolunteerToRemove(null); // Fecha o dialog em qualquer caso
    }
  };


  // Calculo de Custo Semanal
  const weeklyCostAndRange = useMemo(() => {
    const todayDt = new Date();
    const tomorrowDt = addDays(todayDt, 1); // A partir de amanhã
    let cost = 0;
    const datesForRange: string[] = [];

    Object.entries(calculatedGroupedTimeSlots).forEach(([dateStr, groupData]) => {
      try {
        const slotDt = parseISO(dateStr);
        // Considera datas a partir de amanhã inclusive
        if (isAfter(slotDt, todayDt) || format(slotDt, 'yyyy-MM-dd') === format(tomorrowDt, 'yyyy-MM-dd')) {
          cost += groupData.dailyCost;
          datesForRange.push(dateStr);
        }
      } catch (e) {
        console.error("Erro ao parsear data para custo semanal:", dateStr, e);
      }
    });
    
    let rangeText = "";
    if (datesForRange.length > 0) {
        datesForRange.sort((a,b) => parseISO(a).getTime() - parseISO(b).getTime());
        const startDate = format(parseISO(datesForRange[0]), "dd/MM");
        const endDate = format(parseISO(datesForRange[datesForRange.length - 1]), "dd/MM");
        if(startDate === endDate) rangeText = startDate;
        else rangeText = `${startDate} - ${endDate}`;
    }
    return { weeklyCost: cost, weeklyDateRangeText: rangeText };
  }, [calculatedGroupedTimeSlots]);

  const { weeklyCost, weeklyDateRangeText } = weeklyCostAndRange;


  // CORRIGIDO: Usa volunteerTotalHours (que é um mapa de nome -> número de horas)
  const getVolunteerDisplayHours = (volunteerNameParam: string): string | null => {
    const totalHours = volunteerTotalHours[volunteerNameParam];
    if (totalHours !== undefined && totalHours > 0) {
      // Formata para 1 casa decimal, ex: 8.5h. Se for 8.0h, mostra 8h.
      return `${parseFloat(totalHours.toFixed(1))}h`;
    }
    return null; // Ou "0h" se preferir mostrar explicitamente
  };


  const renderAllowedMilitaryTypes = (types?: string[]) => {
    if (!types || types.length === 0) {
      return null; // Não renderiza nada se não houver restrições
    }
    return (
      <div className="mb-1 text-xs text-gray-600">
        <span className="font-medium">Para:</span> {types.join(", ")}
      </div>
    );
  };

  const toggleDateCollapse = (date: string) => {
    setCollapsedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  // Funções de verificação para botões, com lógica mais clara
  const canUserVolunteerForSlot = (slot: TimeSlot): boolean => {
    if(isAdmin) return true; // Admin sempre pode (para testes, etc.)
    if(isSpecificSlotFull(slot)) return false;
    if(isVolunteeredInSlot(slot)) return false; // Já está neste slot específico
    
    // Verifica limite geral do usuário
    if(slotLimit > 0 && userSlotCount >= slotLimit) return false;

    // Verifica se já está em outro slot na MESMA data
    const isVolunteeredOnDate = timeSlots.some(s => s.date === slot.date && s.id !== slot.id && s.volunteers?.includes(volunteerName));
    if(isVolunteeredOnDate) return false;

    // Verifica restrição de tipo de militar
    if(slot.allowedMilitaryTypes && slot.allowedMilitaryTypes.length > 0 && userService && !slot.allowedMilitaryTypes.includes(userService)){
        return false;
    }
    // Verifica se usuário é estágio (Estágios não podem se voluntariar)
    if(userData?.rank === "Estágio") return false;

    return true; // Se passou por todas as verificações
  }


  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-lg text-gray-700">Carregando horários...</p>
        </div>
      );
  }
  // Se não está carregando e não há slots
  if (!isLoading && timeSlots.length === 0) {
    return (
        <div className="space-y-6 p-4">
             <TimeSlotLimitControl
                slotLimit={slotLimit}
                onUpdateLimit={handleUpdateSlotLimit}
                userSlotCount={userSlotCount}
                isAdmin={isAdmin}
            />
            <div className="text-center py-10">
                <CalendarDays className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-700">Nenhum horário disponível</h3>
                <p className="text-gray-500">Verifique novamente mais tarde.</p>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6 p-4 pb-16 md:px-2"> {/* Mais padding no fundo para rolagem */}
      <TimeSlotLimitControl
        slotLimit={slotLimit}
        onUpdateLimit={handleUpdateSlotLimit}
        userSlotCount={userSlotCount}
        isAdmin={isAdmin}
      />

      {isAdmin && totalCostSummary["Total Geral"] > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Custos Estimados</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <p><strong>Cb/Sd:</strong> {formatCurrency(totalCostSummary["Cb/Sd"])}</p>
            <p><strong>St/Sgt:</strong> {formatCurrency(totalCostSummary["St/Sgt"])}</p>
            <p><strong>Oficiais:</strong> {formatCurrency(totalCostSummary["Oficiais"])}</p>
            {totalCostSummary["Outros"] > 0 && <p><strong>Outros:</strong> {formatCurrency(totalCostSummary["Outros"])}</p>}
            <p className="col-span-2 mt-2 pt-2 border-t font-semibold text-green-600 text-base">
                <strong>Total Geral:</strong> {formatCurrency(totalCostSummary["Total Geral"])}
            </p>
            {weeklyCost > 0 && (
              <p className="col-span-2 font-semibold text-blue-600">
                <strong>Custo Próx. Semana ({weeklyDateRangeText}):</strong> {formatCurrency(weeklyCost)}
              </p>
            )}
          </div>
        </div>
      )}

      {Object.entries(calculatedGroupedTimeSlots).sort((a,b) => a[0].localeCompare(b[0])).map(([date, groupedData]) => {
        const { slots, dailyCost } = groupedData;
        if (slots.length === 0) return null;
        
        const dateObj = parseISO(date);
        // Considera "passado" apenas dias estritamente anteriores a hoje
        const isDateStrictlyPast = isPast(dateObj) && !isAfter(dateObj, addDays(new Date(), -1)); 
        const isCollapsed = collapsedDates[date] ?? (isDateStrictlyPast && !isAdmin);
        // Ordenar slots por horário de início dentro de cada dia
        const sortedSlotsForDate = [...slots].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));


        return (
          <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div
                className={`flex items-center justify-between w-full p-3 md:p-4 border-b ${isAdmin ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                onClick={isAdmin ? () => toggleDateCollapse(date) : undefined}
            >
                <div className="flex items-center gap-2">
                <CalendarDays className={`h-5 w-5 ${isDateStrictlyPast ? 'text-gray-400' : 'text-blue-500'}`} />
                <h3 className={`font-medium text-lg ${isDateStrictlyPast ? 'text-gray-500' : 'text-gray-800'}`}>{formatDateHeader(date)}</h3>
                {isAdmin && dailyCost > 0 && (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {formatCurrency(dailyCost)}
                    </span>
                )}
                </div>
                <div className="flex items-center gap-2">
                <Badge
                    variant={isDateStrictlyPast ? "outline" : slots.some(isSpecificSlotFull) ? "destructive" : "secondary"}
                    className={`text-xs ${isDateStrictlyPast ? 'border-gray-300 text-gray-600' : ''}`}
                >
                    {slots.length} {slots.length === 1 ? 'Horário' : 'Horários'}
                </Badge>
                {isAdmin && (
                    <button className="focus:outline-none p-1 rounded hover:bg-gray-200">
                    {isCollapsed ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronUp className="h-5 w-5 text-gray-500" />}
                    </button>
                )}
            </div>

            </div>

            {!isCollapsed && (
              <div className="divide-y divide-gray-100">
                {sortedSlotsForDate.map((slot, idx) => {
                  const slotIsFull = isSpecificSlotFull(slot);
                  const isUserVolunteeredHere = isVolunteeredInSlot(slot);
                  const canCurrentUserVolunteer = canUserVolunteerForSlot(slot);
                  const slotDurationHours = calculateSlotDuration(slot.start_time, slot.end_time);

                  return (
                    <div key={slot.id} className={`p-3 md:p-4 space-y-3 transition-colors ${slotIsFull ? 'bg-red-50' : isUserVolunteeredHere ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        {renderAllowedMilitaryTypes(slot.allowedMilitaryTypes)}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <p className="font-medium text-gray-800">
                                {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                                <span className="text-xs text-gray-500 ml-1">({slotDurationHours.toFixed(1)}h)</span>
                                </p>
                            </div>
                            {slot.description && (
                                <span className="text-xs text-gray-600 sm:ml-2 max-w-[200px] truncate" title={slot.description}>
                                {slot.description}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <Badge variant={slotIsFull ? "destructive" : "outline"} className="text-xs">
                                {slotIsFull ? 'Lotado' : `${slot.total_slots - slot.slots_used} Vaga(s)`}
                            </Badge>
                            {/* Botão de voluntariar / desmarcar */}
                            <div className="pt-1">
                                {!isDateStrictlyPast && userData && ( // Botões só aparecem para datas futuras e se usuário logado
                                    isUserVolunteeredHere ? (
                                        <Button onClick={() => handleUnvolunteer(slot)} variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                                        Desmarcar
                                        </Button>
                                    ) : canCurrentUserVolunteer ? (
                                        <Button onClick={() => handleVolunteer(slot)} className="bg-blue-600 hover:bg-blue-700" size="sm">
                                        Voluntariar
                                        </Button>
                                    ) : (
                                        <Button size="sm" disabled className="text-xs">
                                            {slotIsFull ? "Lotado" : slotLimit > 0 && userSlotCount >= slotLimit ? "Limite Atingido" : "Indisponível"}
                                        </Button>
                                    )
                                )}
                            </div>
                        </div>


                        {slot.volunteers && slot.volunteers.length > 0 && (
                            <div className="pt-3 border-t border-gray-200 mt-3">
                            <p className="text-xs font-medium mb-2 text-gray-600">Voluntários ({slot.volunteers.length}):</p>
                            <div className="space-y-1">
                                {sortVolunteers(slot.volunteers).map((volunteer, index) => {
                                const displayHours = getVolunteerDisplayHours(volunteer); // Pega as horas totais do voluntário
                                return (
                                    <div key={`${slot.id}-vol-${index}`} className="text-sm text-gray-700 flex justify-between items-center group pr-1">
                                        <div className="flex items-center">
                                            <span>{volunteer}</span>
                                            {displayHours && <span className="text-xs text-blue-600 ml-1.5 font-medium">({displayHours} total)</span>}
                                        </div>
                                        {isAdmin && (
                                            <Button
                                            variant="ghost"
                                            size="icon" // Para ícone
                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-100"
                                            onClick={() => setVolunteerToRemove({ name: volunteer, timeSlot: slot })}
                                            >
                                            <X className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                );
                                })}
                            </div>
                            </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <AlertDialog open={!!volunteerToRemove} onOpenChange={() => setVolunteerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Voluntário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{volunteerToRemove?.name}</strong> do horário de
              {' '}{volunteerToRemove?.timeSlot.start_time.slice(0,5)} às {volunteerToRemove?.timeSlot.end_time.slice(0,5)}
              {' '}em {volunteerToRemove && formatDateHeader(volunteerToRemove.timeSlot.date)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleActualRemoveVolunteer}>
              Confirmar Remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeSlotsList;
