import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[];
}

interface GroupedTimeSlots {
  [key: string]: TimeSlot[];
}

interface UserLimit {
  warName: string;
  limit: number;
}

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slotLimit, setSlotLimit] = useState<number>(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [showIndividualLimitsDialog, setShowIndividualLimitsDialog] = useState(false);
  const [newLimit, setNewLimit] = useState("");
  const [individualLimits, setIndividualLimits] = useState<UserLimit[]>([]);
  const [newUserLimit, setNewUserLimit] = useState({ warName: "", limit: "" });
  const { toast } = useToast();
  
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  const isAdmin = userData?.userType === 'admin';

  const calculateTimeDifference = (startTime: string, endTime: string): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let adjustedEndHour = endHour;
    if (endHour === 0) {
      adjustedEndHour = 24;
    }
    
    let diffHours = adjustedEndHour - startHour;
    let diffMinutes = endMinute - startMinute;
    
    if (diffMinutes < 0) {
      diffHours -= 1;
      diffMinutes += 60;
    }
    
    const hourText = diffHours > 0 ? `${diffHours}h` : '';
    const minText = diffMinutes > 0 ? `${diffMinutes}min` : '';
    
    return `${hourText}${minText}`;
  };

  useEffect(() => {
    const fetchSlotLimit = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'slotLimit'));
        if (settingsDoc.exists()) {
          setSlotLimit(settingsDoc.data().value || 0);
        }

        const individualLimitsDoc = await getDoc(doc(db, 'settings', 'individualLimits'));
        if (individualLimitsDoc.exists()) {
          setIndividualLimits(individualLimitsDoc.data().limits || []);
        }
      } catch (error) {
        console.error('Error fetching limits:', error);
      }
    };

    fetchSlotLimit();

    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(doc => ({
        id: doc.id,
        date: doc.data().date,
        start_time: doc.data().start_time,
        end_time: doc.data().end_time,
        volunteers: doc.data().volunteers || [],
        slots_used: doc.data().slots_used || 0,
        total_slots: doc.data().total_slots || doc.data().slots || 0,
      }));
      setTimeSlots(formattedSlots);
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to time slots:', error);
      toast({
        title: "Erro ao atualizar horários",
        description: "Não foi possível receber atualizações em tempo real.",
        variant: "destructive"
      });
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

    const userLimit = getUserLimit(volunteerName);
    if (userSlotCount >= userLimit && !isAdmin) {
      toast({
        title: "Limite atingido",
        description: `Você atingiu o limite de ${userLimit} horário${userLimit === 1 ? '' : 's'} por usuário.`,
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
        title: "Erro",
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
        throw new Error('Failed to update time slot');
      }

      toast({
        title: "Sucesso",
        description: "Vaga reservada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao voluntariar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reservar a vaga.",
        variant: "destructive"
      });
    }
  };

  const handleUnvolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) {
      toast({
        title: "Erro",
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
        throw new Error('Failed to update time slot');
      }

      toast({
        title: "Sucesso",
        description: "Vaga desmarcada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao desmarcar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desmarcar a vaga.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSlotLimit = async () => {
    const limit = parseInt(newLimit);
    if (isNaN(limit) || limit < 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um número válido.",
        variant: "destructive"
      });
      return;
    }

    try {
      await setDoc(doc(db, 'settings', 'slotLimit'), { value: limit });
      setSlotLimit(limit);
      setShowLimitDialog(false);
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

  const handleAddIndividualLimit = async () => {
    const limit = parseInt(newUserLimit.limit);
    if (isNaN(limit) || limit < 0 || !newUserLimit.warName) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos corretamente.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedLimits = [
        ...individualLimits.filter(l => l.warName !== newUserLimit.warName),
        { warName: newUserLimit.warName, limit }
      ];

      await setDoc(doc(db, 'settings', 'individualLimits'), { limits: updatedLimits });
      setIndividualLimits(updatedLimits);
      setNewUserLimit({ warName: "", limit: "" });
      toast({
        title: "Sucesso",
        description: "Limite individual atualizado com sucesso!"
      });
    } catch (error) {
      console.error('Error updating individual limit:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o limite individual.",
        variant: "destructive"
      });
    }
  };

  const removeIndividualLimit = async (warName: string) => {
    try {
      const updatedLimits = individualLimits.filter(l => l.warName !== warName);
      await setDoc(doc(db, 'settings', 'individualLimits'), { limits: updatedLimits });
      setIndividualLimits(updatedLimits);
      toast({
        title: "Sucesso",
        description: "Limite individual removido com sucesso!"
      });
    } catch (error) {
      console.error('Error removing individual limit:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o limite individual.",
        variant: "destructive"
      });
    }
  };

  const getUserLimit = (volunteerName: string) => {
    const individualLimit = individualLimits.find(l => volunteerName.includes(l.warName));
    return individualLimit?.limit || slotLimit;
  };

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

  const isVolunteered = (timeSlot: TimeSlot) => {
    return timeSlot.volunteers?.includes(volunteerName);
  };

  const isSlotFull = (timeSlot: TimeSlot) => {
    return timeSlot.slots_used === timeSlot.total_slots;
  };

  const formatDateHeader = (date: string) => {
    return format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })
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

    const userLimit = getUserLimit(volunteerName);
    if (userSlotCount >= userLimit && !isAdmin) {
      return false;
    }

    const slotsForDate = timeSlots.filter(s => s.date === slot.date);
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

    const userLimit = getUserLimit(volunteerName);
    return userSlotCount < userLimit;
  };

  const groupedTimeSlots = groupTimeSlotsByDate(timeSlots);

  if (isLoading) {
    return <div className="p-4">Carregando horários...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {isAdmin && (
        <div className="mb-4 space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
            <div>
              <h3 className="font-medium">Limite de horários por usuário: {slotLimit}</h3>
              <p className="text-sm text-gray-600">
                {slotLimit === 0 ? "Sem limite definido" : `Cada usuário pode escolher até ${slotLimit} horário${slotLimit === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="space-x-2">
              <Button
                onClick={() => setShowLimitDialog(true)}
                variant="outline"
              >
                Alterar Limite Geral
              </Button>
              <Button
                onClick={() => setShowIndividualLimitsDialog(true)}
                variant="outline"
              >
                Limites Individuais
              </Button>
            </div>
          </div>

          {individualLimits.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">Limites Individuais Ativos</h3>
              <div className="space-y-2">
                {individualLimits.map((limit, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{limit.warName}: {limit.limit} horários</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIndividualLimit(limit.warName)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {Object.entries(groupedTimeSlots).sort().map(([date, slots]) => (
        <div key={date} className="bg-white rounded-lg shadow-sm p-4 md:p-5">
          <h3 className="font-medium text-lg mb-3 text-gray-800">
            {formatDateHeader(date)}
          </h3>
          <div className="space-y-3">
            {slots.map((slot) => (
              <div 
                key={slot.id} 
                className={`border rounded-lg p-3 space-y-2 ${isSlotFull(slot) ? 'bg-orange-50' : 'bg-gray-50'}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">
                      {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)} - {calculateTimeDifference(slot.start_time, slot.end_time)}
                    </p>
                    {slot.slots_used < slot.total_slots && (
                      <p className="text-sm text-gray-600">
                        {slot.total_slots - slot.slots_used} {slot.total_slots - slot.slots_used === 1 ? 'vaga' : 'vagas'}
                      </p>
                    )}
                  </div>
                  {shouldShowVolunteerButton(slot) && (
                    isVolunteered(slot) ? (
                      <Button 
                        onClick={() => handleUnvolunteer(slot)}
                        variant="destructive"
                        size="sm"
                      >
                        Desmarcar
                      </Button>
                    ) : !isSlotFull(slot) && canVolunteerForSlot(slot) ? (
                      <Button 
                        onClick={() => handleVolunteer(slot)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        size="sm"
                      >
                        Voluntário
                      </Button>
                    ) : (
                      <Button disabled size="sm">
                        Vagas Esgotadas
                      </Button>
                    )
                  )}
                </div>
                {slot.volunteers && slot.volunteers.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm font-medium mb-1 text-gray-700">Voluntários:</p>
                    <div className="space-y-1">
                      {slot.volunteers.map((volunteer, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          {volunteer}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Limite de Horários</DialogTitle>
            <DialogDescription>
              Define quantos horários cada usuário poderá escolher.
              Use 0 para remover o limite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="Digite o novo limite"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowLimitDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateSlotLimit}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showIndividualLimitsDialog} onOpenChange={setShowIndividualLimitsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Definir Limites Individuais</DialogTitle>
            <DialogDescription>
              Define limites específicos para usuários individuais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                value={newUserLimit.warName}
                onChange={(e) => setNewUserLimit(prev => ({ ...prev, warName: e.target.value }))}
                placeholder="Nome de Guerra"
              />
              <Input
                type="number"
                min="0"
                value={newUserLimit.limit}
                onChange={(e) => setNewUserLimit(prev => ({ ...prev, limit: e.target.value }))}
                placeholder="Limite de horários"
              />
            </div>
            <Button onClick={handleAddIndividualLimit} className="w-full">
              Adicionar Limite Individual
            </Button>
            {individualLimits.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Limites Atuais</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Limite</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {individualLimits.map((limit, index) => (
                      <TableRow key={index}>
                        <TableCell>{limit.warName}</TableCell>
                        <TableCell>{limit.limit}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIndividualLimit(limit.warName)}
                          >
                            Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeSlotsList;
