import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO, isPast, addDays, isAfter, startOfDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CalendarDays, Clock, ChevronDown, ChevronUp, MoreHorizontal, AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import supabase from "@/lib/supabaseClient";
import CostSummaryCard from "./CostSummaryCard";

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

interface User {
  id: string;
  email: string;
  warName: string;
  rank?: string;
  isVolunteer?: boolean;
  maxSlots?: number;
}

interface GroupedTimeSlots {
  [key: string]: {
    slots: TimeSlot[];
    dailyCost: number;
  };
}

const getMilitaryRankWeight = (rank: string): number => {
  const rankWeights: {
    [key: string]: number;
  } = {
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
    "Estágio": 0
  };
  return rankWeights[rank] || 0;
};

const getRankCategory = (rank: string): {
  category: string;
  hourlyRate: number;
} => {
  const cbSdRanks = ["Sd", "Sd PM", "Cb", "Cb PM"];
  const stSgtRanks = ["3° Sgt", "3° Sgt PM", "2° Sgt", "2° Sgt PM", "1° Sgt", "1° Sgt PM", "Sub Ten", "Sub Ten PM"];
  const oficiaisRanks = ["2° Ten", "2° Ten PM", "1° Ten", "1° Ten PM", "Cap", "Cap PM", "Maj", "Maj PM", "Ten Cel", "Ten Cel PM", "Cel", "Cel PM"];
  
  if (cbSdRanks.includes(rank)) return {
    category: "Cb/Sd",
    hourlyRate: 41.13
  };
  if (stSgtRanks.includes(rank)) return {
    category: "St/Sgt",
    hourlyRate: 56.28
  };
  if (oficiaisRanks.includes(rank)) return {
    category: "Oficiais",
    hourlyRate: 87.02
  };
  return {
    category: "Outros",
    hourlyRate: 0
  };
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

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [volunteerHours, setVolunteerHours] = useState<{
    [key: string]: string;
  }>({});
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  const isAdmin = userData?.userType === 'admin';
  const userService = userData?.service;
  const [collapsedDates, setCollapsedDates] = useState<{
    [key: string]: boolean;
  }>({});

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

  // Calcular horas totais de cada voluntário progressivamente baseado na data
  const calculateProgressiveVolunteerHours = useMemo(() => {
    const progressiveHours: { [key: string]: { [date: string]: number } } = {};
    
    // Ordenar time slots por data para calcular progressivamente
    const sortedSlots = [...timeSlots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedSlots.forEach(slot => {
      if (slot.volunteers && slot.volunteers.length > 0) {
        const hours = calculateTimeDifference(slot.start_time, slot.end_time);
        const numericHours = parseFloat(hours);
        
        slot.volunteers.forEach(volunteer => {
          if (!progressiveHours[volunteer]) {
            progressiveHours[volunteer] = {};
          }
          
          // Calcular o total acumulado até essa data
          let accumulatedHours = 0;
          sortedSlots.forEach(prevSlot => {
            if (new Date(prevSlot.date) <= new Date(slot.date) && 
                prevSlot.volunteers && 
                prevSlot.volunteers.includes(volunteer)) {
              const prevHours = parseFloat(calculateTimeDifference(prevSlot.start_time, prevSlot.end_time));
              accumulatedHours += prevHours;
            }
          });
          
          progressiveHours[volunteer][slot.date] = accumulatedHours;
        });
      }
    });
    
    return progressiveHours;
  }, [timeSlots]);

  const fetchVolunteerHours = async () => {
    if (!isAdmin) return;
    try {
      const currentMonth = format(new Date(), 'MMMM', {
        locale: ptBR
      }).toUpperCase();
      type TableName = "JANEIRO" | "FEVEREIRO" | "MARCO" | "ABRIL" | "MAIO" | "JUNHO" | "JULHO" | "AGOSTO" | "SETEMBRO" | "OUTUBRO" | "NOVEMBRO" | "DEZEMBRO" | "ESCALA";
      let tableName: TableName;
      if (currentMonth === 'JANEIRO') tableName = "JANEIRO";else if (currentMonth === 'FEVEREIRO') tableName = "FEVEREIRO";else if (currentMonth === 'MARÇO') tableName = "MARCO";else if (currentMonth === 'ABRIL') tableName = "ABRIL";else if (currentMonth === 'MAIO') tableName = "MAIO";else if (currentMonth === 'JUNHO') tableName = "JUNHO";else if (currentMonth === 'JULHO') tableName = "JULHO";else if (currentMonth === 'AGOSTO') tableName = "AGOSTO";else if (currentMonth === 'SETEMBRO') tableName = "SETEMBRO";else if (currentMonth === 'OUTUBRO') tableName = "OUTUBRO";else if (currentMonth === 'NOVEMBRO') tableName = "NOVEMBRO";else tableName = "DEZEMBRO";
      const {
        data,
        error
      } = await supabase.from(tableName).select('Nome, "Total Geral"');
      if (error) {
        console.error('Error fetching volunteer hours:', error);
        return;
      }
      const hoursMap: {
        [key: string]: string;
      } = {};
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

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        maxSlots: doc.data().maxSlots || 1
      }) as User);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getCurrentUserMaxSlots = (): number => {
    if (!userData?.email) return 1;
    const user = users.find(u => u.email === userData.email);
    return user?.maxSlots || 1;
  };

  useEffect(() => {
    fetchUsers();
    setIsLoading(true);

    // Listen to timeSlots in real-time
    const timeSlotsCollection = collection(db, 'timeSlots');
    const timeSlotsQuery = query(timeSlotsCollection);
    const unsubscribeTimeSlots = onSnapshot(timeSlotsQuery, snapshot => {
      const formattedSlots: TimeSlot[] = [];
      
      snapshot.docs.forEach(docSnap => {
        try {
          const data = docSnap.data();
          let slotDateStr: string;
          
          // Verificar se o campo date existe e é válido
          if (data.date && typeof data.date.toDate === 'function') {
            slotDateStr = format(data.date.toDate(), 'yyyy-MM-dd');
          } else if (data.date && typeof data.date === 'string') {
            slotDateStr = data.date;
          } else {
            console.warn('Document with invalid or missing date:', docSnap.id, data);
            return; // Pular este documento
          }
          
          // Verificar se os campos obrigatórios existem
          if (!data.start_time || !data.end_time) {
            console.warn('Document with missing time fields:', docSnap.id, data);
            return; // Pular este documento
          }
          
          formattedSlots.push({
            id: docSnap.id,
            date: slotDateStr,
            start_time: data.start_time,
            end_time: data.end_time,
            volunteers: data.volunteers || [],
            slots_used: data.slots_used || 0,
            total_slots: data.total_slots || data.slots || 0,
            description: data.description || "",
            allowedMilitaryTypes: data.allowedMilitaryTypes || []
          });
        } catch (error) {
          console.error('Error processing document:', docSnap.id, error);
        }
      });

      // Initialize collapsed state - past dates (including today) should be collapsed
      const newCollapsedDates: {
        [key: string]: boolean;
      } = {};
      formattedSlots.forEach(slot => {
        try {
          const slotDate = parseISO(slot.date);
          const isDatePastOrToday = isPast(startOfDay(slotDate)) || isToday(slotDate);
          
          if (isDatePastOrToday) {
            newCollapsedDates[slot.date] = true;
          }
        } catch (error) {
          console.error('Error parsing date for collapsed state:', slot.date, error);
        }
      });
      setCollapsedDates(newCollapsedDates);
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

    // Listen to users in real-time for volunteer status and maxSlots changes
    const usersCollection = collection(db, 'users');
    const usersQuery = query(usersCollection);
    const unsubscribeUsers = onSnapshot(usersQuery, snapshot => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        maxSlots: doc.data().maxSlots || 1
      }) as User);
      setUsers(usersData);
    }, error => {
      console.error('Erro ao ouvir usuários:', error);
    });
    
    if (isAdmin) {
      fetchVolunteerHours();
    }
    
    return () => {
      unsubscribeTimeSlots();
      unsubscribeUsers();
    };
  }, [toast, isAdmin]);

  const handleVolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }
    const userMaxSlots = getCurrentUserMaxSlots();
    const userSlotCount = timeSlots.reduce((count, slot) => slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0);
    if (userSlotCount >= userMaxSlots && !isAdmin) {
      toast({
        title: "Limite atingido!🚫",
        description: `Você atingiu o limite de ${userMaxSlots} horário${userMaxSlots === 1 ? '' : 's'} por usuário.`,
        variant: "destructive"
      });
      return;
    }
    const slotsForDate = timeSlots.filter(slot => slot.date === timeSlot.date);
    const isAlreadyRegistered = slotsForDate.some(slot => slot.volunteers?.includes(volunteerName));
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
      const result = await dataOperations.update(updatedSlot, {
        date: timeSlot.date,
        start_time: timeSlot.start_time,
        end_time: timeSlot.end_time
      });
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
      const result = await dataOperations.update(updatedSlot, {
        date: timeSlot.date,
        start_time: timeSlot.start_time,
        end_time: timeSlot.end_time
      });
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

  const groupTimeSlotsByDate = (slots: TimeSlot[]): GroupedTimeSlots => {
    return slots.reduce((groups: GroupedTimeSlots, slot) => {
      const date = slot.date;
      if (!groups[date]) {
        groups[date] = {
          slots: [],
          dailyCost: 0
        };
      }
      groups[date].slots.push(slot);
      return groups;
    }, {});
  };

  const isVolunteered = (timeSlot: TimeSlot) => timeSlot.volunteers?.includes(volunteerName);
  const isSlotFull = (timeSlot: TimeSlot) => timeSlot.slots_used === timeSlot.total_slots;
  const formatDateHeader = (date: string) => {
    try {
      const dayOfWeek = format(parseISO(date), "eee", {
        locale: ptBR
      });
      const truncatedDay = dayOfWeek.substring(0, 3);
      return `${truncatedDay.charAt(0).toUpperCase()}${truncatedDay.slice(1)}-${format(parseISO(date), "dd/MM/yy")}`;
    } catch (error) {
      console.error('Error formatting date header:', date, error);
      return date; // Fallback to raw date string
    }
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
    const userMaxSlots = getCurrentUserMaxSlots();
    const userSlotCount = timeSlots.reduce((count, s) => s.volunteers?.includes(volunteerName) ? count + 1 : count, 0);
    if (userSlotCount >= userMaxSlots && !isAdmin) {
      return false;
    }
    const slotsForDate = timeSlots.filter(s => s.date === slot.date);
    const isVolunteeredForDate = slotsForDate.some(s => s.volunteers?.includes(volunteerName));
    return !isVolunteeredForDate;
  };

  const canVolunteerForSlot = (slot: TimeSlot) => {
    if (isAdmin) return true;
    const userMaxSlots = getCurrentUserMaxSlots();
    const userSlotCount = timeSlots.reduce((count, s) => s.volunteers?.includes(volunteerName) ? count + 1 : count, 0);
    return userSlotCount < userMaxSlots;
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
  const [totalCostSummary, setTotalCostSummary] = useState<{
    "Cb/Sd": number;
    "St/Sgt": number;
    "Oficiais": number;
    "Total Geral": number;
  }>({
    "Cb/Sd": 0,
    "St/Sgt": 0,
    "Oficiais": 0,
    "Total Geral": 0
  });

  useEffect(() => {
    const slotsToProcess = timeSlots.filter(slot => {
      if (isAdmin || !slot.allowedMilitaryTypes || slot.allowedMilitaryTypes.length === 0 || !userService) {
        return true;
      }
      return slot.allowedMilitaryTypes.includes(userService);
    });
    const grouped = groupTimeSlotsByDate(slotsToProcess);
    const newTotalCostSummary = {
      "Cb/Sd": 0,
      "St/Sgt": 0,
      "Oficiais": 0,
      "Total Geral": 0
    };
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
  const userMaxSlots = getCurrentUserMaxSlots();
  const [volunteerToRemove, setVolunteerToRemove] = useState<{
    name: string;
    timeSlot: TimeSlot;
  } | null>(null);

  const handleRemoveVolunteer = async (timeSlot: TimeSlot, volunteerNameToRemove: string) => {
    try {
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used - 1,
        volunteers: (timeSlot.volunteers || []).filter(v => v !== volunteerNameToRemove)
      };
      const result = await dataOperations.update(updatedSlot, {
        date: timeSlot.date,
        start_time: timeSlot.start_time,
        end_time: timeSlot.end_time
      });
      if (!result.success) {
        throw new Error('Falha ao remover voluntário');
      }
      toast({
        title: "Sucesso! ✅",
        description: `${volunteerNameToRemove} foi removido deste horário.`
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

  const today = new Date();
  const tomorrow = addDays(today, 1);
  let weeklyCost = 0;
  let weeklyCostDates: string[] = [];
  if (calculatedGroupedTimeSlots) {
    Object.entries(calculatedGroupedTimeSlots).filter(([date]) => {
      try {
        const slotDate = parseISO(date);
        const isWeeklyDate = isAfter(slotDate, tomorrow) || format(slotDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
        if (isWeeklyDate) {
          weeklyCostDates.push(date);
        }
        return isWeeklyDate;
      } catch (error) {
        console.error('Error processing weekly cost date:', date, error);
        return false;
      }
    }).forEach(([, groupedData]) => {
      weeklyCost += groupedData.dailyCost;
    });
  }

  const formatWeeklyDateRange = () => {
    if (weeklyCostDates.length === 0) return "";
    const sortedDates = weeklyCostDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    try {
      const startDate = format(parseISO(sortedDates[0]), "eee", {
        locale: ptBR
      }).substring(0, 3).toUpperCase();
      const endDate = format(parseISO(sortedDates[sortedDates.length - 1]), "eee", {
        locale: ptBR
      }).substring(0, 3).toUpperCase();
      return `${startDate}-${endDate}`;
    } catch (error) {
      console.error('Error formatting weekly date range:', error);
      return "";
    }
  };

  const weeklyDateRangeText = formatWeeklyDateRange();

  if (isLoading) {
    return <div className="p-4">Carregando horários...</div>;
  }

  const getVolunteerHours = (volunteerNameParam: string) => {
    if (volunteerHours[volunteerNameParam]) {
      return volunteerHours[volunteerNameParam];
    }
    const volunteerNameParts = volunteerNameParam.split(' ');
    const warName = volunteerNameParts.slice(1).join(' ');
    for (const key in volunteerHours) {
      if (key.includes(warName)) {
        return volunteerHours[key];
      }
    }
    return null;
  };

  const renderAllowedMilitaryTypes = (allowedMilitaryTypes?: string[]) => {
    if (!allowedMilitaryTypes || allowedMilitaryTypes.length === 0) {
      return <span className="text-xs text-gray-400 italic">Sem restrição de categoria</span>;
    }
    return <span className="text-xs text-blue-700 bg-blue-0 rounded px-2 py-1">
        PM's: {allowedMilitaryTypes.join(", ")}
      </span>;
  };

  const toggleDateCollapse = (date: string) => {
    // Only admins can toggle collapsed state
    if (isAdmin) {
      setCollapsedDates(prev => ({
        ...prev,
        [date]: !prev[date]
      }));
    }
  };

  // Função para formatar as horas progressivas do voluntário para uma data específica
  const formatVolunteerWithProgressiveHours = (volunteer: string, date: string) => {
    const progressiveHours = calculateProgressiveVolunteerHours[volunteer]?.[date];
    if (isAdmin && progressiveHours && progressiveHours > 0) {
      // Formatar sem casas decimais desnecessárias
      const formattedHours = progressiveHours % 1 === 0 ? progressiveHours.toString() : progressiveHours.toFixed(1);
      return `${volunteer} - ${formattedHours}h`;
    }
    return volunteer;
  };

  return <div className="space-y-6 p-4 py-0 my-0 px-0">
      {!isAdmin && <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              {userSlotCount >= userMaxSlots ? <p className="text-orange-600 font-medium">Horários esgotados</p> : <p className="text-gray-700">
                  Escolha {userMaxSlots - userSlotCount}{" "}
                  {userMaxSlots - userSlotCount === 1 ? "horário" : "horários"}
                </p>}
              <p className="text-sm text-gray-500">
                {userSlotCount} de {userMaxSlots} horários preenchidos
              </p>
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-medium">{userSlotCount}/{userMaxSlots}</span>
            </div>
          </div>
        </div>}

      {isAdmin && totalCostSummary["Total Geral"] > 0 && 
        <CostSummaryCard totalCostSummary={totalCostSummary} />
      }

      {Object.entries(calculatedGroupedTimeSlots).sort().map(([date, groupedData]) => {
      const {
        slots,
        dailyCost
      } = groupedData;
      if (slots.length === 0) return null;
      
      let slotDate;
      let isDatePastOrToday = false;
      
      try {
        slotDate = parseISO(date);
        isDatePastOrToday = isPast(startOfDay(slotDate)) || isToday(slotDate);
      } catch (error) {
        console.error('Error parsing date in render:', date, error);
        return null; // Skip this date if it can't be parsed
      }
      
      // Hide past dates completely for non-admin users
      if (!isAdmin && isDatePastOrToday) {
        return null;
      }
      
      const isCollapsed = collapsedDates[date] ?? isDatePastOrToday;
      const sortedSlots = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      return <div key={date} className="bg-white rounded-lg shadow-sm" onDoubleClick={() => toggleDateCollapse(date)}>
            <div className="p-4 md:p-5 px-[5px]">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className={`h-5 w-5 ${isDatePastOrToday ? 'text-gray-500' : 'text-blue-500'}`} />
                    <h3 className="font-medium text-lg text-gray-800">{formatDateHeader(date)}</h3>
                    {isAdmin && dailyCost > 0 && <span className="text-green-600 font-semibold text-base">
                        {formatCurrency(dailyCost)}
                      </span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isDatePastOrToday ? "outline" : "secondary"} className={`${isDatePastOrToday ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                      {isDatePastOrToday ? "Extra" : "Extra"}
                    </Badge>
                    {isAdmin && <button className="focus:outline-none" onClick={() => toggleDateCollapse(date)}>
                        {isCollapsed ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronUp className="h-5 w-5 text-gray-500" />}
                      </button>}
                  </div>
                </div>
              </div>

              {!isCollapsed && <div className="space-y-3 mt-4">
                  {sortedSlots.map((slot, idx) => <div key={slot.id || idx} className={`border rounded-lg p-4 space-y-3 transition-all ${isSlotFull(slot) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      {isAdmin && <div className="mb-1">
                          {renderAllowedMilitaryTypes(slot.allowedMilitaryTypes)}
                        </div>}

                      <div className="flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
                            <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <p className="font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                              {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)}-
                              {calculateTimeDifference(slot.start_time, slot.end_time).slice(0, 4)}h
                            </p>
                          </div>
                          {slot.description && <span className="text-gray-700 ml-2 max-w-[200px] truncate">
                              {slot.description}
                            </span>}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${isSlotFull(slot) ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            <span className="text-sm font-medium whitespace-nowrap">
                              {isSlotFull(slot) ? 'Vagas Esgotadas' : `${slot.total_slots - slot.slots_used} ${slot.total_slots - slot.slots_used === 1 ? 'vaga' : 'vagas'}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {slot.volunteers && slot.volunteers.length > 0 && <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium mb-2 text-gray-700">Voluntários:</p>
                          <div className="space-y-1">
                            {sortVolunteers(slot.volunteers).map((volunteer, index) => <div key={index} className="text-sm text-gray-600 pl-2 border-l-2 border-gray-300 flex justify-between items-center">
                                <div className="flex items-center">
                                  <span>{formatVolunteerWithProgressiveHours(volunteer, date)}</span>
                                  {isAdmin && getVolunteerHours(volunteer) && <span className="ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                      {getVolunteerHours(volunteer)}h
                                    </span>}
                                </div>
                                {isAdmin && <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500" onClick={() => setVolunteerToRemove({
                      name: volunteer,
                      timeSlot: slot
                    })}>
                                    <X className="h-4 w-4" />
                                  </Button>}
                              </div>)}
                          </div>
                        </div>}

                      <div className="pt-2">
                        {shouldShowVolunteerButton(slot) && (isVolunteered(slot) ? <Button onClick={() => handleUnvolunteer(slot)} variant="destructive" size="sm" className="w-full shadow-sm hover:shadow">
                              Desmarcar
                            </Button> : !isSlotFull(slot) && canVolunteerForSlot(slot) && <Button onClick={() => handleVolunteer(slot)} className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow w-full" size="sm">
                                Voluntário
                              </Button>)}
                      </div>
                    </div>)}
                </div>}
            </div>
          </div>;
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
    </div>;
};

export default TimeSlotsList;
