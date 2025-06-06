// --- START OF FILE TimeSlotDialog (8).tsx ---

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Clock, Calendar, Users, RefreshCw, FileText, Shield, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
// Atualize o caminho de importação se necessário
import { TimeSlot, RankCategoryType, RANK_CATEGORIES, UserServiceType, USER_SERVICE_TYPES } from "@/types/timeSlot";
import { Label } from "./ui/label";

interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onAddTimeSlot: (timeSlot: Omit<TimeSlot, 'id' | 'slotsUsed' | 'volunteers' | 'date'> & { date: string }) => void; // Ajustado para o que é realmente enviado
  onEditTimeSlot: (timeSlot: TimeSlot) => void; // Completo para edição
  editingTimeSlot: TimeSlot | null;
  isLoading?: boolean;
}

const TimeSlotDialog = ({
  open,
  onOpenChange,
  selectedDate,
  onAddTimeSlot,
  onEditTimeSlot,
  editingTimeSlot,
  isLoading = false,
}: TimeSlotDialogProps) => {
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("13:00");
  const [selectedSlots, setSelectedSlots] = useState<number>(2); // total_slots
  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlots, setCustomSlots] = useState("");
  const [useWeeklyLogic, setUseWeeklyLogic] = useState(false);
  const [description, setDescription] = useState("");
  const [allowedRankCategories, setAllowedRankCategories] = useState<RankCategoryType[]>([]);
  const [allowedServices, setAllowedServices] = useState<UserServiceType[]>([]);

  const slotOptions = [2, 3, 4, 5];

  useEffect(() => {
    if (open) { // Apenas redefina/preencha quando o diálogo abrir
        if (editingTimeSlot) {
            setStartTime(editingTimeSlot.startTime);
            setEndTime(editingTimeSlot.endTime);
            setSelectedSlots(editingTimeSlot.slots);
            setDescription(editingTimeSlot.description || "");
            setAllowedRankCategories(editingTimeSlot.allowedRankCategories || []);
            setAllowedServices(editingTimeSlot.allowedServices || []);
            if (!slotOptions.includes(editingTimeSlot.slots)) {
                setShowCustomSlots(true);
                setCustomSlots(editingTimeSlot.slots.toString());
            } else {
                setShowCustomSlots(false);
                setCustomSlots(""); // Limpar custom slots se um predefinido for carregado
            }
            setUseWeeklyLogic(editingTimeSlot.isWeekly || false); // Carregar isWeekly se existir
        } else {
            // Valores padrão para novo registro
            setStartTime("07:00");
            setEndTime("13:00");
            setSelectedSlots(2);
            setShowCustomSlots(false);
            setCustomSlots("");
            setDescription("");
            setUseWeeklyLogic(false);
            setAllowedRankCategories([]);
            setAllowedServices([]);
        }
    }
  }, [editingTimeSlot, open]); // Adicionado 'open' como dependência

  const handleRankCategoryToggle = (category: RankCategoryType) => {
    setAllowedRankCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleServiceToggle = (service: UserServiceType) => {
    setAllowedServices(prev => {
      if (prev.includes(service)) {
        return prev.filter(s => s !== service);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleRegister = () => {
    const slotsValue = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    
    const dateString = format(selectedDate, "yyyy-MM-dd");

    const timeSlotData = {
      date: dateString,
      startTime: startTime,
      endTime: endTime,
      slots: slotsValue, // Este é o total_slots
      isWeekly: useWeeklyLogic,
      description: description.trim(),
      allowedRankCategories: allowedRankCategories,
      allowedServices: allowedServices,
    };
    
    if (editingTimeSlot) {
      onEditTimeSlot({
        ...editingTimeSlot, // Mantém id, slotsUsed, volunteers
        ...timeSlotData,   // Atualiza os campos editáveis
      });
    } else {
      onAddTimeSlot(timeSlotData); // Envia apenas os dados para um novo slot
    }
    onOpenChange(false);
  };

  const isButtonDisabled = () => {
    if (showCustomSlots) {
      const numSlots = parseInt(customSlots);
      return isNaN(numSlots) || numSlots <= 0 || isLoading;
    }
    return isLoading;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-gradient-to-r from-green-500 to-green-600 -mx-6 -mt-6 p-6 mb-4 rounded-t-lg text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5" />
              <DialogTitle className="font-bold text-lg">
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </DialogTitle>
            </div>
            <p className="text-center text-white/80 text-sm">
              {editingTimeSlot ? "Editar horário de atendimento" : "Novo horário de Jornada Extraordinária"}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto pr-2"> {/* Added scroll for long dialogs */}
          {/* Horário de início e fim */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="h-4 w-4 text-green-500" />
              Horário
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="startTime" className="text-xs text-gray-500">Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-center"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endTime" className="text-xs text-gray-500">Fim</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="text-center"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Número de vagas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4 text-green-500" />
              Número de vagas (total\_slots)
            </Label>
            <div className="flex flex-wrap gap-2">
              {slotOptions.map((slotsNum) => (
                <Button
                  key={slotsNum}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 min-w-10 h-10 border-gray-200",
                    selectedSlots === slotsNum && !showCustomSlots && "bg-green-500 text-white hover:bg-green-600 border-green-500"
                  )}
                  onClick={() => {
                    setSelectedSlots(slotsNum);
                    setShowCustomSlots(false);
                  }}
                  disabled={isLoading}
                >
                  {slotsNum}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 min-w-10 h-10 border-gray-200",
                  showCustomSlots && "bg-green-500 text-white hover:bg-green-600 border-green-500"
                )}
                onClick={() => setShowCustomSlots(true)}
                disabled={isLoading}
              >
                Outro
              </Button>
            </div>

            {showCustomSlots && (
              <div className="pt-2">
                <Input
                  type="number"
                  value={customSlots}
                  onChange={(e) => setCustomSlots(e.target.value)}
                  className="text-center"
                  placeholder="Número personalizado de vagas"
                  disabled={isLoading}
                  min="1"
                />
              </div>
            )}
          </div>

          {/* Categorias de Posto Permitidas */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4 text-green-500" />
              Categorias de Posto Permitidas
            </Label>
            <div className="space-y-3">
              {RANK_CATEGORIES.map((category) => (
                <div key={category} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                  <Switch
                    checked={allowedRankCategories.includes(category)}
                    onCheckedChange={() => handleRankCategoryToggle(category)}
                    className={cn("data-[state=checked]:bg-green-500", "data-[state=checked]:hover:bg-green-600")}
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
            {allowedRankCategories.length === 0 && (
              <p className="text-xs text-gray-500 italic">
                Se não selecionar nenhuma, todas as categorias de posto serão permitidas.
              </p>
            )}
          </div>

          {/* Serviços Permitidos */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Briefcase className="h-4 w-4 text-green-500" />
              Serviços Permitidos
            </Label>
            <div className="space-y-3">
              {USER_SERVICE_TYPES.map((service) => (
                <div key={service} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">{service}</span>
                  <Switch
                    checked={allowedServices.includes(service)}
                    onCheckedChange={() => handleServiceToggle(service)}
                    className={cn("data-[state=checked]:bg-green-500", "data-[state=checked]:hover:bg-green-600")}
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
            {allowedServices.length === 0 && (
              <p className="text-xs text-gray-500 italic">
                Se não selecionar nenhum, todos os serviços serão permitidos.
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4 text-green-500" />
              Descrição (opcional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
              placeholder="Ex: Apoio ao evento X, Reforço de segurança Y, etc."
              disabled={isLoading}
            />
          </div>

          {!editingTimeSlot && (
            <div className="flex items-center justify-between gap-2 pt-2 pb-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-500" />
                <Label htmlFor="weeklyLogicSwitch" className="text-sm font-medium text-gray-700">
                  Aplicar para toda a semana
                </Label>
              </div>
              <Switch
                id="weeklyLogicSwitch"
                checked={useWeeklyLogic}
                onCheckedChange={setUseWeeklyLogic}
                className={cn("data-[state=checked]:bg-green-500", "data-[state=checked]:hover:bg-green-600")}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="text-gray-700 border-gray-300"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleRegister}
            disabled={isButtonDisabled()}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            ) : (
              editingTimeSlot ? "Salvar alterações" : "Registrar horário"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotDialog;
// --- END OF FILE TimeSlotDialog (8).tsx ---
