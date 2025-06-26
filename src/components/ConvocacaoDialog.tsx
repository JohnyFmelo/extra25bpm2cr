
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, UserCheck } from "lucide-react";

interface ConvocacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

const ConvocacaoDialog = ({ open, onOpenChange, user }: ConvocacaoDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleResponse = async (isVolunteer: boolean) => {
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        SouVoluntario: isVolunteer,
        dataResposta: new Date().toISOString()
      });

      toast({
        title: "Resposta registrada",
        description: `Sua resposta foi salva com sucesso: ${isVolunteer ? "SIM" : "NÃO"}`
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar sua resposta. Tente novamente."
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
            Convocação para Serviço Extra
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {user.rank} {user.warName}
              </h3>
              <p className="text-gray-600">
                Você tem disponibilidade para realizar serviços extras este mês?
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => handleResponse(true)}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? "Salvando..." : "SIM, tenho disponibilidade"}
            </Button>
            
            <Button 
              onClick={() => handleResponse(false)}
              disabled={isLoading}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              {isLoading ? "Salvando..." : "NÃO tenho disponibilidade"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvocacaoDialog;
