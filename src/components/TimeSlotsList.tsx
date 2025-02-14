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

// Define the interface for a TimeSlot object, representing a single time slot for volunteering.
interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[];
}

// Define the interface for GroupedTimeSlots, which is an object grouping TimeSlots by date.
interface GroupedTimeSlots {
  [key: string]: TimeSlot[];
}

// TimeSlotLimitControl component: Manages and displays the time slot limit per user.
const TimeSlotLimitControl = ({
  slotLimit,
  onUpdateLimit,
  userSlotCount = 0,
  isAdmin = false
}) => {
  // State to control the visibility of the custom limit input dialog.
  const [showCustomInput, setShowCustomInput] = useState(false);
  // State to hold the value of the custom limit input.
  const [customLimit, setCustomLimit] = useState("");

  // Predefined time slot limits for admin quick selection.
  const predefinedLimits = [1, 2, 3, 4];

  // Function to handle submission of the custom limit.
  const handleCustomLimitSubmit = () => {
    const limit = parseInt(customLimit);
    // Validate if the custom limit is a positive number.
    if (!isNaN(limit) && limit > 0) {
      onUpdateLimit(limit); // Call the onUpdateLimit callback to update the limit.
      setShowCustomInput(false); // Close the custom input dialog.
      setCustomLimit(""); // Clear the custom limit input.
    }
  };

  // Render JSX for TimeSlotLimitControl component.
  return (
    <div className="w-full space-y-4">
      {/* Conditional rendering for non-admin users */}
      {!isAdmin && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              {/* Display message based on user's slot usage compared to the limit */}
              {userSlotCount >= slotLimit ? (
                <p className="text-orange-600 font-medium">Horários esgotados</p>
              ) : (
                <p className="text-gray-700">
                  Escolha {slotLimit - userSlotCount} {slotLimit - userSlotCount === 1 ? 'horário' : 'horários'}
                </p>
              )}
              {/* Display the count of used slots vs. the limit */}
              <p className="text-sm text-gray-500">
                {userSlotCount} de {slotLimit} horários preenchidos
              </p>
            </div>
            {/* Display a visual representation of slot usage */}
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-medium">{userSlotCount}/{slotLimit}</span>
            </div>
          </div>
        </div>
      )}

      {/* Conditional rendering for admin users */}
      {isAdmin && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="space-y-4">
            {/* Section header for admin limit control */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Limite de horários por usuário</h3>
              <UserRoundCog className="h-5 w-5 text-gray-500" />
            </div>

            {/* Buttons for predefined limits and custom limit input */}
            <div className="flex gap-2">
              {/* Map through predefined limits to create buttons */}
              {predefinedLimits.map((limit) => (
                <Button
                  key={limit}
                  onClick={() => onUpdateLimit(limit)} // Call onUpdateLimit with the predefined limit.
                  variant={slotLimit === limit ? "default" : "outline"} // Highlight the button if it's the current limit.
                  className="flex-1"
                >
                  {limit}
                </Button>
              ))}
              {/* Button to open the custom limit input dialog */}
              <Button
                onClick={() => setShowCustomInput(true)}
                variant="outline"
                className="flex-1"
              >
                +
              </Button>
            </div>
          </div>

          {/* Dialog for custom limit input */}
          <Dialog open={showCustomInput} onOpenChange={setShowCustomInput}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Definir limite personalizado</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  {/* Input field for entering custom limit */}
                  <Input
                    type="number"
                    min="1"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(e.target.value)} // Update customLimit state on input change.
                    placeholder="Digite o limite de horários"
                  />
                </div>
                {/* Buttons to cancel or confirm custom limit */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomInput(false)} // Close the dialog on cancel.
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCustomLimitSubmit}> {/* Submit custom limit on confirm. */}
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

// Function to get a numerical weight for military ranks for sorting purposes.
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
  return rankWeights[rank] || 0; // Return weight if rank is found, otherwise default to 0.
};

