
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handleSave = () => {
    const newBudget = parseFloat(budgetValue.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(newBudget) || newBudget < 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor válido.",
        variant: "destructive"
      });
      return;
    }

    onBudgetUpdate(newBudget);
    setIsOpen(false);
    toast({
      title: "Sucesso",
      description: "Orçamento atualizado com sucesso!",
    });
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
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetConfigDialog;
