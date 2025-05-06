
import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Definição dos meses
const months = [
  { value: "janeiro", label: "Janeiro" },
  { value: "fevereiro", label: "Fevereiro" },
  { value: "marco", label: "Março" },
  { value: "abril", label: "Abril" },
  { value: "maio", label: "Maio" },
  { value: "junho", label: "Junho" },
  { value: "julho", label: "Julho" },
  { value: "agosto", label: "Agosto" },
  { value: "setembro", label: "Setembro" },
  { value: "outubro", label: "Outubro" },
  { value: "novembro", label: "Novembro" },
  { value: "dezembro", label: "Dezembro" },
];

// Função para pegar o mês atual como valor inicial (opcional)
export const getCurrentMonthValue = () => {
  const monthIndex = new Date().getMonth(); // 0 = Janeiro, 11 = Dezembro
  return months[monthIndex]?.value || months[0].value; // Retorna o valor ou o primeiro mês
};

interface MonthSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const MonthSelector = ({ value, onChange }: MonthSelectorProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="month-select" className="block text-sm font-medium text-gray-700">
        Selecione o mês
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="month-select" className="w-full">
          <SelectValue placeholder="Selecione um mês" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

// Export the months array so it can be used elsewhere
export { months };

// Also add a default export to support both import styles
export default MonthSelector;
