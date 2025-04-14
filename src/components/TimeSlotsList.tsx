import React, { useState, useEffect } from "react";
import { format, parseISO, isPast, addDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
// Import necessary Firestore functions for querying
import { collection, query, onSnapshot, doc, getDoc, setDoc, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRoundCog, CalendarDays, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import supabase from "@/lib/supabaseClient"; // Ensure supabase client is correctly imported

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
    dailyCost: number;
  };
}

// Helper function to extract rank (adjust if needed based on exact naming convention)
const getVolunteerRank = (volunteerFullName: string): string => {
  const parts = volunteerFullName.split(" ");
  // Handle "1° Sgt", "2° Ten", etc.
  if (parts.length >= 3 && (parts[1] === "Sgt" || parts[1] === "Ten" || parts[1] === "Cel")) {
    return `${parts[0]} ${parts[1]}`;
  }
  // Handle "Cb PM", "Sd PM"
  if (parts.length >= 2 && parts[1] === "PM") {
      return `${parts[0]} ${parts[1]}`;
  }
  // Handle single word ranks like "Maj", "Cap", "Cb", "Sd"
  return parts[0];
};

// Helper function to extract war name (adjust if needed)
const getVolunteerWarName = (volunteerFullName: string): string => {
    const parts = volunteerFullName.split(' ');
    const rank = getVolunteerRank(volunteerFullName);
    const rankParts = rank.split(' ');
    // Find the index of the last part of the rank in the full name
    const rankEndIndex = parts.findIndex((part, index) => {
        // Check if the current part and subsequent parts match the rank parts
        return rankParts.every((rankPart, i) => parts[index + i] === rankPart);
    });

    if (rankEndIndex !== -1) {
        // War name starts after the last part of the rank
        return parts.slice(rankEndIndex + rankParts.length).join(' ');
    }
    // Fallback if rank finding fails (might happen with complex names)
    return parts.slice(1).join(' ');
};


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
    "Cel": 12, "Cel PM": 12,
    "Ten Cel": 11, "Ten Cel PM": 11,
    "Maj": 10, "Maj PM": 10,
    "Cap": 9, "Cap PM": 9,
    "1° Ten": 8, "1° Ten PM": 8,
    "2° Ten": 7, "2° Ten PM": 7,
    "Sub Ten": 6, "Sub Ten PM": 6,
    "1° Sgt": 5, "1° Sgt PM": 5,
    "2° Sgt": 4, "2° Sgt PM": 4,
    "3° Sgt": 3, "3° Sgt PM": 3,
    "Cb": 2, "Cb PM": 2,
    "Sd": 1, "Sd PM": 1,
    "Estágio": 0
  };
   // Handle cases like "1° Sgt" vs "1° Sgt PM" - prioritize the more specific one if needed
   // For simplicity, just use the provided rank directly.
   const directMatch = rankWeights[rank];
   if (directMatch !== undefined) return directMatch;

   // Fallback: try splitting and taking the first part(s) if no direct match
   const parts = rank.split(' ');
   if (parts.length > 1) {
       const generalRank = parts[0]; // e.g., "1°"
       const typeRank = `${parts[0]} ${parts[1]}`; // e.g., "1° Sgt"
       if (rankWeights[typeRank] !== undefined) return rankWeights[typeRank];
       if (rankWeights[generalRank] !== undefined) return rankWeights[generalRank];
   }
   return rankWeights[rank] || 0; // Return 0 if rank is unknown
};

const getRankCategory = (rank: string): {
  category: string;
  hourlyRate: number;
} => {
  // Normalize rank slightly for matching categories (e.g., ignore "PM")
  const baseRank = rank.replace(" PM", "");
  const cbSdRanks = ["Sd", "Cb"];
  const stSgtRanks = ["3° Sgt", "2° Sgt", "1° Sgt", "Sub Ten"];
  const oficiaisRanks = ["2° Ten", "1° Ten", "Cap", "Maj", "Ten Cel", "Cel"];

  if (cbSdRanks.some(r => baseRank.includes(r))) return {
    category: "Cb/Sd",
    hourlyRate: 41.13
  };
  if (stSgtRanks.some(r => baseRank.includes(r))) return {
    category: "St/Sgt",
    hourlyRate: 56.28
  };
  if (oficiaisRanks.some(r => baseRank.includes(r))) return {
    category: "Oficiais",
    hourlyRate: 87.02
  };
  // Fallback for ranks like "Estágio" or others not categorized
  return {
    category: "Outros",
    hourlyRate: 0
  };
};

