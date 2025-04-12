
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface CreateVacancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateVacancyDialog = ({ open, onOpenChange }: CreateVacancyDialogProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [totalSlots, setTotalSlots] = useState("");
  const [operationalSlots, setOperationalSlots] = useState("");
  const [administrativeSlots, setAdministrativeSlots] = useState("");
  const [intelligenceSlots, setIntelligenceSlots] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const resetForm = () => {
    setDate(undefined);
    setDescription("");
    setTotalSlots("");
    setOperationalSlots("");
    setAdministrativeSlots("");
    setIntelligenceSlots("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !totalSlots) {
      toast({
        title: "Erro",
        description: "Por favor, preencha pelo menos a data e o número total de vagas.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formattedDate = format(date, "yyyy-MM-dd");
      const vacancyData = {
        date: formattedDate,
        description: description || "Extra",
        total_slots: Number(totalSlots),
        slots_used: 0,
        volunteers: [],
        service_slots: {
          operational: Number(operationalSlots) || 0,
          administrative: Number(administrativeSlots) || 0,
          intelligence: Number(intelligenceSlots) || 0
        },
        createdAt: new Date()
      };

      await addDoc(collection(db, "timeSlots"), vacancyData);
      
      toast({
        title: "Sucesso",
        description: "Vaga criada com sucesso!",
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating vacancy:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a vaga.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Vaga</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição da vaga"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="totalSlots">Número Total de Vagas</Label>
              <Input
                id="totalSlots"
                type="number"
                min="1"
                value={totalSlots}
                onChange={(e) => setTotalSlots(e.target.value)}
                placeholder="Ex: 5"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="font-medium">Distribuição de Vagas por Serviço</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="operationalSlots">Operacional</Label>
                  <Input
                    id="operationalSlots"
                    type="number"
                    min="0"
                    value={operationalSlots}
                    onChange={(e) => setOperationalSlots(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="administrativeSlots">Administrativo</Label>
                  <Input
                    id="administrativeSlots"
                    type="number"
                    min="0"
                    value={administrativeSlots}
                    onChange={(e) => setAdministrativeSlots(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="intelligenceSlots">Inteligência</Label>
                  <Input
                    id="intelligenceSlots"
                    type="number"
                    min="0"
                    value={intelligenceSlots}
                    onChange={(e) => setIntelligenceSlots(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Criando..." : "Criar Vaga"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVacancyDialog;
