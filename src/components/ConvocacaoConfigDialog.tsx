
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { collection, writeBatch, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Clock, Users, AlertTriangle } from "lucide-react";

interface ConvocacaoConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConvocacaoConfigDialog = ({ open, onOpenChange }: ConvocacaoConfigDialogProps) => {
  const [hours, setHours] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStartConvocation = async () => {
    if (hours <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O prazo deve ser maior que 0 horas."
      });
      return;
    }

    setIsLoading(true);
    try {
      // Clear previous responses and set new deadline
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);
      const batch = writeBatch(db);

      const deadline = new Date();
      deadline.setHours(deadline.getHours() + hours);

      // Create convocation record
      const convocacaoRef = doc(collection(db, "convocacoes"));
      batch.set(convocacaoRef, {
        startTime: new Date().toISOString(),
        deadline: deadline.toISOString(),
        active: true,
        createdBy: JSON.parse(localStorage.getItem("user") || "{}").id
      });

      // Clear user responses
      querySnapshot.docs.forEach((userDoc) => {
        const userRef = doc(db, "users", userDoc.id);
        batch.update(userRef, {
          SouVoluntario: null,
          dataResposta: null,
          convocacaoDeadline: deadline.toISOString()
        });
      });

      await batch.commit();

      toast({
        title: "Convocação iniciada",
        description: `Convocação enviada para ${querySnapshot.docs.length} usuários com prazo de ${hours} horas.`
      });

      // Store deadline globally for the modal system
      localStorage.setItem('convocacaoDeadline', deadline.toISOString());
      
      // Trigger global event for convocation
      window.dispatchEvent(new CustomEvent('convocacaoIniciada', {
        detail: { deadline: deadline.toISOString() }
      }));

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao iniciar convocação:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível iniciar a convocação."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Users className="h-6 w-6 text-blue-600" />
            Configurar Convocação
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Atenção</p>
                <p className="text-amber-700">
                  Esta ação irá enviar uma convocação para todos os usuários cadastrados no sistema.
                  Os usuários terão o prazo definido para responder.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="hours" className="text-sm font-medium">
              Prazo para resposta (em horas)
            </Label>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <Input
                id="hours"
                type="number"
                min="1"
                max="168"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 30)}
                className="flex-1"
                placeholder="30"
              />
            </div>
            <p className="text-xs text-gray-500">
              Recomendado: 30 horas (1 dia e 6 horas)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStartConvocation}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Iniciando..." : "Iniciar Convocação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvocacaoConfigDialog;
