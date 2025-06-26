import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, UserPlus } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, isWithinInterval, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AddVolunteerToSlotDialog from "./AddVolunteerToSlotDialog";

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
  volunteers?: string[];
}

interface DayWithTimeSlots {
  date: Date;
  timeSlots: TimeSlot[];
}

interface WeeklyCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  showControls?: boolean;
  isLocked?: boolean;
  onLockChange?: (locked: boolean) => void;
}

const WeeklyCalendar = ({
  currentDate,
  onDateChange,
  showControls = true,
  isLocked = false,
  onLockChange
}: WeeklyCalendarProps) => {
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(currentDate, {
    locale: ptBR
  }));
  const [newTimeSlot, setNewTimeSlot] = useState<Omit<TimeSlot, 'id'>>({
    date: format(currentDate, 'yyyy-MM-dd'),
    start_time: '08:00',
    end_time: '12:00',
    title: '',
    description: ''
  });
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddVolunteerDialog, setShowAddVolunteerDialog] = useState(false);
  const [selectedTimeSlotForVolunteer, setSelectedTimeSlotForVolunteer] = useState<TimeSlot | null>(null);
  const {
    toast
  } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    setWeekStartDate(startOfWeek(currentDate, {
      locale: ptBR
    }));
  }, [currentDate]);

  useEffect(() => {
    const startDate = startOfWeek(currentDate, {
      locale: ptBR
    });
    const endDate = endOfWeek(currentDate, {
      locale: ptBR
    });
    const timeSlotsCollection = collection(db, 'timeSlots');
    const q = query(timeSlotsCollection, where('date', '>=', format(startDate, 'yyyy-MM-dd')), where('date', '<=', format(endDate, 'yyyy-MM-dd')));
    const unsubscribe = onSnapshot(q, snapshot => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          title: data.title,
          description: data.description,
          volunteers: data.volunteers || []
        };
      });
      setTimeSlots(formattedSlots);
    });
    return () => unsubscribe();
  }, [currentDate]);

  const daysInWeek = (): DayWithTimeSlots[] => {
    const start = startOfWeek(currentDate, {
      locale: ptBR
    });
    return Array.from({
      length: 7
    }).map((_, i) => {
      const date = addDays(start, i);
      return {
        date: date,
        timeSlots: timeSlots.filter(slot => isSameDay(date, new Date(slot.date + 'T00:00:00')))
      };
    });
  };
  const handleDateSelect = (date: Date) => {
    onDateChange(date);
    setNewTimeSlot(prev => ({
      ...prev,
      date: format(date, 'yyyy-MM-dd')
    }));
  };
  const handleNextWeek = () => {
    const nextWeek = addDays(weekStartDate, 7);
    onDateChange(nextWeek);
  };
  const handlePrevWeek = () => {
    const prevWeek = addDays(weekStartDate, -7);
    onDateChange(prevWeek);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setNewTimeSlot(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleTimeChange = (name: string, value: string) => {
    setNewTimeSlot(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleCreateTimeSlot = async () => {
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, "timeSlots"), newTimeSlot);
      setNewTimeSlot({
        date: format(currentDate, 'yyyy-MM-dd'),
        start_time: '08:00',
        end_time: '12:00',
        title: '',
        description: ''
      });
      toast({
        title: "Horário Criado",
        description: "Novo horário de serviço criado com sucesso."
      });
      setShowDialog(false);
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({
        variant: "destructive",
        title: "Erro ao criar horário",
        description: "Houve um problema ao criar o horário. Tente novamente."
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleSelectTimeSlot = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setShowDialog(true);
    setNewTimeSlot({
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      title: slot.title,
      description: slot.description
    });
  };
  const handleUpdateTimeSlot = async () => {
    if (!selectedTimeSlot?.id) return;
    setIsSaving(true);
    try {
      const timeSlotRef = doc(db, "timeSlots", selectedTimeSlot.id);
      await updateDoc(timeSlotRef, newTimeSlot);
      toast({
        title: "Horário Atualizado",
        description: "Horário de serviço atualizado com sucesso."
      });
    } catch (e) {
      console.error("Error updating document: ", e);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar horário",
        description: "Houve um problema ao atualizar o horário. Tente novamente."
      });
    } finally {
      setIsSaving(false);
      setShowDialog(false);
    }
  };
  const handleDeleteTimeSlot = async () => {
    if (!selectedTimeSlot?.id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "timeSlots", selectedTimeSlot.id));
      toast({
        title: "Horário Deletado",
        description: "Horário de serviço deletado com sucesso."
      });
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao deletar horário",
        description: "Houve um problema ao deletar o horário. Tente novamente."
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setShowDialog(false);
    }
  };
  const handleLockChange = async (checked: boolean) => {
    if (onLockChange) {
      onLockChange(checked);
    }
  };
  const handleAddTimeSlotClick = () => {
    setNewTimeSlot({
      date: format(currentDate, 'yyyy-MM-dd'),
      start_time: '08:00',
      end_time: '12:00',
      title: '',
      description: ''
    });
    setShowDialog(true);
    setSelectedTimeSlot(null);
  };
  const handleAddVolunteerClick = (slot: TimeSlot) => {
    setSelectedTimeSlotForVolunteer(slot);
    setShowAddVolunteerDialog(true);
  };
  const handleAddVolunteerSuccess = () => {
    setSelectedTimeSlotForVolunteer(null);
  };

  return (
    <div className="w-full space-y-6">
      {showControls && <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="h-8 w-[37px]" onClick={handlePrevWeek}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="sr-only">Semana anterior</span>
            </Button>
            <Button variant="outline" className="h-8 ml-2" onClick={handleNextWeek}>
              Próxima semana
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="lock" checked={isLocked} onCheckedChange={handleLockChange} />
            <Label htmlFor="lock" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Bloquear edição
            </Label>
          </div>
        </div>}

      <div className="grid grid-cols-7 gap-2">
        {daysInWeek().map(day => (<Card key={day.date.toISOString()} className="shadow-md">
            <CardHeader className="p-2">
              <CardTitle className="text-sm text-center">
                {format(day.date, 'EEE', {
                locale: ptBR
              }).toUpperCase()}
              </CardTitle>
              <div className="text-xs text-muted-foreground text-center">
                {format(day.date, 'dd/MM')}
              </div>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {day.timeSlots.length > 0 ? day.timeSlots.map(slot => (<Badge key={slot.id} className="w-full justify-start cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSelectTimeSlot(slot)}>
                      {slot.title}
                      <div className="ml-auto flex items-center space-x-1">
                        {slot.volunteers && slot.volunteers.length > 0 && <span className="text-xs font-bold">{slot.volunteers.length}</span>}
                        <Button variant="ghost" size="icon" className="hover:bg-transparent" onClick={e => {
                        e.stopPropagation();
                        handleAddVolunteerClick(slot);
                      }}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </Badge>)) : (<div className="text-xs text-muted-foreground text-center">
                    Sem horários
                  </div>)}
            </CardContent>
            {showControls && <CardFooter className="p-2">
                {!isLocked && <Button variant="secondary" className="w-full" onClick={handleAddTimeSlotClick}>
                    Adicionar
                  </Button>}
              </CardFooter>}
          </Card>))}
      </div>

      {selectedTimeSlotForVolunteer && <AddVolunteerToSlotDialog open={showAddVolunteerDialog} onOpenChange={setShowAddVolunteerDialog} timeSlot={{
        id: selectedTimeSlotForVolunteer.id,
        date: selectedTimeSlotForVolunteer.date,
        start_time: selectedTimeSlotForVolunteer.start_time,
        end_time: selectedTimeSlotForVolunteer.end_time,
        volunteers: selectedTimeSlotForVolunteer.volunteers
      }} onVolunteerAdded={handleAddVolunteerSuccess} />}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{selectedTimeSlot ? 'Editar Horário de Serviço' : 'Novo Horário de Serviço'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Data
              </Label>
              <Input type="text" id="date" value={newTimeSlot.date} disabled className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start_time" className="text-right">
                Início
              </Label>
              <Select onValueChange={value => handleTimeChange('start_time', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o horário de início" defaultValue={newTimeSlot.start_time} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({
                  length: 24
                }, (_, i) => i).map(hour => {
                  const time = String(hour).padStart(2, '0') + ':00';
                  return <SelectItem key={time} value={time}>{time}</SelectItem>;
                })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_time" className="text-right">
                Fim
              </Label>
              <Select onValueChange={value => handleTimeChange('end_time', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o horário de término" defaultValue={newTimeSlot.end_time} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({
                  length: 24
                }, (_, i) => i).map(hour => {
                  const time = String(hour).padStart(2, '0') + ':00';
                  return <SelectItem key={time} value={time}>{time}</SelectItem>;
                })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título
              </Label>
              <Input type="text" id="title" name="title" value={newTimeSlot.title} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea id="description" name="description" value={newTimeSlot.description} onChange={handleInputChange} className="col-span-3" />
            </div>
          </div>
          <CardFooter>
            <div className="ml-auto space-x-2">
              {selectedTimeSlot && <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                  Deletar Horário
                </Button>}
              <Button variant="secondary" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={selectedTimeSlot ? handleUpdateTimeSlot : handleCreateTimeSlot} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </CardFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deletar Horário de Serviço</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            Tem certeza que deseja deletar este horário de serviço?
          </div>
          <CardFooter>
            <div className="ml-auto space-x-2">
              <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteTimeSlot} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deletar
              </Button>
            </div>
          </CardFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeeklyCalendar;
