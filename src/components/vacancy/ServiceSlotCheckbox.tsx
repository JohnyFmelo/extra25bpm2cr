
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ServiceSlotCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  slotValue: string;
  onSlotValueChange: (value: string) => void;
}

const ServiceSlotCheckbox = ({
  id,
  label,
  checked,
  onCheckedChange,
  slotValue,
  onSlotValueChange,
}: ServiceSlotCheckboxProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id={id} 
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
      />
      <Label htmlFor={id} className="font-normal cursor-pointer">{label}</Label>
      {checked && (
        <div className="flex-grow ml-2">
          <Input
            type="number"
            min="0"
            value={slotValue}
            onChange={(e) => onSlotValueChange(e.target.value)}
            placeholder="Número de vagas"
            className="w-32"
          />
        </div>
      )}
    </div>
  );
};

export default ServiceSlotCheckbox;
