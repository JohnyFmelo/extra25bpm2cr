
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Travel {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  userId: string;
}

export const TravelManagement = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveTravel, setHasActiveTravel] = useState(false);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const checkActiveTravel = async () => {
      const db = getFirestore();
      const travelCollection = collection(db, 'travels');
      
      // Get all travels for the user and filter in memory
      const querySnapshot = await getDocs(travelCollection);
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      
      const activeTravel = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .some(travel => 
          travel.userId === user.id && 
          travel.endDate >= currentDate
        );
      
      setHasActiveTravel(activeTravel);
    };

    checkActiveTravel();
  }, [user.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione as datas de início e fim.",
        variant: "destructive",
      });
      return;
    }

    if (hasActiveTravel) {
      toast({
        title: "Aviso",
        description: "Você já possui uma viagem em andamento.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const db = getFirestore();
      const travelCollection = collection(db, 'travels');
      await addDoc(travelCollection, {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        reason,
        userId: user.id,
      });

      toast({
        title: "Sucesso",
        description: "Viagem cadastrada com sucesso!",
        className: "bg-green-500 text-white"
      });

      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
      setHasActiveTravel(true);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao cadastrar a viagem.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[600px] bg-white rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle>Gerenciar Viagens</CardTitle>
        <CardDescription>Cadastre suas viagens aqui.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={format(startDate || new Date(), 'PPP', { locale: ptBR })}
                  >
                    {startDate ? (
                      format(startDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={format(endDate || new Date(), 'PPP', { locale: ptBR })}
                  >
                    {endDate ? (
                      format(endDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) =>
                      date < (startDate || new Date())
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Input
              id="reason"
              placeholder="Informe o motivo da viagem"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={isLoading || hasActiveTravel}>
            {isLoading ? 'Cadastrando...' : (hasActiveTravel ? 'Viagem em Andamento' : 'Cadastrar Viagem')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
