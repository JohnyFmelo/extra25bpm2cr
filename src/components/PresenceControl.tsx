
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X } from 'lucide-react';

interface PresenceControlProps {
  volunteerName: string;
  timeSlotId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
}

const PresenceControl: React.FC<PresenceControlProps> = ({
  volunteerName,
  timeSlotId,
  date,
  startTime,
  endTime,
  hours
}) => {
  const [isAbsent, setIsAbsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Verificar se já existe uma ausência registrada
  useEffect(() => {
    const checkAbsence = async () => {
      try {
        const absencesRef = collection(db, 'military_absences');
        const q = query(
          absencesRef,
          where('volunteer_name', '==', volunteerName),
          where('date', '==', date),
          where('start_time', '==', startTime),
          where('end_time', '==', endTime)
        );
        const querySnapshot = await getDocs(q);
        setIsAbsent(!querySnapshot.empty);
      } catch (error) {
        console.error('Erro ao verificar ausência:', error);
      }
    };

    checkAbsence();
  }, [volunteerName, date, startTime, endTime]);

  const handleTogglePresence = async () => {
    setIsLoading(true);
    
    try {
      if (isAbsent) {
        // Remover da tabela de ausências (marcar como presente)
        const absencesRef = collection(db, 'military_absences');
        const q = query(
          absencesRef,
          where('volunteer_name', '==', volunteerName),
          where('date', '==', date),
          where('start_time', '==', startTime),
          where('end_time', '==', endTime)
        );
        const querySnapshot = await getDocs(q);
        
        for (const docSnap of querySnapshot.docs) {
          await deleteDoc(doc(db, 'military_absences', docSnap.id));
        }

        setIsAbsent(false);
        toast({
          title: "Presença confirmada",
          description: `${volunteerName} foi marcado como presente.`
        });
      } else {
        // Adicionar à tabela de ausências (marcar como faltou)
        const absenceData = {
          time_slot_id: timeSlotId,
          volunteer_name: volunteerName,
          date: date,
          start_time: startTime,
          end_time: endTime,
          hours: hours,
          marked_by: 'admin', // Pode ser obtido do contexto do usuário
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const newAbsenceRef = doc(collection(db, 'military_absences'));
        await setDoc(newAbsenceRef, absenceData);

        setIsAbsent(true);
        toast({
          title: "Falta registrada",
          description: `${volunteerName} foi marcado como ausente. Horas e valor serão descontados.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a presença.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleTogglePresence}
      disabled={isLoading}
      variant={isAbsent ? "destructive" : "default"}
      size="sm"
      className={`text-xs font-medium px-3 py-1 ${
        isAbsent 
          ? 'bg-red-500 hover:bg-red-600 text-white' 
          : 'bg-teal-500 hover:bg-teal-600 text-white border-teal-500'
      }`}
    >
      {isLoading ? "..." : isAbsent ? "FALTOU" : "PRESENTE"}
      {isAbsent && <X className="h-3 w-3 ml-1" />}
    </Button>
  );
};

export default PresenceControl;
