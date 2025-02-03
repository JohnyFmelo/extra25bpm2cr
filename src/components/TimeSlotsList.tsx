import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot, doc, getDoc, setDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRoundCog, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  userId: string;
  userName: string;
  limit: number;
}

interface User {
  id: string;
  rank?: string;
  warName?: string;
}

const TimeSlotLimitControl = ({ 
  slotLimit, 
  onUpdateLimit, 
  userSlotCount = 0,
  isAdmin = false 
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLimit, setCustomLimit] = useState("");
  const [showUserLimits, setShowUserLimits] = useState(false);
  const [userLimits, setUserLimits] = useState<UserLimit[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedLimit, setSelectedLimit] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();
  
  const predefinedLimits = [1, 2, 3, 4];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchUserLimits = async () => {
      try {
        const limitsDoc = await getDoc(doc(db, 'settings', 'userLimits'));
        if (limitsDoc.exists()) {
          setUserLimits(limitsDoc.data().limits || []);
        }
      } catch (error) {
        console.error('Error fetching user limits:', error);
      }
    };

    if (isAdmin) {
      fetchUsers();
      fetchUserLimits();
    }
  }, [isAdmin]);

  const handleCustomLimitSubmit = () => {
    const limit = parseInt(customLimit);
    if (!isNaN(limit) && limit > 0) {
      onUpdateLimit(limit);
      setShowCustomInput(false);
      setCustomLimit("");
    }
  };

  const handleAddUserLimit = async () => {
    if (!selectedUser || !selectedLimit) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um usuário e um limite.",
        variant: "destructive"
      });
      return;
    }

    const selectedUserData = users.find(u => u.id === selectedUser);
    if (!selectedUserData) return;

    const newLimit: UserLimit = {
      userId: selectedUser,
      userName: `${selectedUserData.rank} ${selectedUserData.warName}`,
      limit: parseInt(selectedLimit)
    };

    const updatedLimits = [...userLimits, newLimit];

    try {
      await setDoc(doc(db, 'settings', 'userLimits'), {
        limits: updatedLimits
      });
      setUserLimits(updatedLimits);
      setSelectedUser("");
      setSelectedLimit("");
      toast({
        title: "Sucesso",
        description: "Limite individual adicionado com sucesso!"
      });
    } catch (error) {
      console.error('Error saving user limit:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o limite individual.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveUserLimit = async (userId: string) => {
    const updatedLimits = userLimits.filter(limit => limit.userId !== userId);
    try {
      await setDoc(doc(db, 'settings', 'userLimits'), {
        limits: updatedLimits
      });
      setUserLimits(updatedLimits);
      toast({
        title: "Sucesso",
        description: "Limite individual removido com sucesso!"
      });
    } catch (error) {
      console.error('Error removing user limit:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o limite individual.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      {!isAdmin && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
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

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Limites individuais</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserLimits(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar exceção
                </Button>
              </div>

              {userLimits.length > 0 && (
                <div className="space-y-2">
                  {userLimits.map((userLimit) => (
                    <div
                      key={userLimit.userId}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{userLimit.userName}</p>
                        <p className="text-sm text-gray-500">Limite: {userLimit.limit} horários</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUserLimit(userLimit.userId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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

          <Dialog open={showUserLimits} onOpenChange={setShowUserLimits}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar limite individual</DialogTitle>
                <DialogDescription>
                  Defina um limite específico para um usuário
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.rank} {user.warName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="1"
                    value={selectedLimit}
                    onChange={(e) => setSelectedLimit(e.target.value)}
                    placeholder="Digite o limite de horários"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUserLimits(false);
                      setSelectedUser("");
                      setSelectedLimit("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddUserLimit}>
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

const TimeSlotsList = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slotLimit, setSlotLimit] = useState<number>(0);
  const { toast } = useToast();
  
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  const isAdmin = userData?.userType === 'admin';
  const [userLimits, setUserLimits] = useState<UserLimit[]>([]);

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
    const fetchData = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'slotLimit'));
        if (settingsDoc.exists()) {
          setSlotLimit(settingsDoc.data().value || 0);
        }

        const userLimitsDoc = await getDoc(doc(db, 'settings', 'userLimits'));
        if (userLimitsDoc.exists()) {
          setUserLimits(userLimitsDoc.data().limits || []);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchData();

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
      console.error('Error listening to time slots:', error);
      toast({
        title: "Erro ao atualizar horários",
        description: "Não foi possível receber atualizações em tempo real.",
        variant: "destructive"
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const getUserSlotLimit = (userId: string): number => {
    const userLimit = userLimits.find(limit => limit.userId === userId);
    return userLimit ? userLimit.limit : slotLimit;
  };

  const handleVolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName || !userData?.id) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    const userLimit = getUserSlotLimit(userData.id);
    const userSlotCount = timeSlots.reduce((count, slot) => 
      slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0
    );

    if (userSlotCount >= userLimit) {
      toast({
        title: "Limite atingido",
        description: `Você atingiu o limite de ${userLimit} horário${userLimit === 1 ? '' : 's'}.`,
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

  const handleUpdateSlotLimit = async (limit: number) => {
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

    if (userSlotCount >= slotLimit && !isAdmin) {
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

    return userSlotCount < slotLimit;
  };

  const groupedTimeSlots = groupTimeSlotsByDate(timeSlots);

  const userSlotCount = timeSlots.reduce((count, slot) => 
    slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0
  );

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
    </div>
  );
};

export default TimeSlotsList;
