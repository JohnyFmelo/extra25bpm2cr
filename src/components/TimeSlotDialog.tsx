// --- START OF FILE TimeSlotDialog (3).tsx ---
// ... (imports permanecem os mesmos) ...
import { TimeSlot as TimeSlotFromList } from "./TimeSlotsList"; // Usaremos para clareza na edição

interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  // Estas funções agora esperam um objeto que corresponda à estrutura do Firebase/TimeSlotsList
  onAddTimeSlot: (timeSlot: Omit<TimeSlotFromList, 'id' | 'volunteers' | 'slots_used'> & { slots_used?: number, isWeekly?: boolean }) => void;
  onEditTimeSlot: (timeSlot: Partial<TimeSlotFromList> & { id: string, isWeekly?: boolean }) => void;
  editingTimeSlot: TimeSlotFromList | null; // Vem de TimeSlotsList, então usa snake_case
  isLoading?: boolean;
}

const TimeSlotDialog = ({
  open,
  onOpenChange,
  selectedDate,
  onAddTimeSlot,
  onEditTimeSlot,
  editingTimeSlot, // Agora sabemos que este objeto usa snake_case para allowed_military_types
  isLoading = false,
}: TimeSlotDialogProps) => {
  const [startTime, setStartTime] = useState("07:00");
  const [hours, setHours] = useState("6");
  const [selectedSlots, setSelectedSlots] = useState<number>(2);
  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlots, setCustomSlots] = useState("");
  const [useWeeklyLogic, setUseWeeklyLogic] = useState(false);
  const [description, setDescription] = useState("");
  // Este estado interno do dialog pode continuar camelCase, mas será mapeado ao salvar
  const [allowedMilitaryTypesInternal, setAllowedMilitaryTypesInternal] = useState<string[]>(["Operacional", "Administrativo", "Inteligencia"]);

  const slotOptions = [2, 3, 4, 5];
  const militaryTypes = [
    { id: "Operacional", label: "Operacional" },
    { id: "Administrativo", label: "Administrativo" },
    // Se no Firebase for "Inteligência" (com acento), mude o 'id' aqui também:
    // { id: "Inteligência", label: "Inteligência" }
    { id: "Inteligencia", label: "Inteligência" }
  ];

  // ... (calculateEndTime, calculateDuration permanecem os mesmos) ...
  const calculateEndTime = (start: string, duration: string): string => {
    const [startHour, startMinute] = start.split(':').map(Number);
    const durationHours = parseFloat(duration);
    
    const totalMinutes = startHour * 60 + startMinute + (durationHours * 60);
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  const calculateDuration = (start: string, end: string): string => {
    const [startHour, startMinute] = start.split(':').map(Number);
    let [endHour, endMinute] = end.split(':').map(Number);
    
    if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
      endHour += 24;
    }
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const durationHours = durationMinutes / 60;
    
    return durationHours.toString();
  };


  useEffect(() => {
    if (editingTimeSlot) {
      setStartTime(editingTimeSlot.start_time); // Usar snake_case de editingTimeSlot
      const duration = calculateDuration(editingTimeSlot.start_time, editingTimeSlot.end_time);
      setHours(duration);
      setSelectedSlots(editingTimeSlot.total_slots); // Usar snake_case
      setDescription(editingTimeSlot.description || "");
      
      // CORREÇÃO: Carregar allowed_military_types (snake_case) do editingTimeSlot
      // O fallback `|| []` em TimeSlotsList garante que `allowed_military_types` seja um array.
      if (editingTimeSlot.allowed_military_types && editingTimeSlot.allowed_military_types.length > 0) {
        setAllowedMilitaryTypesInternal(editingTimeSlot.allowed_military_types);
      } else {
        // Se vazio no DB, mostrar todos selecionados como padrão ou nenhum, conforme regra de negócio.
        // Aqui, mantemos o comportamento de mostrar todos se estiver vazio no DB.
        // Se quiser que mostre nenhum selecionado se vier vazio do DB, use: setAllowedMilitaryTypesInternal([]);
        setAllowedMilitaryTypesInternal(["Operacional", "Administrativo", "Inteligencia"]);
      }

      if (!slotOptions.includes(editingTimeSlot.total_slots)) {
        setShowCustomSlots(true);
        setCustomSlots(editingTimeSlot.total_slots.toString());
      } else {
        setShowCustomSlots(false);
      }
      // `isWeekly` não está na interface TimeSlotFromList, precisa ser adicionado se usado.
      // setUseWeeklyLogic(editingTimeSlot.isWeekly || false); 
      setUseWeeklyLogic(false); // Resetando para o comportamento atual
    } else {
      // Reset para novo slot
      setStartTime("07:00");
      setHours("6");
      setSelectedSlots(2);
      setShowCustomSlots(false);
      setCustomSlots("");
      setDescription("");
      setAllowedMilitaryTypesInternal(["Operacional", "Administrativo", "Inteligencia"]);
      setUseWeeklyLogic(false);
    }
  }, [editingTimeSlot, open]);

  const handleMilitaryTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setAllowedMilitaryTypesInternal(prev => [...prev, typeId]);
    } else {
      setAllowedMilitaryTypesInternal(prev => prev.filter(type => type !== typeId));
    }
  };

  const handleRegister = () => {
    const slotsValue = showCustomSlots ? parseInt(customSlots) : selectedSlots;
    const endTimeValue = calculateEndTime(startTime, hours);
    
    // Objeto com a estrutura esperada pelo Firebase / TimeSlotsList (snake_case)
    const timeSlotData = {
      date: format(selectedDate, "yyyy-MM-dd"), // Garante formato string
      start_time: startTime,
      end_time: endTimeValue,
      total_slots: slotsValue,
      description: description.trim(),
      // Aqui usamos o estado interno que foi atualizado pelos checkboxes
      allowed_military_types: allowedMilitaryTypesInternal, 
      // isWeekly: useWeeklyLogic, // Adicionar se 'isWeekly' for usado no DB e na interface TimeSlotFromList
    };
    
    if (editingTimeSlot) {
      const updatedSlot = {
        ...timeSlotData,
        id: editingTimeSlot.id, // Manter o ID
        slots_used: editingTimeSlot.slots_used, // Manter slots_used
        volunteers: editingTimeSlot.volunteers, // Manter voluntários
        // isWeekly: useWeeklyLogic, // Se for editável
      };
      onEditTimeSlot(updatedSlot as any); // Cast para any ou tipo mais preciso se necessário
    } else {
      const newSlot = {
        ...timeSlotData,
        slots_used: 0, // Novo slot começa com 0
        volunteers: [], // Novo slot começa sem voluntários
        isWeekly: useWeeklyLogic, // Aplicar lógica semanal para novos slots
      };
      onAddTimeSlot(newSlot as any);
    }
    onOpenChange(false);
  };

  const isButtonDisabled = () => {
    if (showCustomSlots) {
      const numSlots = parseInt(customSlots);
      if (isNaN(numSlots) || numSlots <= 0) return true;
    }
    const hoursValue = parseFloat(hours);
    if (isNaN(hoursValue) || hoursValue <= 0) return true;
    
    // Garante que pelo menos um tipo de militar seja selecionado
    if (allowedMilitaryTypesInternal.length === 0) return true;
    
    return isLoading;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/* ... (Header não modificado) ... */}
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

        <div className="space-y-5 py-2">
          {/* Horário de início e duração */}
          <div className="space-y-2">
             {/* ... (Inputs de horário não modificados) ... */}
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="h-4 w-4 text-green-500" />
              Horário
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Início</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-center"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Duração (horas)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="text-center"
                  placeholder="6"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Fim: {calculateEndTime(startTime, hours)}
            </div>
          </div>

          {/* Número de vagas */}
          <div className="space-y-2">
            {/* ... (Inputs de vagas não modificados) ... */}
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4 text-green-500" />
              Número de vagas
            </Label>
            <div className="flex flex-wrap gap-2">
              {slotOptions.map((slots) => (
                <Button
                  key={slots}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 min-w-10 h-10 border-gray-200",
                    selectedSlots === slots && !showCustomSlots && "bg-green-500 text-white hover:bg-green-600 border-green-500"
                  )}
                  onClick={() => {
                    setSelectedSlots(slots);
                    setShowCustomSlots(false);
                  }}
                  disabled={isLoading}
                >
                  {slots}
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
                />
              </div>
            )}
          </div>

          {/* Tipos de militares permitidos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4 text-green-500" />
              Tipos de militares permitidos
            </Label>
            <div className="space-y-2">
              {militaryTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    // Usa o estado interno 'allowedMilitaryTypesInternal'
                    checked={allowedMilitaryTypesInternal.includes(type.id)}
                    onCheckedChange={(checked) => handleMilitaryTypeChange(type.id, checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={type.id}
                    className="text-sm font-normal text-gray-700 cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
            {/* Validação para garantir que pelo menos um tipo seja selecionado */}
            {allowedMilitaryTypesInternal.length === 0 && (
              <p className="text-xs text-red-500">
                Selecione pelo menos um tipo de militar.
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            {/* ... (Input de descrição não modificado) ... */}
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4 text-green-500" />
              Descrição (opcional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
              placeholder="Ex: Consulta de rotina, retorno, etc."
              disabled={isLoading}
            />
          </div>

          {/* Opção para criar horários semanais */}
          {!editingTimeSlot && (
            <div className="flex items-center justify-between gap-2 pt-2 pb-1">
              {/* ... (Switch não modificado) ... */}
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-500" />
                <Label className="text-sm font-medium text-gray-700">
                  Aplicar para toda a semana
                </Label>
              </div>
              <Switch
                checked={useWeeklyLogic}
                onCheckedChange={setUseWeeklyLogic}
                className={cn(
                  "data-[state=checked]:bg-green-500",
                  "data-[state=checked]:hover:bg-green-600"
                )}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
          {/* ... (Botões do footer não modificados, mas 'isButtonDisabled' foi ajustado) ... */}
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

// --- END OF FILE TimeSlotDialog (3).tsx ---