// getVolunteerRank is defined above
// getVolunteerWarName is defined above

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value).replace("R$", "R$ ");
};

// Define Supabase table name type (optional but good practice)
type SupabaseMonthTable = "JANEIRO" | "FEVEREIRO" | "MARCO" | "ABRIL" | "MAIO" | "JUNHO" |
                          "JULHO" | "AGOSTO" | "SETEMBRO" | "OUTUBRO" | "NOVEMBRO" | "DEZEMBRO";

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slotLimit, setSlotLimit] = useState<number>(0);
  // --- State to store volunteer hours (Requirement 4) ---
  const [volunteerHoursMap, setVolunteerHoursMap] = useState<{ [key: string]: string | null }>({});
  const [isLoadingHours, setIsLoadingHours] = useState(false); // Optional: loading state for hours

  const { toast } = useToast();
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  const isAdmin = userData?.userType === 'admin';

  const calculateTimeDifference = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return "0"; // Handle missing times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);
    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) return "0"; // Handle parsing errors

    if (endHour < startHour || (endHour === 0 && startHour > 0)) { // Handles overnight shifts
      endHour += 24;
    }
    let diffHours = endHour - startHour;
    let diffMinutes = endMinute - startMinute;
    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }
    const totalHours = diffHours + diffMinutes / 60;
    // Format to one decimal place, replacing comma if needed
    return totalHours.toFixed(1).replace('.', ',');
  };


  // --- useEffect to fetch Time Slots and Slot Limit (Existing Logic) ---
  useEffect(() => {
    // Fetch Slot Limit
    const fetchSlotLimit = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'slotLimit'));
        if (settingsDoc.exists()) {
          setSlotLimit(settingsDoc.data().value || 0);
        } else {
          setSlotLimit(1); // Default limit if not set
          console.warn("Slot limit not found in Firestore 'settings/slotLimit', defaulting to 1.");
        }
      } catch (error) {
        console.error('Erro ao buscar limite de slots:', error);
        toast({ title: "Erro", description: "Não foi possível buscar o limite de horários.", variant: "destructive" });
      }
    };
    fetchSlotLimit();

    // Fetch Time Slots
    setIsLoading(true);
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection); // Add ordering if needed: query(timeSlotsCollection, orderBy("date"), orderBy("start_time"));

    const unsubscribe = onSnapshot(q, snapshot => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date, // Should already be 'YYYY-MM-DD' string from Firestore
          start_time: data.start_time,
          end_time: data.end_time,
          volunteers: data.volunteers || [],
          slots_used: data.slots_used || 0,
          total_slots: data.total_slots || data.slots || 0, // Handle legacy 'slots' field
          description: data.description || ""
        };
      });
      // Sort slots here if not done in the query
      formattedSlots.sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return (a.start_time || "").localeCompare(b.start_time || "");
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

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [toast]); // Keep dependency array minimal for this effect


  // --- useEffect to fetch Volunteer Hours (Requirement 1, 3, 5) ---
   useEffect(() => {
    const fetchHoursForAllVolunteers = async () => {
      if (!isAdmin || timeSlots.length === 0) {
        setVolunteerHoursMap({}); // Clear hours if not admin or no slots
        return;
      }

      setIsLoadingHours(true); // Start loading hours
      const uniqueVolunteers = Array.from(new Set(
        timeSlots.flatMap(slot => slot.volunteers || [])
      ));

      if (uniqueVolunteers.length === 0) {
        setVolunteerHoursMap({});
        setIsLoadingHours(false);
        return;
      }

      const hoursMap: { [key: string]: string | null } = {};

      // Determine current month's Supabase table name
      const currentMonthName = format(new Date(), 'MMMM', { locale: ptBR }).toUpperCase();
      let tableName: SupabaseMonthTable;

      // Map Portuguese month names to table names (handle 'MARÇO')
      switch (currentMonthName) {
        case 'JANEIRO': tableName = 'JANEIRO'; break;
        case 'FEVEREIRO': tableName = 'FEVEREIRO'; break;
        case 'MARÇO': tableName = 'MARCO'; break; // Note the table name mapping
        case 'ABRIL': tableName = 'ABRIL'; break;
        case 'MAIO': tableName = 'MAIO'; break;
        case 'JUNHO': tableName = 'JUNHO'; break;
        case 'JULHO': tableName = 'JULHO'; break;
        case 'AGOSTO': tableName = 'AGOSTO'; break;
        case 'SETEMBRO': tableName = 'SETEMBRO'; break;
        case 'OUTUBRO': tableName = 'OUTUBRO'; break;
        case 'NOVEMBRO': tableName = 'NOVEMBRO'; break;
        case 'DEZEMBRO': tableName = 'DEZEMBRO'; break;
        default:
          console.error("Mês inválido:", currentMonthName);
          setIsLoadingHours(false);
          return; // Stop if month is invalid
      }

      // Fetch data for all volunteers (can be inefficient with many volunteers)
      for (const volunteerFullName of uniqueVolunteers) {
        try {
          // 1. Fetch registration number (matrícula) from Firebase
          const rank = getVolunteerRank(volunteerFullName);
          const warName = getVolunteerWarName(volunteerFullName); // Use helper

          if (!rank || !warName) {
              console.warn(`Could not parse rank/warName for: ${volunteerFullName}`);
              hoursMap[volunteerFullName] = null; // Mark as unable to process
              continue; // Skip to next volunteer
          }

          // --- Firebase Query ---
          // IMPORTANT: Adjust 'users', 'rank', 'warName', 'registrationNumber'
          //            to match your actual Firestore collection and field names.
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("rank", "==", rank), where("warName", "==", warName));
          const querySnapshot = await getDocs(q);

          let registrationNumber: string | null = null;
          if (!querySnapshot.empty) {
            if (querySnapshot.size > 1) {
              console.warn(`Multiple users found in Firebase for ${rank} ${warName}. Using the first one.`);
            }
            // Assuming 'registrationNumber' is the field name for matrícula
            registrationNumber = querySnapshot.docs[0].data().registrationNumber;
            if (!registrationNumber) {
                 console.warn(`Field 'registrationNumber' missing for ${volunteerFullName} in Firebase.`);
            }
          } else {
            console.warn(`Matricula not found in Firebase for ${volunteerFullName} (Rank: ${rank}, WarName: ${warName})`);
          }

          // 2. Fetch hours from Supabase using registrationNumber
          if (registrationNumber) {
            const { data: supabaseData, error: supabaseError } = await supabase
              .from(tableName)
              .select('"Total Geral"') // Select only the required column
              .eq('Matricula', registrationNumber) // Filter by 'Matricula' column
              .maybeSingle(); // Use maybeSingle to handle 0 or 1 row

            if (supabaseError) {
              // Log error only if it's not the 'no rows found' error
              if (supabaseError.code !== 'PGRST116') {
                console.error(`Supabase error fetching hours for ${volunteerFullName} (Matricula: ${registrationNumber}) from table ${tableName}:`, supabaseError);
              } else {
                // console.log(`No hours entry found in Supabase table ${tableName} for Matricula ${registrationNumber}`);
              }
              hoursMap[volunteerFullName] = null; // Indicate hours not found or error
            } else if (supabaseData && supabaseData['Total Geral'] !== null && supabaseData['Total Geral'] !== undefined) {
               // Store the hours value as a string
               hoursMap[volunteerFullName] = String(supabaseData['Total Geral']);
            } else {
              // console.log(`No 'Total Geral' data found in Supabase for Matricula ${registrationNumber}`);
              hoursMap[volunteerFullName] = null; // No data found for this matricula in the table
            }
          } else {
            // If registrationNumber was not found in Firebase
            hoursMap[volunteerFullName] = null;
          }

        } catch (error) {
          console.error(`Error processing volunteer ${volunteerFullName}:`, error);
          hoursMap[volunteerFullName] = null; // Mark as error/unavailable
        }
      }

      setVolunteerHoursMap(hoursMap);
      setIsLoadingHours(false); // Finish loading hours
    };

    fetchHoursForAllVolunteers();

   }, [timeSlots, isAdmin, db, supabase]); // Dependencies: run when slots change or admin status changes


  const handleVolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }
    // Recalculate user slot count based on current state
    const currentUserSlotCount = timeSlots.reduce((count, slot) => slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0);

    if (!isAdmin && currentUserSlotCount >= slotLimit) {
      toast({ title: "Limite atingido!🚫", description: `Limite de ${slotLimit} horário(s).`, variant: "destructive" });
      return;
    }

    const slotsForDate = timeSlots.filter(slot => slot.date === timeSlot.date);
    const isAlreadyRegistered = slotsForDate.some(slot => slot.volunteers?.includes(volunteerName));
    if (!isAdmin && isAlreadyRegistered) {
      toast({ title: "Erro ⛔", description: "Você já está em um horário nesta data.", variant: "destructive" });
      return;
    }

    try {
       // Ensure volunteers array exists
      const currentVolunteers = timeSlot.volunteers || [];
      // Prevent duplicates (though UI logic should mostly prevent this)
      if (currentVolunteers.includes(volunteerName)) {
          toast({ title: "Aviso", description: "Você já está neste horário.", variant: "default" });
          return;
      }

      const updatedSlot = {
        ...timeSlot,
        slots_used: (timeSlot.slots_used || 0) + 1,
        volunteers: [...currentVolunteers, volunteerName]
      };

      // Use the specific document ID for updating
      if (!timeSlot.id) {
          throw new Error("Time slot ID is missing, cannot update.");
      }
      await dataOperations.updateById(timeSlot.id, {
          slots_used: updatedSlot.slots_used,
          volunteers: updatedSlot.volunteers
      });

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
       // Ensure volunteers array exists and volunteer is present
      const currentVolunteers = timeSlot.volunteers || [];
      if (!currentVolunteers.includes(volunteerName)) {
          console.warn("Attempted to unvolunteer when not registered.");
          return; // Or show a different message
      }

      const updatedVolunteers = currentVolunteers.filter(v => v !== volunteerName);
      const updatedSlot = {
        ...timeSlot,
        slots_used: Math.max(0, (timeSlot.slots_used || 0) - 1), // Ensure slots_used doesn't go below 0
        volunteers: updatedVolunteers
      };

      // Use the specific document ID for updating
      if (!timeSlot.id) {
          throw new Error("Time slot ID is missing, cannot update.");
      }
      await dataOperations.updateById(timeSlot.id, {
          slots_used: updatedSlot.slots_used,
          volunteers: updatedSlot.volunteers
      });

      toast({ title: "Desmarcado! 👀🤔", description: "Extra desmarcada com sucesso!" });
    } catch (error) {
      console.error('Erro ao desmarcar:', error);
      toast({ title: "Erro ⛔", description: "Não foi possível desmarcar a Extra.", variant: "destructive" });
    }
  };

  const handleUpdateSlotLimit = async (limit: number) => {
    if (isNaN(limit) || limit < 0) {
      toast({ title: "Erro 😵‍💫", description: "Insira um número válido.", variant: "destructive" });
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'slotLimit'), { value: limit }, { merge: true }); // Use merge to avoid overwriting other settings
      // No need to call setSlotLimit here, the listener in the other useEffect will update it
      toast({ title: "Sucesso", description: "Limite atualizado!" });
    } catch (error) {
      console.error('Erro ao atualizar limite:', error);
      toast({ title: "Erro", description: "Não foi possível atualizar o limite.", variant: "destructive" });
    }
  };

  // Grouping logic remains the same
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

  const isVolunteered = (timeSlot: TimeSlot) => {
    return timeSlot.volunteers?.includes(volunteerName);
  };

  const isSlotFull = (timeSlot: TimeSlot) => {
    // Ensure total_slots is treated as a number
    const totalSlots = Number(timeSlot.total_slots) || 0;
    const slotsUsed = Number(timeSlot.slots_used) || 0;
    return slotsUsed >= totalSlots;
  };

  const formatDateHeader = (date: string) => {
      try {
          const parsedDate = parseISO(date); // date should be 'YYYY-MM-DD'
          const dayOfWeek = format(parsedDate, "eee", { locale: ptBR });
          const formattedDate = format(parsedDate, "dd/MM/yy");
          return `${dayOfWeek.charAt(0).toUpperCase()}${dayOfWeek.slice(1).substring(0, 2)}-${formattedDate}`;
      } catch (e) {
          console.error("Error parsing date for header:", date, e);
          return date; // fallback to original string if parsing fails
      }
  };


  // Logic for showing buttons remains mostly the same, adjusted for clarity
 const shouldShowVolunteerButton = (slot: TimeSlot) => {
    const currentUserDataString = localStorage.getItem('user');
    const currentUserData = currentUserDataString ? JSON.parse(currentUserDataString) : null;

    // Hide for Estágio rank
    if (currentUserData?.rank === "Estágio") {
        return false;
    }

    const isUserVolunteered = isVolunteered(slot);

    // If user is already volunteered, always show the "Desmarcar" button
    if (isUserVolunteered) {
        return true;
    }

    // If user is NOT volunteered:
    // Hide if the slot is full
    if (isSlotFull(slot)) {
        return false;
    }

    // For non-admins, check limits
    if (!isAdmin) {
        // Check overall slot limit for the user
        const userSlotCountNow = timeSlots.reduce((count, s) => s.volunteers?.includes(volunteerName) ? count + 1 : count, 0);
        if (userSlotCountNow >= slotLimit) {
            return false; // Reached overall limit
        }

        // Check if user is already volunteered for *any* slot on this specific date
        const slotsForThisDate = timeSlots.filter(s => s.date === slot.date);
        const isVolunteeredForThisDate = slotsForThisDate.some(s => s.volunteers?.includes(volunteerName));
        if (isVolunteeredForThisDate) {
            return false; // Already volunteered on this date
        }
    }

    // If none of the above conditions hide the button, show the "Voluntário" button
    return true;
};


  // canVolunteerForSlot logic adjusted for clarity
  const canVolunteerForSlot = (slot: TimeSlot) => {
    if (isAdmin) return true; // Admin bypasses limits

    // Check if slot is full
    if (isSlotFull(slot)) return false;

    // Check overall user limit
    const userSlotCountNow = timeSlots.reduce((count, s) => s.volunteers?.includes(volunteerName) ? count + 1 : count, 0);
    if (userSlotCountNow >= slotLimit) return false;

    // Check if already volunteered for this date
    const slotsForThisDate = timeSlots.filter(s => s.date === slot.date);
    const isVolunteeredForThisDate = slotsForThisDate.some(s => s.volunteers?.includes(volunteerName));
    if (isVolunteeredForThisDate) return false;

    return true; // Can volunteer if none of the limits/conditions are met
  };

  // Sorting logic remains the same
  const sortVolunteers = (volunteers: string[] | undefined) => {
    if (!volunteers) return [];
    return [...volunteers].sort((a, b) => { // Use spread to avoid mutating original array
      const rankA = getVolunteerRank(a);
      const rankB = getVolunteerRank(b);
      return getMilitaryRankWeight(rankB) - getMilitaryRankWeight(rankA);
    });
  };

  // Recalculate costs based on timeSlots whenever they change
  const [calculatedGroupedTimeSlots, setCalculatedGroupedTimeSlots] = useState<GroupedTimeSlots>({});
  const [totalCostSummary, setTotalCostSummary] = useState<{
    "Cb/Sd": number; "St/Sgt": number; "Oficiais": number; "Total Geral": number; "Outros": number;
  }>({ "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Total Geral": 0, "Outros": 0 });

  useEffect(() => {
    const grouped = groupTimeSlotsByDate(timeSlots);
    let costSummary = { "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Total Geral": 0, "Outros": 0 };

    Object.keys(grouped).forEach(date => {
      let dailyCost = 0;
      grouped[date].slots.forEach(slot => {
        slot.volunteers?.forEach(volunteerFullName => {
          const volunteerRank = getVolunteerRank(volunteerFullName);
          const rankInfo = getRankCategory(volunteerRank);
          // Use formatted hours string, parse it back to number for calculation
          const hoursString = calculateTimeDifference(slot.start_time, slot.end_time);
          const hours = parseFloat(hoursString.replace(',', '.')) || 0; // Convert back to float

          const slotCost = hours * rankInfo.hourlyRate;
          dailyCost += slotCost;
          costSummary[rankInfo.category] = (costSummary[rankInfo.category] || 0) + slotCost;
          costSummary["Total Geral"] += slotCost;
        });
      });
      grouped[date].dailyCost = dailyCost;
    });

    setCalculatedGroupedTimeSlots(grouped);
    setTotalCostSummary(costSummary);
  }, [timeSlots]); // Recalculate when timeSlots change

  const userSlotCount = timeSlots.reduce((count, slot) => slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0);

  // State and handler for removing volunteer (Admin only)
  const [volunteerToRemove, setVolunteerToRemove] = useState<{ name: string; timeSlot: TimeSlot; } | null>(null);

  const handleRemoveVolunteer = async (timeSlot: TimeSlot, volunteerNameToRemove: string) => {
    // This function is essentially the same as handleUnvolunteer, but triggered by admin
    // It might be slightly different if admin needs different permissions/logging
    try {
      const currentVolunteers = timeSlot.volunteers || [];
      if (!currentVolunteers.includes(volunteerNameToRemove)) {
          console.warn(`Admin tried to remove ${volunteerNameToRemove} who was not in the slot.`);
          toast({ title: "Aviso", description: `${volunteerNameToRemove} não encontrado neste horário.`, variant: "default"});
          return;
      }

      const updatedVolunteers = currentVolunteers.filter(v => v !== volunteerNameToRemove);
      const updatedSlot = {
        ...timeSlot,
        slots_used: Math.max(0, (timeSlot.slots_used || 0) - 1),
        volunteers: updatedVolunteers
      };

      if (!timeSlot.id) {
          throw new Error("Time slot ID is missing, cannot update.");
      }
      await dataOperations.updateById(timeSlot.id, {
          slots_used: updatedSlot.slots_used,
          volunteers: updatedSlot.volunteers
      });

      toast({ title: "Sucesso! ✅", description: `${volunteerNameToRemove} removido.` });
      setVolunteerToRemove(null); // Close the confirmation dialog
    } catch (error) {
      console.error('Erro ao remover voluntário (admin):', error);
      toast({ title: "Erro ⛔", description: "Não foi possível remover.", variant: "destructive" });
    }
  };


  // Calculate weekly cost
  const today = new Date();
  const tomorrow = addDays(today, 1);
  let weeklyCost = 0;
  let weeklyCostDates: string[] = [];

  if (calculatedGroupedTimeSlots) {
    Object.entries(calculatedGroupedTimeSlots)
      .filter(([date]) => {
        try {
            const slotDate = parseISO(date);
            // Include dates from tomorrow onwards
            const isWeeklyDate = isAfter(slotDate, today) || format(slotDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
            if (isWeeklyDate) {
              weeklyCostDates.push(date);
            }
            return isWeeklyDate;
        } catch (e) {
            console.error("Error parsing date for weekly cost:", date, e);
            return false;
        }
      })
      .forEach(([, groupedData]) => {
        weeklyCost += groupedData.dailyCost;
      });
  }

  const formatWeeklyDateRange = () => {
    if (weeklyCostDates.length === 0) return "";
    const sortedDates = weeklyCostDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const startDateStr = sortedDates[0];
    const endDateStr = sortedDates[sortedDates.length - 1];
     try {
        const startDate = format(parseISO(startDateStr), "eee", { locale: ptBR }).substring(0, 3).toUpperCase();
        const endDate = format(parseISO(endDateStr), "eee", { locale: ptBR }).substring(0, 3).toUpperCase();
        // If only one day, just show that day
        if (startDateStr === endDateStr) return startDate;
        return `${startDate}-${endDate}`;
     } catch(e) {
         console.error("Error formatting weekly date range:", startDateStr, endDateStr, e);
         return "Semana"; // Fallback
     }
  };

  const weeklyDateRangeText = formatWeeklyDateRange();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando horários...</div>
    </div>;
  }

  return (
    <div className="space-y-6 p-4">
      <TimeSlotLimitControl
        slotLimit={slotLimit}
        onUpdateLimit={handleUpdateSlotLimit}
        userSlotCount={userSlotCount}
        isAdmin={isAdmin}
      />

      {isAdmin && totalCostSummary["Total Geral"] > 0 &&
        <div className="bg-white rounded-lg shadow-sm p-4 mt-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Resumo de Custos Totais (Mês Atual)</h2>
          <div className="space-y-1 text-sm">
            <p><strong>Cb/Sd:</strong> {formatCurrency(totalCostSummary["Cb/Sd"])}</p>
            <p><strong>St/Sgt:</strong> {formatCurrency(totalCostSummary["St/Sgt"])}</p>
            <p><strong>Oficiais:</strong> {formatCurrency(totalCostSummary["Oficiais"])}</p>
             {totalCostSummary["Outros"] > 0 && <p><strong>Outros:</strong> {formatCurrency(totalCostSummary["Outros"])}</p> }
            <p className="font-semibold text-green-600 pt-1 border-t border-gray-100 mt-1">
                <strong>Total Geral:</strong> {formatCurrency(totalCostSummary["Total Geral"])}
            </p>
             {weeklyCost > 0 && (
                 <p className="font-semibold text-blue-600 pt-1 border-t border-gray-100 mt-1">
                     <strong>Custo Previsto ({weeklyDateRangeText}):</strong> {formatCurrency(weeklyCost)}
                </p>
             )}
          </div>
            { isLoadingHours && <p className="text-xs text-gray-500 mt-2">Atualizando horas dos voluntários...</p>}
        </div>
      }

      {Object.keys(calculatedGroupedTimeSlots).length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-10">Nenhum horário de extra disponível no momento.</div>
      )}

      {/* Use calculatedGroupedTimeSlots which is derived from sorted timeSlots */}
      {Object.entries(calculatedGroupedTimeSlots).map(([date, groupedData]) => {
        const { slots: dateSlots, dailyCost } = groupedData;
        // No need to sort again if timeSlots were sorted initially
        // const sortedSlots = [...dateSlots].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
        const sortedSlots = dateSlots; // Assuming already sorted
        const isDatePast = isPast(addDays(parseISO(date), 1)); // Consider date past if it's yesterday or older

        return (
          <div key={date} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className={`p-4 md:p-5 ${isDatePast ? 'opacity-70' : ''}`}>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-2 border-b border-gray-100">
                 <div className="flex items-center gap-2 mb-2 sm:mb-0">
                    <CalendarDays className={`h-5 w-5 ${isDatePast ? 'text-gray-400' : 'text-blue-600'}`} />
                    <h3 className={`font-medium text-lg ${isDatePast ? 'text-gray-600' : 'text-gray-800'}`}>
                      {formatDateHeader(date)}
                    </h3>
                 </div>
                 <div className="flex items-center gap-2">
                     {isAdmin && dailyCost > 0 &&
                       <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                           {formatCurrency(dailyCost)}
                       </Badge>
                     }
                     {/* <Badge variant={isDatePast ? "outline" : "secondary"} className={`${isDatePast ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        {isDatePast ? "Passado" : "Extra"}
                     </Badge> */}
                 </div>
              </div>

              {/* Slots List */}
              <div className="space-y-3">
                {sortedSlots.map((slot) => (
                  <div key={slot.id} className={`border rounded-lg p-3 md:p-4 space-y-3 transition-all ${isSlotFull(slot) ? 'bg-orange-50/50 border-orange-200' : isDatePast ? 'bg-gray-50/50' : 'bg-white hover:bg-gray-50/50'}`}>
                    {/* Time and Description */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                           <Clock className={`h-4 w-4 flex-shrink-0 ${isDatePast ? 'text-gray-400' : 'text-blue-500'}`} />
                           <p className={`font-medium text-sm ${isDatePast ? 'text-gray-600' : 'text-gray-900'}`}>
                             {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)}
                             <span className="text-xs text-gray-500 ml-1">({calculateTimeDifference(slot.start_time, slot.end_time)}h)</span>
                           </p>
                         </div>
                         {slot.description && (
                           <span className="text-xs text-gray-600 text-right italic max-w-[50%] truncate" title={slot.description}>
                             {slot.description}
                           </span>
                         )}
                      </div>
                      {/* Vacancy Info */}
                       <div className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${isSlotFull(slot) ? 'bg-orange-100 text-orange-700' : isDatePast ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700'}`}>
                           {isSlotFull(slot) ? 'Completo' : `${slot.total_slots - slot.slots_used} ${slot.total_slots - slot.slots_used === 1 ? 'vaga' : 'vagas'}`}
                           <span className='ml-1 text-gray-400'>({slot.slots_used}/{slot.total_slots})</span>
                       </div>
                    </div>

                    {/* Volunteers List (Requirement 2) */}
                    {slot.volunteers && slot.volunteers.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium mb-2 text-gray-500">Voluntários:</p>
                        <div className="space-y-1.5">
                          {sortVolunteers(slot.volunteers).map((volunteer, index) => {
                            // --- Get hours from the state map (Requirement 2) ---
                            const hours = volunteerHoursMap[volunteer];
                            return (
                              <div key={index} className="text-sm text-gray-700 flex justify-between items-center group">
                                <div className="flex items-center">
                                  <span className="mr-1">-</span>
                                  <span>
                                    {volunteer}
                                    {/* --- Display hours next to name if admin and hours exist --- */}
                                    {isAdmin && hours && (
                                      <span className="ml-1.5 text-xs font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                                        {/* Display hours, maybe format if needed */}
                                        {`${String(hours).replace('.', ',')}h`}
                                      </span>
                                    )}
                                     {isAdmin && hours === null && volunteerHoursMap.hasOwnProperty(volunteer) && !isLoadingHours && (
                                         <span className="ml-1.5 text-xs font-medium text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded" title="Horas não encontradas no Supabase ou matrícula ausente no Firebase">
                                            --h
                                        </span>
                                     )}
                                  </span>
                                </div>
                                {/* --- Admin remove button --- */}
                                {isAdmin && !isDatePast && ( // Only allow removal if admin and not past
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
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

                    {/* Action Button */}
                    {!isDatePast && shouldShowVolunteerButton(slot) && ( // Hide button if date is past
                      <div className="pt-3 border-t border-gray-100 mt-3">
                        {isVolunteered(slot) ? (
                          <Button
                            onClick={() => handleUnvolunteer(slot)}
                            variant="destructive"
                            size="sm"
                            className="w-full shadow-sm"
                            disabled={isDatePast} // Disable if past
                          >
                            Desmarcar
                          </Button>
                        ) : (
                          // Show volunteer button only if it's possible to volunteer
                           canVolunteerForSlot(slot) && ( // Check if user can volunteer for this specific slot
                              <Button
                                onClick={() => handleVolunteer(slot)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                size="sm"
                                disabled={isDatePast} // Disable if past
                              >
                                Voluntariar
                              </Button>
                           )
                        )}
                      </div>
                    )}
                     {/* Show message if user cannot volunteer due to limits */}
                    {!isDatePast && !isVolunteered(slot) && !isSlotFull(slot) && !isAdmin && !canVolunteerForSlot(slot) && shouldShowVolunteerButton(slot) && (
                         <div className="pt-3 border-t border-gray-100 mt-3 text-center text-xs text-orange-600">
                            Limite diário ou geral atingido.
                        </div>
                    )}

                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Confirmation Dialog for Removing Volunteer */}
      <AlertDialog open={!!volunteerToRemove} onOpenChange={() => setVolunteerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Voluntário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <span className="font-semibold">{volunteerToRemove?.name}</span> do horário <span className="font-semibold">{volunteerToRemove?.timeSlot.start_time}-{volunteerToRemove?.timeSlot.end_time}</span> em <span className="font-semibold">{formatDateHeader(volunteerToRemove?.timeSlot.date || '')}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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

    </div>
  );
};

export default TimeSlotsList;
