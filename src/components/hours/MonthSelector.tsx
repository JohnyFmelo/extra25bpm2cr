
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonthSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const months = [
  { value: "janeiro", label: "Janeiro" },
  { value: "fevereiro", label: "Fevereiro" },
  { value: "marco", label: "Marco" },
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
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o mês" />
      </SelectTrigger>
      <SelectContent>
        {months.map((month) => (
          <SelectItem key={month.value} value={month.value}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
