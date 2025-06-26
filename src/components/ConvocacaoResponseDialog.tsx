
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface ConvocacaoResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  convocation: {
    id: string;
    month_year: string;
    start_date: string;
    end_date: string;
    created_at: Date;
    deadline_days: number;
  };
  user: {
    name: string;
    email: string;
  };
}

const ConvocacaoResponseDialog = ({ open, onOpenChange, convocation, user }: ConvocacaoResponseDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [response, setResponse] = useState<boolean | null>(null);
  const { toast } = useToast();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getDeadlineDate = () => {
    const createdAt = convocation.created_at;
    const deadlineDate = new Date(createdAt);
    deadlineDate.setDate(deadlineDate.getDate() + convocation.deadline_days);
    return deadlineDate;
  };

  const isWithinDeadline = () => {
    const now = new Date();
    const deadline = getDeadlineDate();
    return now <= deadline;
  };

  const selectOption = async (choice: 'volunteer' | 'not-volunteer') => {
    if (hasResponded || isSubmitting) return;

    // Verificar se ainda está dentro do prazo
    if (!isWithinDeadline()) {
      toast({
        title: "Prazo encerrado",
        description: "O prazo para responder a convocação já foi encerrado.",
        variant: "destructive",
      });
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    const isVolunteer = choice === 'volunteer';

    try {
      const responsesRef = collection(db, 'convocation_responses');
      await addDoc(responsesRef, {
        convocation_id: convocation.id,
        user_email: user.email,
        user_name: user.name,
        is_volunteer: isVolunteer,
        responded_at: new Date(),
        response_type: isVolunteer ? 'SIM' : 'NAO'
      });

      setResponse(isVolunteer);
      setHasResponded(true);
      
      toast({
        title: "Resposta registrada",
        description: isVolunteer 
          ? "Você foi registrado como VOLUNTÁRIO para o serviço extra."
          : "Você foi registrado como NÃO VOLUNTÁRIO.",
      });

      // Fechar o dialog após 3 segundos
      setTimeout(() => {
        onOpenChange(false);
      }, 3000);

    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar sua resposta. Tente novamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const getRemainingDays = () => {
    const now = new Date();
    const deadline = getDeadlineDate();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <Dialog open={open} onOpenChange={!hasResponded ? onOpenChange : () => {}}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white rounded-2xl border-0">
        <div className="bg-gradient-to-br from-red-500 to-orange-600 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/10 to-transparent"></div>
          <h1 className="text-2xl font-bold mb-2 relative z-10">CONVOCAÇÃO EXTRA</h1>
          <p className="text-lg opacity-90 relative z-10">Serviço Extra - {convocation.month_year}</p>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mt-3 inline-block relative z-10">
            <span className="text-sm font-medium">⏰ Prazo: Encerra em {getRemainingDays()} dias</span>
          </div>
        </div>
        
        <div className="p-8">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8 relative">
            <div className="absolute -top-3 left-4 bg-yellow-50 px-2">
              <span className="text-xl">⚠️</span>
            </div>
            <h3 className="text-yellow-800 font-bold text-lg mb-3 mt-2">IMPORTANTE - LEIA ATENTAMENTE</h3>
            <p className="text-yellow-800 leading-relaxed">
              <strong>ATENÇÃO:</strong> O militar que se manifestar como <strong>VOLUNTÁRIO</strong> 
              poderá ser escalado independente de comunicação prévia no período de folga, 
              conforme necessidade do serviço. Esta decisão é definitiva e vinculativa.
            </p>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Você se voluntaria para o serviço extra?</h2>
            <p className="text-gray-600">
              Período: {formatDate(convocation.start_date)} até {formatDate(convocation.end_date)}
            </p>
          </div>
          
          {!isWithinDeadline() ? (
            <div className="text-center p-6 rounded-xl border-2 bg-red-50 border-red-200 text-red-800">
              <div className="text-xl font-bold mb-2">⏰ PRAZO ENCERRADO</div>
              <p className="text-sm">
                O prazo para responder a esta convocação foi encerrado em {getDeadlineDate().toLocaleDateString('pt-BR')}.
              </p>
            </div>
          ) : !hasResponded ? (
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                onClick={() => selectOption('volunteer')}
                disabled={isSubmitting}
                className="w-full sm:w-48 h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {isSubmitting ? "..." : "✓ SOU VOLUNTÁRIO"}
              </Button>
              <Button
                onClick={() => selectOption('not-volunteer')}
                disabled={isSubmitting}
                className="w-full sm:w-48 h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {isSubmitting ? "..." : "✗ NÃO SOU VOLUNTÁRIO"}
              </Button>
            </div>
          ) : (
            <div className={`text-center p-6 rounded-xl border-2 ${
              response 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="text-xl font-bold mb-2">
                {response ? '✅ VOLUNTÁRIO CONFIRMADO' : '📝 NÃO VOLUNTÁRIO REGISTRADO'}
              </div>
              <p className="text-sm">
                {response 
                  ? 'Sua disponibilidade foi registrada. Você poderá ser convocado conforme necessidade do serviço, inclusive em períodos de folga.'
                  : 'Sua posição foi registrada. Você seguirá a escala normal de serviços.'
                }
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvocacaoResponseDialog;
