
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConvocacaoResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  convocation: {
    id: string;
    month_year: string;
    start_date: string;
    end_date: string;
    deadline_days: number;
  };
  userEmail: string;
  userName: string;
}

const ConvocacaoResponseDialog = ({ 
  open, 
  onOpenChange, 
  convocation, 
  userEmail, 
  userName 
}: ConvocacaoResponseDialogProps) => {
  const [isResponding, setIsResponding] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [responseType, setResponseType] = useState<boolean | null>(null);
  const { toast } = useToast();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const handleResponse = async (isVolunteer: boolean) => {
    setIsResponding(true);
    
    try {
      const { error } = await supabase
        .from('convocation_responses')
        .upsert({
          convocation_id: convocation.id,
          user_email: userEmail,
          user_name: userName,
          is_volunteer: isVolunteer
        }, {
          onConflict: 'convocation_id,user_email'
        });

      if (error) {
        console.error('Error saving response:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível salvar sua resposta."
        });
        return;
      }

      setHasResponded(true);
      setResponseType(isVolunteer);
      
      toast({
        title: "Resposta registrada",
        description: `Sua posição como ${isVolunteer ? 'VOLUNTÁRIO' : 'NÃO VOLUNTÁRIO'} foi registrada com sucesso.`
      });

      // Fechar o diálogo após 3 segundos
      setTimeout(() => {
        onOpenChange(false);
      }, 3000);

    } catch (error) {
      console.error('Exception saving response:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado."
      });
    } finally {
      setIsResponding(false);
    }
  };

  // Calcular dias restantes
  const today = new Date();
  const createdDate = new Date(convocation.start_date);
  const deadlineDate = new Date(createdDate);
  deadlineDate.setDate(createdDate.getDate() + convocation.deadline_days);
  const daysRemaining = Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <Dialog open={open} onOpenChange={!hasResponded ? onOpenChange : undefined}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 animate-pulse"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2">CONVOCAÇÃO EXTRA</h1>
            <p className="text-lg">Serviço Extra - {convocation.month_year}</p>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mt-3 inline-block">
              <span className="text-sm font-semibold">
                ⏰ Prazo: Encerra em {daysRemaining} dias
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {!hasResponded ? (
            <>
              {/* Notification */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6 relative">
                <div className="absolute -top-3 left-4 bg-yellow-50 px-3 py-1 rounded-full">
                  <span className="text-xl">⚠️</span>
                </div>
                <h3 className="text-yellow-800 font-bold text-lg mb-3 mt-2">
                  IMPORTANTE - LEIA ATENTAMENTE
                </h3>
                <p className="text-yellow-700 leading-relaxed">
                  <strong>ATENÇÃO:</strong> O militar que se manifestar como <strong>VOLUNTÁRIO</strong> 
                  poderá ser escalado independente de comunicação prévia no período de folga, 
                  conforme necessidade do serviço. Esta decisão é definitiva e vinculativa.
                </p>
              </div>

              {/* Period Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
                <h3 className="text-blue-800 font-semibold mb-2">Período da Convocação</h3>
                <div className="text-blue-600 font-medium">
                  📅 {formatDate(convocation.start_date)} até {formatDate(convocation.end_date)}
                </div>
              </div>

              {/* Question */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Você se voluntaria para o serviço extra?
                </h2>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => handleResponse(true)}
                  disabled={isResponding}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-8 rounded-full text-lg font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-[200px]"
                >
                  {isResponding ? "Processando..." : "✓ SOU VOLUNTÁRIO"}
                </Button>
                <Button
                  onClick={() => handleResponse(false)}
                  disabled={isResponding}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-8 rounded-full text-lg font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-[200px]"
                >
                  {isResponding ? "Processando..." : "✗ NÃO SOU VOLUNTÁRIO"}
                </Button>
              </div>
            </>
          ) : (
            /* Response Confirmation */
            <div className="text-center py-8">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                responseType ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className="text-4xl">
                  {responseType ? '✅' : '📝'}
                </span>
              </div>
              
              <h2 className={`text-2xl font-bold mb-4 ${
                responseType ? 'text-green-800' : 'text-red-800'
              }`}>
                {responseType ? '✅ VOLUNTÁRIO CONFIRMADO' : '📝 NÃO VOLUNTÁRIO REGISTRADO'}
              </h2>
              
              <p className={`text-lg leading-relaxed ${
                responseType ? 'text-green-700' : 'text-red-700'
              }`}>
                {responseType 
                  ? 'Sua disponibilidade foi registrada. Você poderá ser convocado conforme necessidade do serviço, inclusive em períodos de folga.'
                  : 'Sua posição foi registrada. Você seguirá a escala normal de serviços.'
                }
              </p>

              <div className="mt-6 text-sm text-gray-500">
                Esta janela será fechada automaticamente em alguns segundos...
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvocacaoResponseDialog;
