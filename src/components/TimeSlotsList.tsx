import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO, isPast, addDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
// import { dataOperations } from "@/lib/firebase"; // Se não usado, pode remover
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"; // Adicionei updateDoc, arrayUnion, arrayRemove caso sejam usados pelas suas handlers que não foram mostradas
import { db } from "@/lib/firebase";
import { UserRoundCog, CalendarDays, Clock, ChevronDown, ChevronUp, X } from "lucide-react"; // X já estava
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
// import supabase from "@/lib/supabaseClient"; // REMOVIDO

// --- Interfaces (assumindo que já existem ou adaptando) ---
interface TimeSlot {
  id: string; // Garantir que id esteja sempre presente ao vir do Firebase
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  description?: string;
  allowedMilitaryTypes?: string[];
  volunteers?: string[];
  cost?: number; // Adicionado se for relevante para dailyCost
  serviceType?: string; // Adicionado se for relevante
  rankType?: string; // Adicionado se for relevante para custo
}

interface UserData {
  rank: string;
  warName: string;
  userType: 'admin' | 'user';
  service: string; // Ex: 'Infantaria', 'Comunicações'
  // ... outros campos do usuário
}

interface VolunteerHours {
  [volunteerName: string]: number; // Horas serão números
}

// Supondo que essas funções e tipos existam em algum lugar (mock para exemplo)
const formatDateHeader = (date: string) => format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR });
const calculateCostForSlot = (slot: TimeSlot): number => slot.cost || 0; // Exemplo
const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const TimeSlotLimitControl = ({ slotLimit, onUpdateLimit, userSlotCount, isAdmin }: any) => null; // Placeholder
const renderAllowedMilitaryTypes = (types?: string[]) => types?.join(', '); // Placeholder
const isSlotFull = (slot: TimeSlot) => slot.slots_used >= slot.total_slots;
const shouldShowVolunteerButton = (slot: TimeSlot) => true; // Placeholder
const isVolunteered = (slot: TimeSlot) => false; // Placeholder
const canVolunteerForSlot = (slot: TimeSlot) => true; // Placeholder
const sortVolunteers = (volunteers: string[]) => [...volunteers].sort(); // Placeholder
const handleUpdateSlotLimit = async (newLimit: number) => { /* ... */ };
const handleVolunteer = async (slot: TimeSlot) => { /* ... */ };
const handleUnvolunteer = async (slot: TimeSlot) => { /* ... */ };
// const handleRemoveVolunteer = async (slot: TimeSlot, volunteerName: string) => { /* ... */ }; // Movido para dentro do componente

