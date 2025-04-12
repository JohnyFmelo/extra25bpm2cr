
import { Label } from "@/components/ui/label";
import ServiceSlotCheckbox from "./ServiceSlotCheckbox";

interface ServiceSlotsSelectorProps {
  selectedServices: { [key: string]: boolean };
  serviceSlots: { [key: string]: string };
  onServiceChange: (id: string, checked: boolean) => void;
  onServiceSlotChange: (id: string, value: string) => void;
}

const ServiceSlotsSelector = ({
  selectedServices,
  serviceSlots,
  onServiceChange,
  onServiceSlotChange,
}: ServiceSlotsSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="font-medium">Distribuição de Vagas por Serviço</Label>
      <div className="grid gap-4">
        <ServiceSlotCheckbox
          id="operational"
          label="Operacional"
          checked={selectedServices.operational}
          onCheckedChange={(checked) => onServiceChange('operational', checked)}
          slotValue={serviceSlots.operational}
          onSlotValueChange={(value) => onServiceSlotChange('operational', value)}
        />
        
        <ServiceSlotCheckbox
          id="administrative"
          label="Administrativo"
          checked={selectedServices.administrative}
          onCheckedChange={(checked) => onServiceChange('administrative', checked)}
          slotValue={serviceSlots.administrative}
          onSlotValueChange={(value) => onServiceSlotChange('administrative', value)}
        />
        
        <ServiceSlotCheckbox
          id="intelligence"
          label="Inteligência"
          checked={selectedServices.intelligence}
          onCheckedChange={(checked) => onServiceChange('intelligence', checked)}
          slotValue={serviceSlots.intelligence}
          onSlotValueChange={(value) => onServiceSlotChange('intelligence', value)}
        />
      </div>
    </div>
  );
};

export default ServiceSlotsSelector;
