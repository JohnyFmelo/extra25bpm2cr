import React, { useState, useEffect } from "react";
import { format, parseISO, isPast, addDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Assuming db is your initialized Firestore instance
import { UserRoundCog, CalendarDays, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import supabase from "@/lib/supabaseClient"; // Assuming supabase is your initialized Supabase client

interface TimeSlot {
  id?: string;
  date: string; // Expecting "YYYY-MM-DD" format
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[]; // e.g., ["3° Sgt PM Simões", "Cb PM Silva"]
  description?: string;
}

interface GroupedTimeSlots {
  [key: string]: {
    slots: TimeSlot[];
    dailyCost: number;
  };
}

// --- Firebase User Data Structure (Assumption) ---
interface FirebaseUserData {
    rank: string;
    warName: string;
    matricula: string;
    // ... other fields
}

// --- Supabase Hours Data Structure ---
// Key: "matricula-tableName" (e.g., "123456-JANEIRO")
// Value: "Total Geral" (string, e.g., "30")
type SupabaseHoursCache = { [key: string]: string };

// --- User Matricula Cache Structure ---
// Key: Full Name (e.g., "3° Sgt PM Simões")
// Value: Matricula (string, e.g., "123456")
type UserMatriculaCache = { [fullName: string]: string };


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
  // Handle cases like "3° Sgt PM" - extract the core rank
  const coreRank = rank.replace(" PM", "");
  return rankWeights[coreRank] || rankWeights[rank] || 0; // Check both with and without PM
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

// Helper to get the rank part from the full name string
const getVolunteerRank = (volunteerFullName: string): string => {
  const parts = volunteerFullName.split(" ");
  // Handle ranks with multiple parts like "1° Ten", "Sub Ten", "Ten Cel" etc.
  if (parts.length >= 3 && (parts[1] === "Sgt" || parts[1] === "Ten" || parts[1] === "Cel" || parts[0] === "Sub")) {
     // Check if the third part is PM, include it if so.
     if (parts[2]?.toUpperCase() === "PM") {
       return `${parts[0]} ${parts[1]} ${parts[2]}`;
     }
     return `${parts[0]} ${parts[1]}`;
  }
   // Handle single-word ranks like "Cb", "Sd", "Cap", "Maj" etc.
  if (parts.length >= 2 && parts[1]?.toUpperCase() === "PM") {
      return `${parts[0]} ${parts[1]}`;
  }
  return parts[0]; // Fallback to just the first part
};


const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value).replace("R$", "R$ ");
};

// Helper function to get Supabase Table Name from a date string (YYYY-MM-DD)
const getSupabaseTableNameFromDate = (dateString: string): string | null => {
    try {
        const date = parseISO(dateString); // Ensure date is parsed correctly
        const monthName = format(date, 'MMMM', { locale: ptBR }).toUpperCase();
        switch (monthName) {
            case 'JANEIRO': return 'JANEIRO';
            case 'FEVEREIRO': return 'FEVEREIRO';
            case 'MARÇO': return 'MARCO'; // Note: Supabase table likely uses 'MARCO'
            case 'ABRIL': return 'ABRIL';
            case 'MAIO': return 'MAIO';
            case 'JUNHO': return 'JUNHO';
            case 'JULHO': return 'JULHO';
            case 'AGOSTO': return 'AGOSTO';
            case 'SETEMBRO': return 'SETEMBRO';
            case 'OUTUBRO': return 'OUTUBRO';
            case 'NOVEMBRO': return 'NOVEMBRO';
            case 'DEZEMBRO': return 'DEZEMBRO';
            default:
                console.warn(`Unknown month name derived from date ${dateString}: ${monthName}`);
                return null; // Or handle as an error
        }
    } catch (error) {
        console.error(`Error parsing date or getting month name from date ${dateString}:`, error);
        return null;
    }
};


