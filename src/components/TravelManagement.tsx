import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Travel {
  startDate: string;
  endDate: string;
  slots: number;
  volunteers: string[];
}

const TravelManagement = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [slots, setSlots] = useState("");
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.userType === "admin";

  const handleCreateTravel = async () => {
    if (!startDate || !endDate || !slots) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTravel: Travel = {
        startDate,
        endDate,
        slots: parseInt(slots),
        volunteers: [],
      };

      await addDoc(collection(db, "travels"), newTravel);
      
      toast({
        title: "Sucesso",
        description: "Viagem criada com sucesso!",
      });
      
      setShowDialog(false);
      setStartDate("");
      setEndDate("");
      setSlots("");
    } catch (error) {
      console.error("Error creating travel:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a viagem.",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Viagens</h2>
        <p className="text-gray-600">Funcionalidade ainda em desenvolvimento.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Gerenciar Viagens</h2>
        <Button onClick={() => setShowDialog(true)}>Nova Viagem</Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Viagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Início</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Término</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Número de Vagas</label>
              <Input
                type="number"
                min="1"
                value={slots}
                onChange={(e) => setSlots(e.target.value)}
                placeholder="Digite o número de vagas"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTravel}>
                Criar Viagem
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TravelManagement;