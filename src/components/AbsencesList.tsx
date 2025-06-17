
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Absence {
  id: string;
  volunteer_name: string;
  date: string;
  hours: number;
  start_time: string;
  end_time: string;
  marked_by: string;
  created_at: string;
}

const AbsencesList = () => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const isAdmin = userData?.userType === 'admin';

  useEffect(() => {
    fetchAbsences();
  }, []);

  const fetchAbsences = async () => {
    try {
      const { data, error } = await supabase
        .from('military_absences')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setAbsences(data || []);
    } catch (error) {
      console.error("Error fetching absences:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a lista de faltas."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAbsence = async (id: string) => {
    try {
      const { error } = await supabase
        .from('military_absences')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAbsences(prev => prev.filter(absence => absence.id !== id));
      toast({
        title: "Falta removida",
        description: "A falta foi removida com sucesso."
      });
    } catch (error) {
      console.error("Error deleting absence:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a falta."
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-center">Carregando faltas...</div>
      </div>
    );
  }

  if (absences.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-red-800">
          Faltas Registradas ({absences.length})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Militar</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Horas</TableHead>
              <TableHead>Marcado por</TableHead>
              {isAdmin && <TableHead>Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {absences.map((absence) => (
              <TableRow key={absence.id}>
                <TableCell className="font-medium">{absence.volunteer_name}</TableCell>
                <TableCell>
                  {format(new Date(absence.date), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {absence.start_time.slice(0, 5)} - {absence.end_time.slice(0, 5)}
                </TableCell>
                <TableCell>{absence.hours}h</TableCell>
                <TableCell>{absence.marked_by}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAbsence(absence.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AbsencesList;
