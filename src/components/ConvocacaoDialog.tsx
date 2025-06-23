
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface ConvocacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConvocacaoDialog = ({ open, onOpenChange }: ConvocacaoDialogProps) => {
  const [monthYear, setMonthYear] = useState("Junho 2025");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
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
    if (!monthYear || !startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      // Criar um ID único para a convocação baseado no mês/ano e datas
      const convocacaoId = `${monthYear.replace(/\s+/g, '_')}_${startDate}_${endDate}`;
      
      const convocacaoRef = doc(db, "convocacoes", convocacaoId);
      await setDoc(convocacaoRef, {
        monthYear,
        startDate,
        endDate,
        createdAt: serverTimestamp(),
        active: true
      });

      setShowSuccess(true);
      toast({
        title: "Convocação criada!",
        description: "A convocação foi enviada com sucesso e está disponível para os usuários.",
      });

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error creating convocation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a convocação.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
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

            <Button
              onClick={updateConvocation}
              disabled={isUpdating}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              {isUpdating ? "Atualizando..." : "Atualizar Convocação"}
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