// Componente
const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Inicializar como true
  const [slotLimit, setSlotLimit] = useState<number>(0);
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHours>({}); // Alterado para VolunteerHours (ou {[key: string]: number})
  const { toast } = useToast();
  const userDataString = localStorage.getItem('user');
  const userData: UserData | null = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  const isAdmin = userData?.userType === 'admin';
  const userService = userData?.service;
  const [collapsedDates, setCollapsedDates] = useState<{ [key: string]: boolean }>({});
  const [volunteerToRemove, setVolunteerToRemove] = useState<{ name: string; timeSlot: TimeSlot } | null>(null);

  // Função para calcular a diferença de tempo (do primeiro código)
  const calculateTimeDifference = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0; // Adiciona verificação
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let [endHour, endMinute] = endTime.split(':').map(Number);

    if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) { // Lida com virada da meia-noite
        endHour += 24;
    }

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    const diffMinutes = endTotalMinutes - startTotalMinutes;
    return diffMinutes / 60; // Retorna em horas
  };

  // Função para calcular horas totais dos voluntários (do primeiro código)
  const calculateVolunteerHours = (slots: TimeSlot[]): VolunteerHours => {
    const hours: VolunteerHours = {};
    slots.forEach(slot => {
      if (slot.volunteers && slot.volunteers.length > 0) {
        const slotHours = calculateTimeDifference(slot.start_time, slot.end_time);
        slot.volunteers.forEach(volunteer => {
          hours[volunteer] = (hours[volunteer] || 0) + slotHours;
        });
      }
    });
    return hours;
  };

  useEffect(() => {
    setIsLoading(true); // Começa carregando

    // Lógica para buscar slotLimit (mantida do segundo código)
    const fetchSlotLimit = async () => {
      try {
        const limitDoc = await getDoc(doc(db, "config", "slotLimit"));
        if (limitDoc.exists()) {
          setSlotLimit(limitDoc.data().limit);
        } else {
          await setDoc(doc(db, "config", "slotLimit"), { limit: 0 }); // Ou valor padrão
          setSlotLimit(0);
        }
      } catch (error) {
        console.error("Erro ao buscar limite de slots:", error);
        toast({ title: "Erro", description: "Não foi possível buscar o limite de slots.", variant: "destructive" });
      }
    };
    if (isAdmin) {
      fetchSlotLimit();
    }

    // Listener do Firebase para timeSlots
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection); // Adicione ordenação ou filtros se necessário

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let slotDateStr: string;

        if (data.date && typeof data.date.toDate === 'function') {
          slotDateStr = format(data.date.toDate(), 'yyyy-MM-dd');
        } else if (typeof data.date === 'string') {
           slotDateStr = data.date; // Se já for string yyyy-MM-dd
        } else {
            console.warn("Formato de data inesperado para o slot:", docSnap.id, data.date);
            slotDateStr = format(new Date(), 'yyyy-MM-dd'); // Fallback para data atual ou tratar erro
        }

        return {
          id: docSnap.id,
          date: slotDateStr,
          start_time: data.start_time || "00:00",
          end_time: data.end_time || "00:00",
          total_slots: data.total_slots || 0,
          slots_used: data.volunteers?.length || data.slots_used || 0, // Recalcular slots_used baseado nos voluntários
          description: data.description || "",
          allowedMilitaryTypes: data.allowedMilitaryTypes || [],
          volunteers: data.volunteers || [],
          cost: data.cost || 0,
          serviceType: data.serviceType || "",
          rankType: data.rankType || ""
        };
      });

      // Ordenar por data e depois por horário (como no primeiro código)
      const sortedSlots = formattedSlots.sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return a.start_time.localeCompare(b.start_time);
      });
      
      setTimeSlots(sortedSlots);
      setVolunteerHours(calculateVolunteerHours(sortedSlots)); // CALCULA E ATUALIZA AS HORAS AQUI
      setIsLoading(false);
    }, (error) => {
        console.error("Erro ao buscar timeSlots:", error);
        toast({ title: "Erro de Conexão", description: "Não foi possível carregar os horários.", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast, isAdmin]); // isAdmin na dependência para fetchSlotLimit

  // Função para buscar horas (agora do estado e retorna número)
  const getVolunteerHours = (volunteerNameParam: string): number | null => {
    // console.log(`Looking for hours for volunteer: ${volunteerNameParam}`);
    // console.log('Available volunteer hours:', volunteerHours);
    
    // Tentativa de correspondência exata
    if (volunteerHours[volunteerNameParam] !== undefined) {
    //   console.log(`Found exact match: ${volunteerHours[volunteerNameParam]}`);
      return volunteerHours[volunteerNameParam];
    }
    
    // Pode manter a lógica de nome de guerra se necessário, mas garanta que as chaves em `volunteerHours` sejam consistentes.
    // A função `calculateVolunteerHours` usa os nomes como estão em `slot.volunteers`.
    // Se `slot.volunteers` armazena "Rank NomeGuerra" e você precisa buscar por "NomeGuerra",
    // a `calculateVolunteerHours` teria que ser ajustada para usar a chave correta ou
    // essa `getVolunteerHours` teria que tentar normalizar.
    // Para simplificar, assumimos que os nomes são consistentes.

    // const volunteerNameParts = volunteerNameParam.split(' ');
    // const warName = volunteerNameParts.slice(1).join(' ');
    // for (const key in volunteerHours) {
    //   if (key.includes(warName)) {
    //     return volunteerHours[key];
    //   }
    // }
    
    // console.log(`No hours found for volunteer: ${volunteerNameParam}`);
    return null;
  };

  const handleRemoveVolunteer = async (slot: TimeSlot, volunteerName: string) => {
    if (!slot || !slot.id || !volunteerName) return;

    try {
      const slotRef = doc(db, 'timeSlots', slot.id);
      await updateDoc(slotRef, {
        volunteers: arrayRemove(volunteerName),
        slots_used: (slot.slots_used > 0 ? slot.slots_used - 1 : 0) // Atualizar slots_used
      });

      toast({
        title: "Sucesso",
        description: `${volunteerName} foi removido do horário.`
      });
      // A atualização do `volunteerHours` ocorrerá automaticamente pelo onSnapshot ao `timeSlots` mudar.
    } catch (error) {
      console.error('Erro ao remover voluntário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o voluntário.",
        variant: "destructive"
      });
    } finally {
      setVolunteerToRemove(null);
    }
  };


  // ... (useMemo para userSlotCount, toggleDateCollapse, etc., como no segundo código)
   const userSlotCount = useMemo(() => {
    if (!volunteerName) return 0;
    return timeSlots.reduce((count, slot) => {
        if (slot.volunteers?.includes(volunteerName)) {
        return count + 1;
        }
        return count;
    }, 0);
  }, [timeSlots, volunteerName]);

  const toggleDateCollapse = (date: string) => {
    setCollapsedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };


  const calculatedGroupedTimeSlots = useMemo(() => {
    const groups: Record<string, { slots: TimeSlot[]; dailyCost: number }> = {};
    timeSlots.forEach(slot => {
      const date = slot.date;
      if (!groups[date]) {
        groups[date] = { slots: [], dailyCost: 0 };
      }
      groups[date].slots.push(slot);
      groups[date].dailyCost += calculateCostForSlot(slot); // Supondo que você tem calculateCostForSlot
    });
    return groups;
  }, [timeSlots]);

  const totalCostSummary = useMemo(() => {
    const summary = { "Cb/Sd": 0, "St/Sgt": 0, "Oficiais": 0, "Total Geral": 0 };
    timeSlots.forEach(slot => {
        const cost = calculateCostForSlot(slot); // Supondo que você tenha calculateCostForSlot
        // Adapte a lógica abaixo baseada em como você define o tipo de militar para o custo
        if (slot.rankType === "Cb/Sd") summary["Cb/Sd"] += cost;
        else if (slot.rankType === "St/Sgt") summary["St/Sgt"] += cost;
        else if (slot.rankType === "Oficiais") summary["Oficiais"] += cost;
        summary["Total Geral"] += cost;
    });
    return summary;
  }, [timeSlots]);

  const weeklyCost = 0; // Adapte essa lógica se necessário
  const weeklyDateRangeText = ""; // Adapte essa lógica se necessário


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-700">Carregando horários...</p>
      </div>
    );
  }

  if (timeSlots.length === 0 && !isLoading) {
    return (
      <div className="space-y-6 p-4 py-0 my-0 px-0">
         <TimeSlotLimitControl
            slotLimit={slotLimit}
            onUpdateLimit={handleUpdateSlotLimit}
            userSlotCount={userSlotCount}
            isAdmin={isAdmin}
          />
        <div className="text-center py-10 text-gray-500">
          <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">Nenhum horário disponível no momento.</p>
        </div>
      </div>
    );
  }

  // --- JSX (Layout do segundo código) ---
  return (
    <div className="space-y-6 p-4 py-0 my-0 px-0">
      <TimeSlotLimitControl
        slotLimit={slotLimit}
        onUpdateLimit={handleUpdateSlotLimit}
        userSlotCount={userSlotCount}
        isAdmin={isAdmin}
      />

      {isAdmin && totalCostSummary["Total Geral"] > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Resumo de Custos Totais</h2>
          <div className="space-y-2">
            <p><strong>Cb/Sd:</strong> {formatCurrency(totalCostSummary["Cb/Sd"])}</p>
            <p><strong>St/Sgt:</strong> {formatCurrency(totalCostSummary["St/Sgt"])}</p>
            <p><strong>Oficiais:</strong> {formatCurrency(totalCostSummary["Oficiais"])}</p>
            <p className="font-semibold text-green-500"><strong>Total Geral:</strong> {formatCurrency(totalCostSummary["Total Geral"])}</p>
            {weeklyCost > 0 && (
              <p className="font-semibold text-blue-500">
                <strong>Custo da Semana ({weeklyDateRangeText}):</strong> {formatCurrency(weeklyCost)}
              </p>
            )}
          </div>
        </div>
      )}

      {Object.entries(calculatedGroupedTimeSlots).sort((a,b) => a[0].localeCompare(b[0])).map(([date, groupedData]) => {
        const { slots, dailyCost } = groupedData;
        if (slots.length === 0) return null;
        const isDatePast = isPast(parseISO(date)) && !isAfter(parseISO(date), addDays(new Date(), -1)); // Considera hoje como não passado
        const isCollapsed = collapsedDates[date] ?? (isDatePast && !isAdmin);
        const sortedSlots = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));

        return (
          <div
            key={date}
            className="bg-white rounded-lg shadow-sm"
            onDoubleClick={isAdmin ? () => toggleDateCollapse(date) : undefined}
          >
            <div className="p-4 md:p-5 px-[5px]">
              <div 
                className={`flex items-center justify-between w-full mb-2 ${isAdmin ? 'cursor-pointer' : ''}`}
                onClick={isAdmin ? () => toggleDateCollapse(date) : undefined}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays
                    className={`h-5 w-5 ${isDatePast ? 'text-gray-500' : 'text-blue-500'}`}
                  />
                  <h3 className="font-medium text-lg text-gray-800">{formatDateHeader(date)}</h3>
                  {isAdmin && dailyCost > 0 && (
                    <span className="text-green-600 font-semibold text-base">
                      {formatCurrency(dailyCost)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isDatePast ? "outline" : "secondary"}
                    className={`${isDatePast ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  >
                    {slots.length} {slots.length === 1 ? 'Horário' : 'Horários'} {/* Exibe a quantidade de horários no dia */}
                  </Badge>
                  {isAdmin && (
                    <button className="focus:outline-none">
                      {isCollapsed ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {!isCollapsed && (
                <div className="space-y-3 mt-4">
                  {sortedSlots.map((slot, idx) => (
                    <div
                      key={slot.id || idx}
                      className={`border rounded-lg p-4 space-y-3 transition-all ${
                        isSlotFull(slot) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {isAdmin && slot.allowedMilitaryTypes && slot.allowedMilitaryTypes.length > 0 && (
                        <div className="mb-1">
                          {renderAllowedMilitaryTypes(slot.allowedMilitaryTypes)}
                        </div>
                      )}

                      <div className="flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
                            <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <p className="font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                              {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)} - 
                              {/* Exibe duração do slot individual */}
                              {calculateTimeDifference(slot.start_time, slot.end_Ltime).toFixed(1)}h
                            </p>
                          </div>
                          {slot.description && (
                            <span className="text-gray-700 ml-2 max-w-[200px] truncate" title={slot.description}>
                              {slot.description}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                              isSlotFull(slot)
                                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            <span className="text-sm font-medium whitespace-nowrap">
                              {isSlotFull(slot)
                                ? 'Vagas Esgotadas'
                                : `${slot.total_slots - slot.slots_used} ${
                                    slot.total_slots - slot.slots_used === 1 ? 'vaga restante' : 'vagas restantes'
                                  }`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {slot.volunteers && slot.volunteers.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium mb-2 text-gray-700">Voluntários:</p>
                          <div className="space-y-1">
                            {sortVolunteers(slot.volunteers).map((volunteer, index) => {
                              const hours = getVolunteerHours(volunteer); // Pega as horas totais do voluntário
                              return (
                                <div
                                  key={index}
                                  className="text-sm text-gray-600 pl-2 border-l-2 border-gray-300 flex justify-between items-center group" // Adicionado 'group'
                                >
                                  <div className="flex items-center">
                                    <span>
                                        {volunteer}
                                        {/* Exibe o total de horas do voluntário (formatado) */}
                                        {hours !== null ? ` - ${Math.round(hours * 10) / 10}h` : ''}
                                    </span>
                                  </div>
                                  {isAdmin && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" // Estilo para aparecer no hover
                                      onClick={() =>
                                        setVolunteerToRemove({
                                          name: volunteer,
                                          timeSlot: slot
                                        })
                                      }
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

                      <div className="pt-2">
                        {shouldShowVolunteerButton(slot) && userData && // Garante que userData existe para verificar isVolunteered etc.
                          (isVolunteered(slot) ? (
                            <Button
                              onClick={() => handleUnvolunteer(slot)}
                              variant="destructive"
                              size="sm"
                              className="w-full shadow-sm hover:shadow"
                              disabled={isDatePast || isLoading} // Desabilita se for passado ou carregando
                            >
                              Desmarcar
                            </Button>
                          ) : (
                            !isSlotFull(slot) &&
                            canVolunteerForSlot(slot) && ( // Garante que canVolunteerForSlot também verifique o limite do usuário
                              <Button
                                onClick={() => handleVolunteer(slot)}
                                className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow w-full"
                                size="sm"
                                disabled={isDatePast || isLoading || (slotLimit > 0 && userSlotCount >= slotLimit)} // Desabilita se passado, carregando ou limite atingido
                              >
                                {slotLimit > 0 && userSlotCount >= slotLimit ? 'Limite Atingido' : 'Voluntário'}
                              </Button>
                            )
                          ))}
                          {isSlotFull(slot) && !isVolunteered(slot) && !isAdmin && (
                            <p className="text-sm text-center text-orange-600 mt-2">Vagas esgotadas para este horário.</p>
                          )}
                          {!canVolunteerForSlot(slot) && !isSlotFull(slot) && !isVolunteered(slot) && !isAdmin && (
                             <p className="text-sm text-center text-gray-500 mt-2">Não qualificado para este tipo de serviço.</p>
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
              Tem certeza que deseja remover <strong>{volunteerToRemove?.name}</strong> do horário 
              {volunteerToRemove && ` de ${volunteerToRemove.timeSlot.start_time.slice(0,5)} às ${volunteerToRemove.timeSlot.end_time.slice(0,5)} no dia ${formatDateHeader(volunteerToRemove.timeSlot.date)}`}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
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
