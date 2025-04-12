
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateVacancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ServiceType {
  id: string;
  label: string;
  value: number;
}

const CreateVacancyDialog = ({ open, onOpenChange }: CreateVacancyDialogProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [totalSlots, setTotalSlots] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: boolean }>({
    operational: false,
    administrative: false,
    intelligence: false
  });
  
  const [serviceSlots, setServiceSlots] = useState<{ [key: string]: string }>({
    operational: "",
    administrative: "",
    intelligence: ""
  });
  
  const { toast } = useToast();

  const resetForm = () => {
    setDate(undefined);
    setDescription("");
    setTotalSlots("");
    setSelectedServices({
      operational: false,
      administrative: false,
      intelligence: false
    });
    setServiceSlots({
      operational: "",
      administrative: "",
      intelligence: ""
    });
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
      
      // Create service slots object based on selected services
      const serviceSlotValues = {
        operational: selectedServices.operational ? Number(serviceSlots.operational) || 0 : 0,
        administrative: selectedServices.administrative ? Number(serviceSlots.administrative) || 0 : 0,
        intelligence: selectedServices.intelligence ? Number(serviceSlots.intelligence) || 0 : 0
      };
      
      const vacancyData = {
        date: formattedDate,
        description: description || "Extra",
        total_slots: Number(totalSlots),
        slots_used: 0,
        volunteers: [],
        service_slots: serviceSlotValues,
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

  const handleServiceChange = (id: string, checked: boolean) => {
    setSelectedServices(prev => ({
      ...prev,
      [id]: checked
    }));
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
              <Input
                id="description"
                placeholder="Descrição curta da vaga"
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
              <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="operational" 
                    checked={selectedServices.operational}
                    onCheckedChange={(checked) => handleServiceChange('operational', checked as boolean)}
                  />
                  <Label htmlFor="operational" className="font-normal cursor-pointer">Operacional</Label>
                  {selectedServices.operational && (
                    <div className="flex-grow ml-2">
                      <Input
                        type="number"
                        min="0"
                        value={serviceSlots.operational}
                        onChange={(e) => setServiceSlots(prev => ({ ...prev, operational: e.target.value }))}
                        placeholder="Número de vagas"
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="administrative" 
                    checked={selectedServices.administrative}
                    onCheckedChange={(checked) => handleServiceChange('administrative', checked as boolean)}
                  />
                  <Label htmlFor="administrative" className="font-normal cursor-pointer">Administrativo</Label>
                  {selectedServices.administrative && (
                    <div className="flex-grow ml-2">
                      <Input
                        type="number"
                        min="0"
                        value={serviceSlots.administrative}
                        onChange={(e) => setServiceSlots(prev => ({ ...prev, administrative: e.target.value }))}
                        placeholder="Número de vagas"
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="intelligence" 
                    checked={selectedServices.intelligence}
                    onCheckedChange={(checked) => handleServiceChange('intelligence', checked as boolean)}
                  />
                  <Label htmlFor="intelligence" className="font-normal cursor-pointer">Inteligência</Label>
                  {selectedServices.intelligence && (
                    <div className="flex-grow ml-2">
                      <Input
                        type="number"
                        min="0"
                        value={serviceSlots.intelligence}
                        onChange={(e) => setServiceSlots(prev => ({ ...prev, intelligence: e.target.value }))}
                        placeholder="Número de vagas"
                        className="w-32"
                      />
                    </div>
                  )}
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
