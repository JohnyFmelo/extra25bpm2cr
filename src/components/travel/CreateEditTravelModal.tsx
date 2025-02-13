
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Travel } from "./types";

interface CreateEditTravelModalProps {
  editingTravel: Travel | null;
  startDate: string;
  endDate: string;
  slots: string;
  destination: string;
  dailyAllowance: string;
  dailyRate: string;
  halfLastDay: boolean;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setSlots: (value: string) => void;
  setDestination: (value: string) => void;
  setDailyAllowance: (value: string) => void;
  setDailyRate: (value: string) => void;
  setHalfLastDay: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const CreateEditTravelModal = ({
  editingTravel,
  startDate,
  endDate,
  slots,
  destination,
  dailyAllowance,
  dailyRate,
  halfLastDay,
  setStartDate,
  setEndDate,
  setSlots,
  setDestination,
  setDailyAllowance,
  setDailyRate,
  setHalfLastDay,
  onSubmit,
  onClose,
}: CreateEditTravelModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="p-6 bg-white shadow-lg max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-xl"
        >
          &times;
        </button>
        <form onSubmit={onSubmit} className="space-y-6">
          <h2 className="text-2xl font-semibold text-primary">
            {editingTravel ? "Editar Viagem" : "Criar Nova Viagem"}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                placeholder="Digite o destino"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slots">Número de Vagas</Label>
                <Input
                  id="slots"
                  type="number"
                  value={slots}
                  onChange={(e) => setSlots(e.target.value)}
                  required
                  min="1"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyRate">Valor da Diária</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  placeholder="Opcional"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-center">
              <Label htmlFor="halfLastDay" className="mr-2 text-sm">
                Último dia meia diária
              </Label>
              <Switch
                id="halfLastDay"
                checked={halfLastDay}
                onCheckedChange={setHalfLastDay}
              />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <Button type="submit" className="w-full md:w-auto">
              {editingTravel ? "Salvar Alterações" : "Criar Viagem"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full md:w-auto"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
