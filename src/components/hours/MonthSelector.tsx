
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

interface MonthSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

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

export const MonthSelector = ({ value, onChange }: MonthSelectorProps) => {
  useEffect(() => {
    if (!value) {
      const currentDate = new Date();
      const currentMonth = months[currentDate.getMonth()].value;
      onChange(currentMonth);
    }
  }, [value, onChange]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full py-7 text-lg font-medium bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary/30 hover:bg-gray-50 transition-colors">
        <SelectValue placeholder="Selecione o mês" />
      </SelectTrigger>
      <SelectContent>
        {months.map((month) => (
          <SelectItem 
            key={month.value} 
            value={month.value}
            className="py-3 text-lg font-medium cursor-pointer hover:bg-gray-100"
          >
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
