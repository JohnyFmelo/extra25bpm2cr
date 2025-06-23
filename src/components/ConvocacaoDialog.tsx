
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConvocacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConvocacaoDialog = ({ open, onOpenChange }: ConvocacaoDialogProps) => {
  const [monthYear, setMonthYear] = useState("Junho 2025");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deadlineDays, setDeadlineDays] = useState(3);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Definir datas padrão (hoje + 3 dias)
  const setDefaultDates = () => {
    const today = new Date();
    const endDateCalc = new Date(today);
    endDateCalc.setDate(today.getDate() + 3);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(endDateCalc.toISOString().split('T')[0]);
  };

  useEffect(() => {
    if (open) {
      setDefaultDates();
    }
  }, [open]);

  const updateConvocation = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha as datas de início e fim."
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Primeiro, desativar todas as convocações anteriores
      await supabase
        .from('convocations')
        .update({ is_active: false })
        .eq('is_active', true);

      // Criar nova convocação
      const { data, error } = await supabase
        .from('convocations')
        .insert({
          month_year: monthYear,
          start_date: startDate,
          end_date: endDate,
          deadline_days: deadlineDays,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating convocation:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível criar a convocação."
        });
        return;
      }

      console.log('Convocation created:', data);
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
      }, 2000);

      toast({
        title: "Sucesso",
        description: "Convocação atualizada com sucesso!"
      });

    } catch (error) {
      console.error('Exception creating convocation:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-white rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 text-center">
          <DialogTitle className="text-xl font-bold mb-1">Painel de Controle</DialogTitle>
          <p className="text-sm opacity-90">Configuração de Convocação Extra</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-5">
            <div>
              <Label htmlFor="monthYear" className="text-gray-700 font-semibold">Mês e Ano</Label>
              <Input
                id="monthYear"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                placeholder="Ex: Julho 2025"
                className="mt-2 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <Label className="text-gray-700 font-semibold">Período da Convocação</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="startDate" className="text-sm text-gray-600">Início</Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-sm text-gray-600">Fim</Label>
                  <Input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="deadlineDays" className="text-gray-700 font-semibold">Prazo para Resposta (dias)</Label>
              <Input
                type="number"
                id="deadlineDays"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                min="1"
                max="30"
                className="mt-2 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-colors"
              />
            </div>

            <Button
              onClick={updateConvocation}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              {isLoading ? "Processando..." : "Atualizar Convocação"}
            </Button>

            {/* Preview Section */}
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-5 mt-6 text-center">
              <h3 className="text-gray-600 mb-4 font-medium">📋 Prévia da Convocação</h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-lg font-bold text-gray-800 mb-1">CONVOCAÇÃO EXTRA</div>
                <div className="text-gray-600 mb-3">Serviço Extra - {monthYear}</div>
                <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold inline-block">
                  📅 Período: {formatDate(startDate)} até {formatDate(endDate)}
                </div>
                <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-sm font-semibold inline-block mt-2">
                  ⏰ Prazo: Encerra em {deadlineDays} dias
                </div>
              </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="bg-green-100 text-green-800 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300">
                ✅ Convocação atualizada com sucesso!
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvocacaoDialog;
