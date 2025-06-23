
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface ConvocacaoResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  convocacao: {
    id: string;
    monthYear: string;
    startDate: string;
    endDate: string;
  } | null;
  userEmail: string;
  userName: string;
}

const ConvocacaoResponseDialog = ({ 
  open, 
  onOpenChange, 
  convocacao, 
  userEmail, 
  userName 
}: ConvocacaoResponseDialogProps) => {
  const [isResponding, setIsResponding] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (convocacao && userEmail && open) {
      checkIfUserResponded();
    }
  }, [convocacao, userEmail, open]);

  const checkIfUserResponded = async () => {
    if (!convocacao || !userEmail) return;
    
    try {
      const responseRef = doc(db, "convocacao_responses", `${convocacao.id}_${userEmail}`);
      const responseDoc = await getDoc(responseRef);
      setHasResponded(responseDoc.exists());
    } catch (error) {
      console.error("Error checking response:", error);
    }
  };

  const handleResponse = async (isVolunteer: boolean) => {
    if (!convocacao || !userEmail || isResponding) return;

    setIsResponding(true);
    try {
      const responseRef = doc(db, "convocacao_responses", `${convocacao.id}_${userEmail}`);
      await setDoc(responseRef, {
        convocacaoId: convocacao.id,
        userEmail,
        userName,
        isVolunteer,
        respondedAt: new Date(),
        monthYear: convocacao.monthYear,
        startDate: convocacao.startDate,
        endDate: convocacao.endDate
      });

      setHasResponded(true);
      toast({
        title: "Resposta registrada!",
        description: isVolunteer ? 
          "Você se voluntariou para o serviço extra." : 
          "Sua posição foi registrada como não voluntário."
      });

      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error("Error saving response:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar sua resposta.",
        variant: "destructive"
      });
    } finally {
      setIsResponding(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (!convocacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 animate-pulse"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2">CONVOCAÇÃO EXTRA</h1>
            <p className="text-lg opacity-90">Serviço Extra - {convocacao.monthYear}</p>
            <div className="bg-white/20 inline-block px-4 py-2 rounded-full mt-3 text-sm">
              ⏰ Período: {formatDate(convocacao.startDate)} até {formatDate(convocacao.endDate)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {!hasResponded ? (
            <>
              {/* Warning notification */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-5 mb-6 relative">
                <div className="absolute -top-2 left-4 bg-yellow-50 px-2">
                  <span className="text-xl">⚠️</span>
                </div>
                <h3 className="text-yellow-800 font-semibold text-lg mb-3 mt-1">
                  IMPORTANTE - LEIA ATENTAMENTE
                </h3>
                <p className="text-yellow-700 leading-relaxed">
                  <strong>ATENÇÃO:</strong> O militar que se manifestar como <strong>VOLUNTÁRIO</strong> 
                  poderá ser escalado independente de comunicação prévia no período de folga, 
                  conforme necessidade do serviço. Esta decisão é definitiva e vinculativa.
                </p>
              </div>

              {/* Question */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Você se voluntaria para o serviço extra?
                </h2>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => handleResponse(true)}
                  disabled={isResponding}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-8 rounded-full text-lg font-semibold uppercase letter-spacing-wider transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-[200px]"
                >
                  {isResponding ? "Registrando..." : "✓ SOU VOLUNTÁRIO"}
                </Button>
                <Button
                  onClick={() => handleResponse(false)}
                  disabled={isResponding}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-8 rounded-full text-lg font-semibold uppercase letter-spacing-wider transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-[200px]"
                >
                  {isResponding ? "Registrando..." : "✗ NÃO SOU VOLUNTÁRIO"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Resposta já registrada!
              </h3>
              <p className="text-gray-600">
                Você já respondeu a esta convocação.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvocacaoResponseDialog;
