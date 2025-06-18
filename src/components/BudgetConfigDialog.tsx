
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dataOperations } from "@/lib/firebase";

interface BudgetConfigDialogProps {
  currentBudget: number;
  onBudgetUpdate: (newBudget: number) => void;
}

const BudgetConfigDialog: React.FC<BudgetConfigDialogProps> = ({
  currentBudget,
  onBudgetUpdate
}) => {
  const [budgetValue, setBudgetValue] = useState(currentBudget.toString());
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const newBudget = parseFloat(budgetValue.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(newBudget) || newBudget < 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor válido.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save to Firebase
      const budgetData = {
        budget: newBudget,
        updatedAt: new Date().toISOString(),
        type: 'budget_config'
      };

      const result = await dataOperations.insert(budgetData);
      
      if (result.success) {
        onBudgetUpdate(newBudget);
        setIsOpen(false);
        toast({
          title: "Sucesso",
          description: "Orçamento atualizado com sucesso!",
        });
      } else {
        throw new Error('Falha ao salvar no Firebase');
      }
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar orçamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseInt(numericValue) / 100 || 0);
    return formattedValue;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setBudgetValue(formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Orçamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Valor do Orçamento</Label>
            <Input
              id="budget"
              value={budgetValue}
              onChange={handleInputChange}
              placeholder="R$ 0,00"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </span>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetConfigDialog;