// TimeSlotsList component: Displays a list of time slots and handles volunteering actions.
const TimeSlotsList = () => {
  // State to store the array of time slots fetched from Firebase.
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  // State to manage loading state while fetching time slots.
  const [isLoading, setIsLoading] = useState(false);
  // State to store the current slot limit from settings.
  const [slotLimit, setSlotLimit] = useState<number>(0);
  // Hook to use toast notifications for user feedback.
  const { toast } = useToast();

  // Retrieve user data from local storage.
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  // Construct volunteer name from user data, if available.
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  // Determine if the user is an admin based on userType.
  const isAdmin = userData?.userType === 'admin';

  // Function to calculate the time difference between start and end times.
  const calculateTimeDifference = (startTime: string, endTime: string): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);

    // Handle cases where end time is on the next day.
    if (endHour < startHour || (endHour === 0 && startHour > 0)) {
      endHour += 24;
    }

    let diffHours = endHour - startHour;
    let diffMinutes = endMinute - startMinute;

    // Adjust hours and minutes if minutes are negative.
    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }

    const hourText = diffHours > 0 ? `${diffHours}h` : '';
    const minText = diffMinutes > 0 ? `${diffMinutes}min` : '';

    return `${hourText}${minText}`.trim(); // Return formatted time difference string.
  };

  // useEffect hook to fetch time slots and slot limit on component mount and updates.
  useEffect(() => {
    // Function to fetch the slot limit from Firebase settings.
    const fetchSlotLimit = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'slotLimit'));
        if (settingsDoc.exists()) {
          setSlotLimit(settingsDoc.data().value || 0);
        }
      } catch (error) {
        console.error('Error fetching slot limit:', error);
      }
    };

    fetchSlotLimit(); // Call fetchSlotLimit function.

    setIsLoading(true); // Set loading state to true before fetching data.
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection);

    // Subscribe to real-time updates of time slots from Firebase.
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
      setTimeSlots(formattedSlots); // Update timeSlots state with fetched and formatted slots.
      setIsLoading(false); // Set loading state to false after data is loaded.
    }, (error) => {
      console.error('Error listening to time slots:', error);
      toast({
        title: "Erro ao atualizar horários",
        description: "Não foi possível receber atualizações em tempo real.",
        variant: "destructive"
      });
      setIsLoading(false); // Ensure loading state is false even on error.
    });

    // Return unsubscribe function to detach listener on component unmount.
    return () => unsubscribe();
  }, [toast]); // Dependency array includes toast to react to toast updates.

  // Function to handle user volunteering for a time slot.
  const handleVolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    // Count the number of slots the user is already volunteered for.
    const userSlotCount = timeSlots.reduce((count, slot) =>
      slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0
    );

    // Check if user has reached the slot limit.
    if (userSlotCount >= slotLimit && !isAdmin) {
      toast({
        title: "Limite atingido!🚫",
        description: `Você atingiu o limite de ${slotLimit} horário${slotLimit === 1 ? '' : 's'} por usuário.`,
        variant: "destructive"
      });
      return;
    }

    // Check if user is already registered for any slot on the same date.
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
      // Prepare updated slot data with new volunteer and incremented slots_used.
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used + 1,
        volunteers: [...(timeSlot.volunteers || []), volunteerName]
      };

      // Update the time slot in Firebase using dataOperations.
      const result = await dataOperations.update(
        updatedSlot,
        {
          date: timeSlot.date,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time
        }
      );

      if (!result.success) {
        throw new Error('Failed to update time slot');
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

  // Function to handle user un-volunteering from a time slot.
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
      // Prepare updated slot data by removing the volunteer and decrementing slots_used.
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used - 1,
        volunteers: (timeSlot.volunteers || []).filter(v => v !== volunteerName)
      };

      // Update the time slot in Firebase using dataOperations.
      const result = await dataOperations.update(
        updatedSlot,
        {
          date: timeSlot.date,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time
        }
      );

      if (!result.success) {
        throw new Error('Failed to update time slot');
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

  // Function to handle updating the global slot limit in settings.
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
      // Update the slot limit value in Firebase settings.
      await setDoc(doc(db, 'settings', 'slotLimit'), { value: limit });
      setSlotLimit(limit); // Update local slotLimit state.
      toast({
        title: "Sucesso",
        description: "Limite de horários atualizado com sucesso!"
      });
    } catch (error) {
      console.error('Error updating slot limit:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o limite de horários.",
        variant: "destructive"
      });
    }
  };

  // Function to group time slots by date.
  const groupTimeSlotsByDate = (slots: TimeSlot[]): GroupedTimeSlots => {
    return slots.reduce((groups: GroupedTimeSlots, slot) => {
      const date = slot.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(slot);
      return groups;
    }, {});
  };

  // Function to check if the current user is volunteered for a given time slot.
  const isVolunteered = (timeSlot: TimeSlot) => {
    return timeSlot.volunteers?.includes(volunteerName);
  };

  // Function to check if a time slot is full.
  const isSlotFull = (timeSlot: TimeSlot) => {
    return timeSlot.slots_used === timeSlot.total_slots;
  };

  // Function to format the date for display in headers.
  const formatDateHeader = (date: string) => {
    return format(parseISO(date), "EEE - dd/MM/yyyy", { locale: ptBR })
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  // Function to determine if the volunteer button should be shown for a time slot.
  const shouldShowVolunteerButton = (slot: TimeSlot) => {
    const userDataString = localStorage.getItem('user');
    const userData = userDataString ? JSON.parse(userDataString) : null;

    if (userData?.rank === "Estágio") {
      return false; // Do not show volunteer button for users with "Estágio" rank.
    }

    if (isVolunteered(slot)) {
      return true; // Show button if already volunteered (for un-volunteering).
    }

    if (isSlotFull(slot)) {
      return true; // Show button if slot is full (to indicate it's full).
    }

    // Check if user has reached slot limit and is not admin.
    const userSlotCount = timeSlots.reduce((count, s) =>
      s.volunteers?.includes(volunteerName) ? count + 1 : count, 0
    );

    if (userSlotCount >= slotLimit && !isAdmin) {
      return false; // Hide button if user limit is reached and not admin.
    }

    // Check if user is already volunteered for any slot on the same date.
    const slotsForDate = timeSlots.filter(s => s.date === slot.date);
    const isVolunteeredForDate = slotsForDate.some(s =>
      s.volunteers?.includes(volunteerName)
    );

    return !isVolunteeredForDate; // Show button if not already volunteered for any slot on this date.
  };

  // Function to check if the user can volunteer for a slot based on slot limit.
  const canVolunteerForSlot = (slot: TimeSlot) => {
    if (isAdmin) return true; // Admins can always volunteer.

    // Check if user has reached slot limit.
    const userSlotCount = timeSlots.reduce((count, s) =>
      s.volunteers?.includes(volunteerName) ? count + 1 : count, 0
    );

    return userSlotCount < slotLimit; // User can volunteer if under slot limit.
  };

  // Function to sort volunteers by military rank.
  const sortVolunteers = (volunteers: string[]) => {
    if (!volunteers) return [];

    return volunteers.sort((a, b) => {
      const rankA = a.split(" ")[0];
      const rankB = b.split(" ")[0];
      return getMilitaryRankWeight(rankB) - getMilitaryRankWeight(rankA); // Sort by rank weight in descending order.
    });
  };

  // Group time slots by date using the groupTimeSlotsByDate function.
  const groupedTimeSlots = groupTimeSlotsByDate(timeSlots);

  // Count total slots volunteered by the user.
  const userSlotCount = timeSlots.reduce((count, slot) =>
    slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0
  );

  // State to manage the volunteer to be removed via AlertDialog.
  const [volunteerToRemove, setVolunteerToRemove] = useState<{ name: string; timeSlot: TimeSlot } | null>(null);

  // Function to handle removal of a volunteer from a time slot (admin action).
  const handleRemoveVolunteer = async (timeSlot: TimeSlot, volunteerName: string) => {
    try {
      // Prepare updated slot data by removing the specified volunteer and decrementing slots_used.
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used - 1,
        volunteers: (timeSlot.volunteers || []).filter(v => v !== volunteerName)
      };

      // Update the time slot in Firebase using dataOperations.
      const result = await dataOperations.update(
        updatedSlot,
        {
          date: timeSlot.date,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time
        }
      );

      if (!result.success) {
        throw new Error('Failed to remove volunteer');
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

  // Render loading state if data is still being fetched.
  if (isLoading) {
    return <div className="p-4">Carregando horários...</div>;
  }

  // Render the main component structure.
  return (
    <div className="space-y-6 p-4">
      {/* Time slot limit control component */}
      <TimeSlotLimitControl
        slotLimit={slotLimit}
        onUpdateLimit={handleUpdateSlotLimit}
        userSlotCount={userSlotCount}
        isAdmin={isAdmin}
      />

      {/* Map through grouped time slots to render each date container */}
      {Object.entries(groupedTimeSlots).sort().map(([date, slots]) => {
        const isDatePast = isPast(parseISO(date));
        const isCollapsed = isDatePast; // Automatically collapse past dates

        // Sort slots by start_time in ascending order for each date
        const sortedSlots = [...slots].sort((a, b) => {
          const timeA = a.start_time;
          const timeB = b.start_time;
          return timeA.localeCompare(timeB); // Compare time strings lexicographically
        });

        return (
          <div key={date} className="bg-white rounded-lg shadow-sm">
            <div className="p-4 md:p-5">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    {/* Calendar icon, color depends on whether date is past */}
                    <CalendarDays className={`h-5 w-5 ${isDatePast ? 'text-gray-500' : 'text-blue-500'}`} />
                    {/* Date header, formatted */}
                    <h3 className="font-medium text-lg text-gray-800">
                      {formatDateHeader(date)}
                    </h3>
                  </div>
                  {/* Badge indicating if the extra is closed or active */}
                  <Badge variant={isDatePast ? "outline" : "secondary"} className={`${isDatePast ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                    {isDatePast ? "Extra Encerrada" : "Extra"}
                  </Badge>
                </div>
              </div>

              {/* Conditionally render slots if the date is not collapsed (i.e., not past) */}
              {!isCollapsed && (
                <div className="space-y-3 mt-4">
                  {/* Map through sorted slots to render each time slot */}
                  {sortedSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`border rounded-lg p-4 space-y-2 transition-all ${isSlotFull(slot) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {/* Clock icon */}
                            <Clock className="h-4 w-4 text-blue-500" />
                            {/* Time slot display with calculated duration */}
                            <p className="font-medium text-gray-900">
                              {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)} - {calculateTimeDifference(slot.start_time, slot.end_time)}
                            </p>
                          </div>
                          {/* Badge showing slot availability status */}
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${isSlotFull(slot) ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            <span className="text-sm font-medium">
                              {isSlotFull(slot)
                                ? 'Vagas Esgotadas'
                                : `${slot.total_slots - slot.slots_used} ${slot.total_slots - slot.slots_used === 1 ? 'vaga disponível' : 'vagas disponíveis'}`
                              }
                            </span>
                          </div>
                        </div>
                        {/* Conditional rendering of volunteer buttons */}
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
                      {/* Display list of volunteers if there are any */}
                      {slot.volunteers && slot.volunteers.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium mb-2 text-gray-700">Voluntários:</p>
                          <div className="space-y-1">
                            {/* Map through sorted volunteers to display each name */}
                            {sortVolunteers(slot.volunteers).map((volunteer, index) => (
                              <div key={index} className="text-sm text-gray-600 pl-2 border-l-2 border-gray-300 flex justify-between items-center">
                                <span>{volunteer}</span>
                                {/* Admin option to remove a volunteer */}
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

      {/* Alert dialog for confirming volunteer removal (admin action) */}
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
