
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface AddVolunteerToSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotId: string;
  onVolunteerAdded: () => void;
}

const AddVolunteerToSlotDialog = ({ open, onOpenChange, slotId, onVolunteerAdded }: AddVolunteerToSlotDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    graduation: "",
    rgpm: "",
    service: "",
    date: "",
    startTime: "",
    endTime: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addDoc(collection(db, "volunteers"), {
        ...formData,
        slotId,
        createdAt: new Date().toISOString(),
        isActive: true
      });

      toast({
        title: "Sucesso",
        description: "Voluntário adicionado com sucesso!",
      });

      setFormData({
        name: "",
        graduation: "",
        rgpm: "",
        service: "",
        date: "",
        startTime: "",
        endTime: ""
      });

      onVolunteerAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding volunteer:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o voluntário.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateField = e.target;
    if (dateField) {
      setFormData(prev => ({
        ...prev,
        date: dateField.value
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="graduation">Graduação</Label>
            <Select value={formData.graduation} onValueChange={(value) => setFormData(prev => ({ ...prev, graduation: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a graduação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Soldado">Soldado</SelectItem>
                <SelectItem value="Cabo">Cabo</SelectItem>
                <SelectItem value="3º Sargento">3º Sargento</SelectItem>
                <SelectItem value="2º Sargento">2º Sargento</SelectItem>
                <SelectItem value="1º Sargento">1º Sargento</SelectItem>
                <SelectItem value="Subtenente">Subtenente</SelectItem>
                <SelectItem value="Aspirante">Aspirante</SelectItem>
                <SelectItem value="2º Tenente">2º Tenente</SelectItem>
                <SelectItem value="1º Tenente">1º Tenente</SelectItem>
                <SelectItem value="Capitão">Capitão</SelectItem>
                <SelectItem value="Major">Major</SelectItem>
                <SelectItem value="Tenente Coronel">Tenente Coronel</SelectItem>
                <SelectItem value="Coronel">Coronel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rgpm">RGPM</Label>
            <Input
              id="rgpm"
              value={formData.rgpm}
              onChange={(e) => setFormData(prev => ({ ...prev, rgpm: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Serviço</Label>
            <Input
              id="service"
              value={formData.service}
              onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={handleDateChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário de Início</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Horário de Fim</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
