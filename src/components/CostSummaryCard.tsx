
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { AlertTriangle, Zap } from "lucide-react";
import BudgetConfigDialog from "./BudgetConfigDialog";

interface CostSummaryCardProps {
  totalCostSummary: {
    "Cb/Sd": number;
    "St/Sgt": number;
    "Oficiais": number;
    "Total Geral": number;
  };
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value).replace("R$", "R$ ");
};

const CostSummaryCard: React.FC<CostSummaryCardProps> = ({ totalCostSummary }) => {
  const [budget, setBudget] = useState<number>(60000); // Valor padrão
  
  // Carregar orçamento do localStorage
  useEffect(() => {
    const savedBudget = localStorage.getItem('extrasBudget');
    if (savedBudget) {
      setBudget(parseFloat(savedBudget));
    }
  }, []);

  const handleBudgetUpdate = (newBudget: number) => {
    setBudget(newBudget);
    localStorage.setItem('extrasBudget', newBudget.toString());
  };

  const totalSpent = totalCostSummary["Total Geral"];
  const progressPercentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const remaining = budget - totalSpent;
  const isOverBudget = totalSpent > budget;
  const isNearLimit = progressPercentage >= 95 && !isOverBudget;

  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Resumo de Custos</h2>
          <BudgetConfigDialog 
            currentBudget={budget}
            onBudgetUpdate={handleBudgetUpdate}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Cb/Sd:</span>
            <span className="font-medium">{formatCurrency(totalCostSummary["Cb/Sd"])}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">St/Sgt:</span>
            <span className="font-medium">{formatCurrency(totalCostSummary["St/Sgt"])}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Oficiais:</span>
            <span className="font-medium">{formatCurrency(totalCostSummary["Oficiais"])}</span>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Geral:</span>
            <span className={`font-bold text-lg ${isOverBudget ? 'text-red-500' : 'text-blue-500'}`}>
              {formatCurrency(totalSpent)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Progresso do orçamento</span>
              <span className={`font-medium ${isOverBudget ? 'text-red-500' : 'text-gray-900'}`}>
                {Math.round(progressPercentage * 100) / 100}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverBudget ? 'bg-red-500' : 
                  isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>R$ 0</span>
              <span>{formatCurrency(budget)}</span>
            </div>
          </div>
        </div>

        {(isNearLimit || isOverBudget) && (
          <div className={`p-3 rounded-lg flex items-start space-x-2 ${
            isOverBudget ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            {isOverBudget ? (
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-medium text-sm ${
                isOverBudget ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {isOverBudget ? 'Orçamento excedido!' : 'Atenção ao limite!'}
              </p>
              <p className={`text-xs ${
                isOverBudget ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {isOverBudget 
                  ? `Excesso: ${formatCurrency(Math.abs(remaining))}`
                  : `Restante: ${formatCurrency(remaining)}`
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CostSummaryCard;