const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slotLimit, setSlotLimit] = useState<number>(0);
  // const [volunteerHours, setVolunteerHours] = useState<{[key: string]: string}>({}); // REMOVED - Replaced by supabaseHoursCache
  const { toast } = useToast();
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  const isAdmin = userData?.userType === 'admin';

  // NEW STATE: Store mapping of Full Name -> Matricula
  const [userMatriculaCache, setUserMatriculaCache] = useState<UserMatriculaCache>({});
  // NEW STATE: Store fetched Supabase hours ( Matricula-TableName -> TotalGeral )
  const [supabaseHoursCache, setSupabaseHoursCache] = useState<SupabaseHoursCache>({});
  // NEW STATE: Track which fetches are in progress to avoid duplicates
  const [fetchingKeys, setFetchingKeys] = useState<Set<string>>(new Set());


  const calculateTimeDifference = (startTime: string, endTime: string): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    // Handle overnight shifts (e.g., 22:00 to 06:00)
    if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
      endHour += 24;
    }
    let diffHours = endHour - startHour;
    let diffMinutes = endMinute - startMinute;
    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }
    const totalHours = diffHours + diffMinutes / 60;
    // Format to avoid long decimals, e.g., show "6" instead of "6.0"
    return totalHours % 1 === 0 ? `${totalHours}` : `${totalHours.toFixed(1)}`;
  };

  // REMOVED old fetchVolunteerHours - Replaced by useEffect below

  // --- NEW: useEffect to fetch User Matriculas from Firebase ---
  useEffect(() => {
    setIsLoading(true); // Start loading indicator early
    const usersCollection = collection(db, 'users'); // Adjust 'users' if your collection name is different
    const q = query(usersCollection);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matriculasMap: UserMatriculaCache = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as FirebaseUserData; // Cast to expected type
        if (data.rank && data.warName && data.matricula) {
          const fullName = `${data.rank} ${data.warName}`;
          matriculasMap[fullName] = data.matricula;
        }
      });
      setUserMatriculaCache(matriculasMap);
      // setIsLoading(false); // Don't stop loading here, wait for timeSlots too
    }, (error) => {
      console.error('Erro ao buscar matrículas dos usuários:', error);
      toast({
        title: "Erro ao buscar usuários",
        description: "Não foi possível obter as matrículas.",
        variant: "destructive"
      });
      // setIsLoading(false); // Stop loading on error
    });

    return () => unsubscribe(); // Cleanup listener
  }, [toast]); // Run only once on mount


  // --- MODIFIED: useEffect to fetch TimeSlots and trigger Supabase fetches ---
  useEffect(() => {
    // Fetch slot limit first
    const fetchSlotLimit = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'slotLimit'));
        if (settingsDoc.exists()) {
          setSlotLimit(settingsDoc.data().value || 0);
        } else {
            setSlotLimit(1); // Default limit if not set
        }
      } catch (error) {
        console.error('Erro ao buscar limite de slots:', error);
        setSlotLimit(1); // Default on error
      }
    };
    fetchSlotLimit();

    setIsLoading(true); // Ensure loading is true while fetching slots
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date, // Assume this is "YYYY-MM-DD"
          start_time: data.start_time,
          end_time: data.end_time,
          volunteers: data.volunteers || [],
          slots_used: data.slots_used || (data.volunteers?.length ?? 0), // Calculate if missing
          total_slots: data.total_slots || data.slots || 1, // Ensure total_slots has a default
          description: data.description || ""
        };
      });
      setTimeSlots(formattedSlots);
      setIsLoading(false); // Stop loading after slots are fetched

      // --- Trigger Supabase fetch *after* slots are loaded ---
      // This part will run every time timeSlots changes.
      // It's inefficient as requested (fetches for all volunteers in all slots).
      if (isAdmin && Object.keys(userMatriculaCache).length > 0) { // Only run if admin and matriculas are ready
          const uniqueFetchKeys = new Set<string>();

          formattedSlots.forEach(slot => {
              const tableName = getSupabaseTableNameFromDate(slot.date);
              if (tableName && slot.volunteers) {
                  slot.volunteers.forEach(volunteerFullName => {
                      const matricula = userMatriculaCache[volunteerFullName];
                      if (matricula) {
                          const fetchKey = `${matricula}-${tableName}`;
                          // Add to set only if not already fetched and not currently fetching
                          if (!supabaseHoursCache[fetchKey] && !fetchingKeys.has(fetchKey)) {
                              uniqueFetchKeys.add(fetchKey);
                          }
                      }
                  });
              }
          });

          // Add new keys to the fetching set
          setFetchingKeys(prev => new Set([...prev, ...uniqueFetchKeys]));

          // Perform the fetches
          uniqueFetchKeys.forEach(async (fetchKey) => {
              const [matricula, tableName] = fetchKey.split('-');
              try {
                  const { data, error } = await supabase
                      .from(tableName)
                      .select('"Total Geral"') // Select only the required column
                      .eq('matricula', matricula) // Filter by matricula column
                      .maybeSingle(); // Use maybeSingle to handle no match gracefully

                  if (error) {
                      // Don't throw, just log, maybe the user isn't in that month's table
                      console.warn(`Supabase warning for key ${fetchKey}:`, error.message);
                      // Store null or an empty string to indicate fetch attempt failed/no data
                      setSupabaseHoursCache(prev => ({ ...prev, [fetchKey]: '' })); // Indicate checked, no value
                  } else if (data) {
                      const totalGeral = data['Total Geral'] as string | null;
                      setSupabaseHoursCache(prev => ({ ...prev, [fetchKey]: totalGeral || '' }));
                  } else {
                      // No data found for this matricula in this table
                       setSupabaseHoursCache(prev => ({ ...prev, [fetchKey]: '' })); // Indicate checked, no value
                  }
              } catch (err) {
                  console.error(`Error fetching Supabase data for key ${fetchKey}:`, err);
                  setSupabaseHoursCache(prev => ({ ...prev, [fetchKey]: '' })); // Indicate error
              } finally {
                  // Remove key from fetching set regardless of outcome
                  setFetchingKeys(prev => {
                      const next = new Set(prev);
                      next.delete(fetchKey);
                      return next;
                  });
              }
          });
      }
      // --- End Supabase fetch trigger ---

    }, (error) => {
      console.error('Erro ao ouvir horários:', error);
      toast({
        title: "Erro ao atualizar horários",
        description: "Não foi possível receber atualizações em tempo real.",
        variant: "destructive"
      });
      setIsLoading(false); // Stop loading on error
    });

    return () => unsubscribe(); // Cleanup listener
  }, [toast, isAdmin, userMatriculaCache]); // Re-run if isAdmin or userMatriculaCache changes


  // --- NEW/MODIFIED: Function to get hours from cache ---
  const getVolunteerTotalHours = (volunteerFullName: string, slotDate: string): string | null => {
      if (!isAdmin) return null; // Only show for admin

      const matricula = userMatriculaCache[volunteerFullName];
      if (!matricula) return null; // Matricula not found

      const tableName = getSupabaseTableNameFromDate(slotDate);
      if (!tableName) return null; // Could not determine table

      const cacheKey = `${matricula}-${tableName}`;
      const hours = supabaseHoursCache[cacheKey];

      // Return hours if found and not an empty string (which indicates checked but no value)
      return hours ? hours : null;
  };


  const handleVolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({ title: "Erro", description: "Usuário não encontrado. Por favor, faça login novamente.", variant: "destructive" });
      return;
    }
    // Recalculate userSlotCount based on current state
    const currentUserSlotCount = timeSlots.reduce((count, slot) => slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0);
    if (currentUserSlotCount >= slotLimit && !isAdmin) {
      toast({ title: "Limite atingido!🚫", description: `Você atingiu o limite de ${slotLimit} horário${slotLimit === 1 ? '' : 's'}.`, variant: "destructive" });
      return;
    }
    // Check if already registered for *any* slot on the *same date*
    const isAlreadyRegisteredForDate = timeSlots.some(slot => slot.date === timeSlot.date && slot.volunteers?.includes(volunteerName));
    if (isAlreadyRegisteredForDate) {
        toast({ title: "Erro ⛔", description: "Você já está registrado em um horário nesta data.", variant: "destructive" });
        return;
    }
    // Check if this specific slot is full
    if (timeSlot.slots_used >= timeSlot.total_slots) {
        toast({ title: "Erro ⛔", description: "Este horário não possui mais vagas.", variant: "destructive" });
        return; // Should not happen if button logic is correct, but good safety check
    }

    try {
      const updatedSlot = {
        ...timeSlot,
        volunteers: [...(timeSlot.volunteers || []), volunteerName].sort(), // Keep volunteers sorted if desired
        // slots_used should be updated by a trigger or cloud function ideally,
        // but we update it here for immediate UI feedback. Be cautious of race conditions.
        slots_used: (timeSlot.volunteers?.length || 0) + 1,
      };
      // Use the specific ID for updating
      if (!timeSlot.id) throw new Error("Time slot ID is missing");
      await setDoc(doc(db, 'timeSlots', timeSlot.id), {
          volunteers: updatedSlot.volunteers,
          slots_used: updatedSlot.slots_used
      }, { merge: true }); // Use merge: true to only update these fields

      toast({ title: "Sucesso!✅🤠", description: "Extra marcada. Aguarde a escala." });
    } catch (error) {
      console.error('Erro ao voluntariar:', error);
      toast({ title: "Erro 🤔", description: "Não foi possível reservar a Extra.", variant: "destructive" });
    }
  };

  const handleUnvolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({ title: "Erro 🤔", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }
    try {
      const updatedVolunteers = (timeSlot.volunteers || []).filter(v => v !== volunteerName);
      const updatedSlot = {
        ...timeSlot,
        volunteers: updatedVolunteers,
         // slots_used should be updated by a trigger or cloud function ideally
        slots_used: updatedVolunteers.length,
      };
       if (!timeSlot.id) throw new Error("Time slot ID is missing");
       await setDoc(doc(db, 'timeSlots', timeSlot.id), {
           volunteers: updatedSlot.volunteers,
           slots_used: updatedSlot.slots_used
       }, { merge: true });

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
      // No need to set state here, listener should update it if settings doc changes
      // setSlotLimit(limit);
      toast({ title: "Sucesso", description: "Limite de horários atualizado com sucesso!" });
    } catch (error) {
      console.error('Erro ao atualizar limite de slots:', error);
      toast({ title: "Erro", description: "Não foi possível atualizar o limite.", variant: "destructive" });
    }
  };

  // Grouping logic remains the same, but cost calculation needs adjustment if needed
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

  // Memoize derived state calculations if they become complex
  const calculatedGroupedTimeSlots = React.useMemo(() => groupTimeSlotsByDate(timeSlots), [timeSlots]);
  const userSlotCount = React.useMemo(() => timeSlots.reduce((count, slot) => slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0), [timeSlots, volunteerName]);


  const isVolunteered = (timeSlot: TimeSlot) => timeSlot.volunteers?.includes(volunteerName);
  const isSlotFull = (timeSlot: TimeSlot) => timeSlot.slots_used >= timeSlot.total_slots;
  const formatDateHeader = (date: string) => {
    try {
        const parsedDate = parseISO(date);
        const dayOfWeek = format(parsedDate, "eee", { locale: ptBR });
        const truncatedDay = dayOfWeek.substring(0, 3);
        return `${truncatedDay.charAt(0).toUpperCase()}${truncatedDay.slice(1)} - ${format(parsedDate, "dd/MM/yy")}`;
    } catch (error) {
        console.error("Error formatting date header:", date, error);
        return date; // Fallback
    }
  };

  // Determine if the volunteer button or desmarcar button should be shown
  const shouldShowVolunteerButton = (slot: TimeSlot) => {
    const isUserEstagio = userData?.rank === "Estágio";
    if (isUserEstagio) return false; // Estagiários never see the button

    if (isVolunteered(slot)) return true; // Always show Desmarcar if volunteered

    // If not volunteered, check conditions for showing the "Voluntário" button
    if (isSlotFull(slot)) return false; // Don't show if slot is full

    // Check user's total limit
     if (!isAdmin && userSlotCount >= slotLimit) return false; // Don't show if user limit reached (non-admin)

    // Check if user is already registered for *any* slot on this date
    const isVolunteeredForDate = timeSlots.some(s => s.date === slot.date && s.volunteers?.includes(volunteerName));
    if (isVolunteeredForDate) return false; // Don't show if already volunteered on this date

    return true; // Otherwise, show the "Voluntário" button
  };

  // Simplified check if the volunteer button should be enabled (used implicitly by shouldShowVolunteerButton)
  // const canVolunteerForSlot = (slot: TimeSlot) => {
  //   if (isAdmin) return true;
  //   return userSlotCount < slotLimit;
  // };

  const sortVolunteers = (volunteers: string[] | undefined) => {
    if (!volunteers) return [];
    // Make a copy before sorting to avoid mutating the original array in state
    return [...volunteers].sort((a, b) => {
      const rankA = getVolunteerRank(a);
      const rankB = getVolunteerRank(b);
      return getMilitaryRankWeight(rankB) - getMilitaryRankWeight(rankA);
    });
  };

  // Calculate Costs (useEffect depends on timeSlots and calculatedGroupedTimeSlots indirectly)
  const [totalCostSummary, setTotalCostSummary] = useState({ "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Total Geral": 0 });
  const [weeklyCost, setWeeklyCost] = useState(0);
  const [weeklyDateRangeText, setWeeklyDateRangeText] = useState("");

  useEffect(() => {
    let runningCosts = { "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Total Geral": 0 };
    let runningWeeklyCost = 0;
    const weeklyDates: string[] = [];
    const today = new Date();
    const tomorrowStart = addDays(today, 1);
    tomorrowStart.setHours(0, 0, 0, 0); // Set to beginning of tomorrow

    Object.entries(calculatedGroupedTimeSlots).forEach(([date, groupedData]) => {
      let dailyCost = 0;
       try {
          const slotDate = parseISO(date); // Parse date for comparison
          const isWeeklyDate = isAfter(slotDate, today); // simplified: is after today

          groupedData.slots.forEach(slot => {
            slot.volunteers?.forEach(volunteerFullName => {
              const volunteerRank = getVolunteerRank(volunteerFullName);
              const rankInfo = getRankCategory(volunteerRank);
              const hours = parseFloat(calculateTimeDifference(slot.start_time, slot.end_time));
              if (!isNaN(hours) && rankInfo.hourlyRate > 0) {
                  const slotCost = hours * rankInfo.hourlyRate;
                  dailyCost += slotCost;
                  runningCosts[rankInfo.category] = (runningCosts[rankInfo.category] || 0) + slotCost;
                  runningCosts["Total Geral"] = (runningCosts["Total Geral"] || 0) + slotCost;

                  if (isWeeklyDate) {
                      runningWeeklyCost += slotCost;
                      if (!weeklyDates.includes(date)) {
                          weeklyDates.push(date);
                      }
                  }
              }
            });
          });
          groupedData.dailyCost = dailyCost; // Update daily cost in the grouped data if needed elsewhere

        } catch(e) { console.error("Error processing costs for date:", date, e); }
    });

    setTotalCostSummary(runningCosts);
    setWeeklyCost(runningWeeklyCost);

    // Format weekly date range
    if (weeklyDates.length > 0) {
        weeklyDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const startDate = format(parseISO(weeklyDates[0]), "dd/MM");
        const endDate = format(parseISO(weeklyDates[weeklyDates.length - 1]), "dd/MM");
        setWeeklyDateRangeText(`${startDate} - ${endDate}`);
    } else {
        setWeeklyDateRangeText("");
    }

  }, [calculatedGroupedTimeSlots]); // Dependency on the grouped slots

  // State and handler for the remove volunteer confirmation dialog
  const [volunteerToRemove, setVolunteerToRemove] = useState<{ name: string; timeSlot: TimeSlot; } | null>(null);

  const handleRemoveVolunteer = async (timeSlot: TimeSlot, volunteerNameToRemove: string) => {
    try {
      const updatedVolunteers = (timeSlot.volunteers || []).filter(v => v !== volunteerNameToRemove);
      const updatedSlot = {
        ...timeSlot,
        volunteers: updatedVolunteers,
        slots_used: updatedVolunteers.length,
      };
       if (!timeSlot.id) throw new Error("Time slot ID is missing for removal");
       await setDoc(doc(db, 'timeSlots', timeSlot.id), {
           volunteers: updatedSlot.volunteers,
           slots_used: updatedSlot.slots_used
       }, { merge: true });

      toast({ title: "Sucesso! ✅", description: `${volunteerNameToRemove} foi removido.` });
      setVolunteerToRemove(null); // Close dialog on success
    } catch (error) {
      console.error('Erro ao remover voluntário:', error);
      toast({ title: "Erro ⛔", description: "Não foi possível remover.", variant: "destructive" });
    }
  };


  if (isLoading && timeSlots.length === 0) { // Show loading only initially
    return <div className="p-4 text-center">Carregando horários...</div>;
  }

  return <div className="space-y-6 p-4">
      <TimeSlotLimitControl slotLimit={slotLimit} onUpdateLimit={handleUpdateSlotLimit} userSlotCount={userSlotCount} isAdmin={isAdmin} />

      {isAdmin && totalCostSummary["Total Geral"] > 0 &&
        <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Resumo de Custos Totais</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Cb/Sd:</strong> {formatCurrency(totalCostSummary["Cb/Sd"])}</p>
            <p><strong>St/Sgt:</strong> {formatCurrency(totalCostSummary["St/Sgt"])}</p>
            <p><strong>Oficiais:</strong> {formatCurrency(totalCostSummary["Oficiais"])}</p>
            <p className="font-semibold text-green-600"><strong>Total Geral Mês:</strong> {formatCurrency(totalCostSummary["Total Geral"])}</p>
            {weeklyCost > 0 && weeklyDateRangeText && <p className="font-semibold text-blue-600"><strong>Custo Prev. Semana ({weeklyDateRangeText}):</strong> {formatCurrency(weeklyCost)}</p>}
          </div>
        </div>
      }

      {/* Sort dates before mapping */}
      {Object.entries(calculatedGroupedTimeSlots).sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime()).map(([date, groupedData]) => {
        const { slots, dailyCost } = groupedData;
        let isDatePast = false;
        try {
            // Compare date only, ignore time
            const todayDateOnly = new Date();
            todayDateOnly.setHours(0,0,0,0);
            isDatePast = isPast(parseISO(date)) && format(parseISO(date),'yyyy-MM-dd') !== format(todayDateOnly,'yyyy-MM-dd');
        } catch(e) { console.error("Date parsing error for past check:", date, e); }

        // Sort slots within the date group by start time
        const sortedSlots = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));

        return <div key={date} className={`bg-white rounded-lg shadow-sm ${isDatePast ? 'opacity-75' : ''}`}>
            <div className="p-4 md:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full mb-3">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <CalendarDays className={`h-5 w-5 ${isDatePast ? 'text-gray-500' : 'text-blue-600'}`} />
                  <h3 className={`font-medium text-lg ${isDatePast ? 'text-gray-600' : 'text-gray-800'}`}>
                    {formatDateHeader(date)}
                  </h3>
                </div>
                 <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                     {isAdmin && dailyCost > 0 &&
                        <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 text-base">
                            {formatCurrency(dailyCost)}
                        </Badge>
                     }
                    <Badge variant={isDatePast ? "outline" : "default"} className={`${isDatePast ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isDatePast ? "Realizada" : "Prevista"}
                    </Badge>
                 </div>
              </div>

              {/* Removed collapse logic: {!isCollapsed && ...} to always show slots */}
              <div className="space-y-3 mt-4">
                  {sortedSlots.map((slot) => {
                    const slotIsFull = isSlotFull(slot);
                    const canUserVolunteer = shouldShowVolunteerButton(slot);
                    const isUserVolunteered = isVolunteered(slot);

                    return (
                    <div key={slot.id} className={`border rounded-lg p-4 space-y-3 transition-all ${slotIsFull ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <div className="flex flex-col space-y-3">
                        {/* Time and Description */}
                        <div className="flex flex-wrap justify-between items-center gap-2">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                <p className="font-medium text-gray-900">
                                {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)}
                                <span className="text-sm text-gray-600 ml-1">({calculateTimeDifference(slot.start_time, slot.end_time)}h)</span>
                                </p>
                            </div>
                            {slot.description && (
                                <span className="text-sm text-gray-600 text-right flex-grow">
                                {slot.description}
                                </span>
                            )}
                        </div>

                        {/* Slots Available/Full Badge */}
                        <div className="flex items-center justify-start">
                          <Badge variant={slotIsFull ? 'destructive' : 'secondary'} className={`text-sm font-medium ${slotIsFull ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                              {slotIsFull ? 'Vagas Esgotadas' : `${slot.total_slots - slot.slots_used} ${slot.total_slots - slot.slots_used === 1 ? 'vaga disponível' : 'vagas disponíveis'}`}
                          </Badge>
                        </div>
                      </div>

                      {/* Volunteers List */}
                      {slot.volunteers && slot.volunteers.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium mb-2 text-gray-700">Voluntários ({slot.slots_used}/{slot.total_slots}):</p>
                          <div className="space-y-1.5">
                            {sortVolunteers(slot.volunteers).map((volunteer, index) => {
                              // *** MODIFICATION HERE ***
                              const totalHours = getVolunteerTotalHours(volunteer, slot.date);
                              const displayName = totalHours ? `${volunteer} ${totalHours}h` : volunteer;
                              // *************************
                              return (
                                <div key={index} className="text-sm text-gray-800 flex justify-between items-center group">
                                    <span className="pl-2 border-l-2 border-gray-300">{displayName}</span>
                                    {isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-opacity"
                                        onClick={() => setVolunteerToRemove({ name: volunteer, timeSlot: slot })}
                                        aria-label={`Remover ${volunteer}`}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    )}
                                </div>
                              );
                             })}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      {/* Show button container only if there's an action possible for the user */}
                      {canUserVolunteer && !isDatePast && (
                        <div className="pt-3 border-t border-gray-200">
                          {isUserVolunteered ? (
                              <Button
                                onClick={() => handleUnvolunteer(slot)}
                                variant="destructive" // Or outline destructive
                                size="sm"
                                className="w-full"
                                disabled={isDatePast} // Disable if date is past
                              >
                                Desmarcar Extra
                              </Button>
                            ) : (
                              // Show volunteer button only if slot not full and user hasn't volunteered for the date
                              !slotIsFull && (
                                <Button
                                  onClick={() => handleVolunteer(slot)}
                                  variant="default" // Or primary style
                                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                                  size="sm"
                                  disabled={isDatePast} // Disable if date is past
                                >
                                  Marcar Extra
                                </Button>
                              )
                           )}
                        </div>
                      )}
                    </div> // End slot card
                   );
                  })}
                </div>
            </div>
          </div>;
      })}

      {/* Confirmation Dialog for Removing Volunteer */}
      <AlertDialog open={!!volunteerToRemove} onOpenChange={(open) => !open && setVolunteerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Voluntário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{volunteerToRemove?.name}</strong> deste horário ({formatDateHeader(volunteerToRemove?.timeSlot?.date || "")} {volunteerToRemove?.timeSlot?.start_time} - {volunteerToRemove?.timeSlot?.end_time})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVolunteerToRemove(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                    if (volunteerToRemove) {
                        handleRemoveVolunteer(volunteerToRemove.timeSlot, volunteerToRemove.name);
                    }
                }}
            >
              Confirmar Remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>; // End main container
};

export default TimeSlotsList;
