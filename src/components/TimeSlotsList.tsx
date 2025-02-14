import React, { useState, useEffect } from "react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { dataOperations } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRoundCog, CalendarDays, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";

// Definição da interface TimeSlot
// TimeSlot representa a estrutura de dados para um único horário de voluntariado.
interface TimeSlot {
  id?: string; // Identificador único do horário (opcional, pode ser gerado pelo Firebase)
  date: string; // Data do horário (formato ISO string)
  start_time: string; // Hora de início (formato string HH:MM)
  end_time: string; // Hora de fim (formato string HH:MM)
  total_slots: number; // Número total de vagas disponíveis para este horário
  slots_used: number; // Número de vagas já preenchidas
  volunteers?: string[]; // Lista de nomes dos voluntários inscritos neste horário (opcional)
}

// Definição da interface GroupedTimeSlots
// GroupedTimeSlots define a estrutura para agrupar TimeSlots por data.
interface GroupedTimeSlots {
  [key: string]: TimeSlot[]; // Um objeto onde a chave é a data (string) e o valor é um array de TimeSlot para essa data.
}

// Componente TimeSlotLimitControl
// TimeSlotLimitControl gerencia e exibe o controle do limite de horários por usuário.
const TimeSlotLimitControl = ({
  slotLimit, // Limite atual de horários por usuário (numérico)
  onUpdateLimit, // Função callback para atualizar o limite de horários (função)
  userSlotCount = 0, // Contagem de horários já preenchidos pelo usuário atual (numérico, padrão 0)
  isAdmin = false // Booleano para indicar se o usuário é administrador (booleano, padrão false)
}) => {
  // Estado para controlar a visibilidade do input de limite personalizado (para admins)
  const [showCustomInput, setShowCustomInput] = useState(false);
  // Estado para armazenar o valor do limite personalizado digitado pelo admin
  const [customLimit, setCustomLimit] = useState("");

  // Limites de horários predefinidos para seleção rápida pelo administrador
  const predefinedLimits = [1, 2, 3, 4];

  // Função para lidar com a submissão do limite personalizado
  const handleCustomLimitSubmit = () => {
    const limit = parseInt(customLimit); // Converte o valor do input para um número inteiro
    // Verifica se o limite é um número válido e maior que zero
    if (!isNaN(limit) && limit > 0) {
      onUpdateLimit(limit); // Chama a função onUpdateLimit para atualizar o limite global
      setShowCustomInput(false); // Fecha o dialog de input personalizado
      setCustomLimit(""); // Limpa o input de limite personalizado
    }
  };

  // Renderização do componente TimeSlotLimitControl
  return (
    <div className="w-full space-y-4">
      {/* Renderização condicional para usuários não administradores */}
      {!isAdmin && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              {/* Mensagem condicional baseada no limite de horários do usuário */}
              {userSlotCount >= slotLimit ? (
                <p className="text-orange-600 font-medium">Horários esgotados</p>
              ) : (
                <p className="text-gray-700">
                  Escolha {slotLimit - userSlotCount} {slotLimit - userSlotCount === 1 ? 'horário' : 'horários'}
                </p>
              )}
              {/* Exibe a contagem de horários preenchidos em relação ao limite */}
              <p className="text-sm text-gray-500">
                {userSlotCount} de {slotLimit} horários preenchidos
              </p>
            </div>
            {/* Indicador visual de quantos horários o usuário já preencheu */}
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-medium">{userSlotCount}/{slotLimit}</span>
            </div>
          </div>
        </div>
      )}

      {/* Renderização condicional para usuários administradores */}
      {isAdmin && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="space-y-4">
            {/* Título da seção de controle de limite para administradores */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Limite de horários por usuário</h3>
              <UserRoundCog className="h-5 w-5 text-gray-500" />
            </div>

            {/* Botões para selecionar limites predefinidos ou inserir um personalizado */}
            <div className="flex gap-2">
              {/* Mapeia os limites predefinidos para criar botões */}
              {predefinedLimits.map((limit) => (
                <Button
                  key={limit}
                  onClick={() => onUpdateLimit(limit)} // Ao clicar, atualiza o limite para o valor predefinido
                  variant={slotLimit === limit ? "default" : "outline"} // Botão "default" se for o limite atual, "outline" caso contrário
                  className="flex-1"
                >
                  {limit}
                </Button>
              ))}
              {/* Botão para abrir o dialog de input de limite personalizado */}
              <Button
                onClick={() => setShowCustomInput(true)} // Ao clicar, exibe o dialog de input personalizado
                variant="outline"
                className="flex-1"
              >
                +
              </Button>
            </div>
          </div>

          {/* Dialog para inserir limite personalizado (aparece quando admin clica no botão "+") */}
          <Dialog open={showCustomInput} onOpenChange={setShowCustomInput}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Definir limite personalizado</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  {/* Input de número para o admin digitar o limite personalizado */}
                  <Input
                    type="number"
                    min="1"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(e.target.value)} // Atualiza o estado customLimit conforme o admin digita
                    placeholder="Digite o limite de horários"
                  />
                </div>
                {/* Botões de "Cancelar" e "Confirmar" no dialog */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomInput(false)} // Fecha o dialog ao clicar em "Cancelar"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCustomLimitSubmit}> {/* Chama a função handleCustomLimitSubmit ao clicar em "Confirmar" */}
                    Confirmar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

// Função getMilitaryRankWeight
// Retorna um peso numérico para cada patente militar para fins de ordenação.
const getMilitaryRankWeight = (rank: string): number => {
  // Objeto que mapeia patentes militares para seus respectivos pesos
  const rankWeights: { [key: string]: number } = {
    "Cel": 12,
    "Cel PM": 12,
    "Ten Cel": 11,
    "Ten Cel PM": 11,
    "Maj": 10,
    "Maj PM": 10,
    "Cap": 9,
    "Cap PM": 9,
    "1° Ten": 8,
    "1° Ten PM": 8,
    "2° Ten": 7,
    "2° Ten PM": 7,
    "Sub Ten": 6,
    "Sub Ten PM": 6,
    "1° Sgt": 5,
    "1° Sgt PM": 5,
    "2° Sgt": 4,
    "2° Sgt PM": 4,
    "3° Sgt": 3,
    "3° Sgt PM": 3,
    "Cb": 2,
    "Cb PM": 2,
    "Sd": 1,
    "Sd PM": 1,
    "Estágio": 0,
  };
  return rankWeights[rank] || 0; // Retorna o peso da patente, ou 0 se a patente não for encontrada
};

// Componente TimeSlotsList
// TimeSlotsList exibe a lista de horários disponíveis e lida com ações de voluntariado.
const TimeSlotsList = () => {
  // Estado para armazenar a lista de horários (inicialmente vazia)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  // Estado para indicar se os horários estão sendo carregados (para exibir um loading)
  const [isLoading, setIsLoading] = useState(false);
  // Estado para armazenar o limite de horários por usuário (obtido das configurações)
  const [slotLimit, setSlotLimit] = useState<number>(0);
  // Hook useToast para exibir mensagens de notificação (sucesso, erro, etc.)
  const { toast } = useToast();

  // Recupera os dados do usuário do localStorage
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  // Obtém o nome do voluntário a partir dos dados do usuário (se disponíveis)
  const volunteerName = userData ? `${userData.rank} ${userData.warName}` : '';
  // Verifica se o usuário é administrador com base no userType
  const isAdmin = userData?.userType === 'admin';

  // Função calculateTimeDifference
  // Calcula a diferença de tempo entre a hora de início e fim e retorna como string formatada.
  const calculateTimeDifference = (startTime: string, endTime: string): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number); // Separa hora e minuto da startTime
    let [endHour, endMinute] = endTime.split(':').map(Number); // Separa hora e minuto da endTime

    // Ajuste para horários que passam da meia-noite (ex: 22:00 às 02:00)
    if (endHour < startHour || (endHour === 0 && startHour > 0)) {
      endHour += 24; // Adiciona 24 horas à hora de fim se passar da meia-noite
    }

    let diffHours = endHour - startHour; // Calcula a diferença em horas
    let diffMinutes = endMinute - startMinute; // Calcula a diferença em minutos

    // Ajuste caso a diferença de minutos seja negativa (ex: 08:50 às 09:10)
    if (diffMinutes < 0) {
      diffHours -= 1; // Decrementa uma hora
      diffMinutes += 60; // Adiciona 60 minutos
    }

    const hourText = diffHours > 0 ? `${diffHours}h` : ''; // Formata horas como texto (ex: "2h")
    const minText = diffMinutes > 0 ? `${diffMinutes}min` : ''; // Formata minutos como texto (ex: "30min")

    return `${hourText}${minText}`.trim(); // Retorna a diferença formatada (ex: "2h 30min")
  };

  // useEffect para buscar dados de horários e limite de slots ao montar o componente
  useEffect(() => {
    // Função interna fetchSlotLimit para buscar o limite de slots do Firebase
    const fetchSlotLimit = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'slotLimit')); // Busca o documento 'slotLimit' na coleção 'settings'
        if (settingsDoc.exists()) {
          setSlotLimit(settingsDoc.data().value || 0); // Define o limite de slots com o valor do documento ou 0 se não existir
        }
      } catch (error) {
        console.error('Erro ao buscar limite de slots:', error);
      }
    };

    fetchSlotLimit(); // Chama a função para buscar o limite de slots

    setIsLoading(true); // Define o estado de loading como true enquanto busca os dados
    const timeSlotsCollection = collection(db, 'timeSlots'); // Obtém a coleção 'timeSlots' do Firebase
    const q = query(timeSlotsCollection); // Cria uma query para a coleção (neste caso, todos os documentos)

    // onSnapshot para ouvir em tempo real as alterações na coleção 'timeSlots'
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formattedSlots: TimeSlot[] = snapshot.docs.map(doc => { // Mapeia os documentos retornados pelo snapshot
        const data = doc.data(); // Obtém os dados de cada documento
        return {
          id: doc.id, // Usa o ID do documento como ID do TimeSlot
          date: data.date, // Data do TimeSlot
          start_time: data.start_time, // Hora de início
          end_time: data.end_time, // Hora de fim
          volunteers: data.volunteers || [], // Lista de voluntários (ou array vazio se não existir)
          slots_used: data.slots_used || 0, // Vagas usadas (ou 0 se não existir)
          total_slots: data.total_slots || data.slots || 0, // Vagas totais (ou slots ou 0 se nenhum existir)
        };
      });
      setTimeSlots(formattedSlots); // Atualiza o estado timeSlots com os dados formatados
      setIsLoading(false); // Define o estado de loading como false, pois os dados foram carregados
    }, (error) => {
      console.error('Erro ao ouvir horários:', error);
      toast({ // Exibe uma notificação de erro usando o hook useToast
        title: "Erro ao atualizar horários",
        description: "Não foi possível receber atualizações em tempo real.",
        variant: "destructive"
      });
      setIsLoading(false); // Garante que o loading seja desativado mesmo em caso de erro
    });

    return () => unsubscribe(); // Retorna a função unsubscribe para cancelar o listener ao desmontar o componente
  }, [toast]); // Dependências do useEffect: apenas toast (para reagir a atualizações de toast)

  // Função handleVolunteer
  // Lida com a ação de um usuário se voluntariar para um horário.
  const handleVolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) { // Verifica se o nome do voluntário está disponível
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    // Calcula quantos horários o usuário já está voluntariado
    const userSlotCount = timeSlots.reduce((count, slot) =>
      slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0
    );

    // Verifica se o usuário atingiu o limite de horários (e não é admin)
    if (userSlotCount >= slotLimit && !isAdmin) {
      toast({
        title: "Limite atingido!🚫",
        description: `Você atingiu o limite de ${slotLimit} horário${slotLimit === 1 ? '' : 's'} por usuário.`,
        variant: "destructive"
      });
      return;
    }

    // Verifica se o usuário já está voluntariado em algum horário na mesma data
    const slotsForDate = timeSlots.filter(slot => slot.date === timeSlot.date);
    const isAlreadyRegistered = slotsForDate.some(slot =>
      slot.volunteers?.includes(volunteerName)
    );

    if (isAlreadyRegistered) {
      toast({
        title: "Erro ⛔",
        description: "Você já está registrado em um horário nesta data.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepara os dados atualizados do TimeSlot
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used + 1, // Incrementa o número de vagas usadas
        volunteers: [...(timeSlot.volunteers || []), volunteerName] // Adiciona o nome do voluntário à lista
      };

      // Atualiza o TimeSlot no Firebase usando dataOperations
      const result = await dataOperations.update(
        updatedSlot,
        {
          date: timeSlot.date,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time
        }
      );

      if (!result.success) { // Verifica se a atualização foi bem-sucedida
        throw new Error('Falha ao atualizar o horário');
      }

      toast({ // Exibe notificação de sucesso
        title: "Sucesso!✅🤠",
        description: "Extra marcada. Aguarde a escala."
      });
    } catch (error) {
      console.error('Erro ao voluntariar:', error);
      toast({ // Exibe notificação de erro
        title: "Erro 🤔",
        description: "Não foi possível reservar a Extra.",
        variant: "destructive"
      });
    }
  };

  // Função handleUnvolunteer
  // Lida com a ação de um usuário desmarcar um horário de voluntariado.
  const handleUnvolunteer = async (timeSlot: TimeSlot) => {
    if (!volunteerName) { // Verifica se o nome do voluntário está disponível
      toast({
        title: "Erro 🤔",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepara os dados atualizados do TimeSlot
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used - 1, // Decrementa o número de vagas usadas
        volunteers: (timeSlot.volunteers || []).filter(v => v !== volunteerName) // Remove o nome do voluntário da lista
      };

      // Atualiza o TimeSlot no Firebase usando dataOperations
      const result = await dataOperations.update(
        updatedSlot,
        {
          date: timeSlot.date,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time
        }
      );

      if (!result.success) { // Verifica se a atualização foi bem-sucedida
        throw new Error('Falha ao atualizar o horário');
      }

      toast({ // Exibe notificação de sucesso
        title: "Desmarcado! 👀🤔",
        description: "Extra desmarcada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao desmarcar:', error);
      toast({ // Exibe notificação de erro
        title: "Erro ⛔",
        description: "Não foi possível desmarcar a Extra.",
        variant: "destructive"
      });
    }
  };

  // Função handleUpdateSlotLimit
  // Lida com a atualização do limite global de horários por usuário.
  const handleUpdateSlotLimit = async (limit: number) => {
    if (isNaN(limit) || limit < 0) { // Valida se o limite é um número válido e positivo
      toast({
        title: "Erro 😵‍💫",
        description: "Por favor, insira um número válido.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Atualiza o valor do limite de slots no documento 'slotLimit' em 'settings' no Firebase
      await setDoc(doc(db, 'settings', 'slotLimit'), { value: limit });
      setSlotLimit(limit); // Atualiza o estado local slotLimit
      toast({ // Exibe notificação de sucesso
        title: "Sucesso",
        description: "Limite de horários atualizado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao atualizar limite de slots:', error);
      toast({ // Exibe notificação de erro
        title: "Erro",
        description: "Não foi possível atualizar o limite de horários.",
        variant: "destructive"
      });
    }
  };

  // Função groupTimeSlotsByDate
  // Agrupa os TimeSlots por data, retornando um objeto GroupedTimeSlots.
  const groupTimeSlotsByDate = (slots: TimeSlot[]): GroupedTimeSlots => {
    return slots.reduce((groups: GroupedTimeSlots, slot) => { // Usa reduce para agrupar
      const date = slot.date; // Obtém a data do TimeSlot
      if (!groups[date]) { // Se não existir um grupo para essa data, cria um novo
        groups[date] = [];
      }
      groups[date].push(slot); // Adiciona o TimeSlot ao grupo da data correspondente
      return groups; // Retorna o objeto de grupos atualizado
    }, {});
  };

  // Função isVolunteered
  // Verifica se o usuário atual está voluntariado para um determinado TimeSlot.
  const isVolunteered = (timeSlot: TimeSlot) => {
    return timeSlot.volunteers?.includes(volunteerName); // Retorna true se o nome do voluntário estiver na lista de voluntários do TimeSlot
  };

  // Função isSlotFull
  // Verifica se um TimeSlot está completamente preenchido (sem vagas disponíveis).
  const isSlotFull = (timeSlot: TimeSlot) => {
    return timeSlot.slots_used === timeSlot.total_slots; // Retorna true se o número de vagas usadas for igual ao total de vagas
  };

  // Função formatDateHeader
  // Formata a data para exibição no cabeçalho da seção de cada data.
  const formatDateHeader = (date: string) => {
    return format(parseISO(date), "EEE - dd/MM/yyyy", { locale: ptBR }) // Formata a data para "Dia da semana abreviado - DD/MM/AAAA"
      .replace(/^\w/, (c) => c.toUpperCase()); // Capitaliza a primeira letra do dia da semana
  };

  // Função shouldShowVolunteerButton
  // Determina se o botão de voluntariado deve ser exibido para um TimeSlot específico.
  const shouldShowVolunteerButton = (slot: TimeSlot) => {
    const userDataString = localStorage.getItem('user');
    const userData = userDataString ? JSON.parse(userDataString) : null;

    if (userData?.rank === "Estágio") { // Não exibe o botão para usuários com patente "Estágio"
      return false;
    }

    if (isVolunteered(slot)) { // Exibe o botão se o usuário já estiver voluntariado (para desmarcar)
      return true;
    }

    if (isSlotFull(slot)) { // Exibe o botão se o slot estiver cheio (para indicar que está cheio)
      return true;
    }

    // Calcula quantos horários o usuário já está voluntariado
    const userSlotCount = timeSlots.reduce((count, s) =>
      s.volunteers?.includes(volunteerName) ? count + 1 : count, 0
    );

    if (userSlotCount >= slotLimit && !isAdmin) { // Não exibe se o usuário atingiu o limite e não é admin
      return false;
    }

    // Verifica se o usuário já está voluntariado em algum horário na mesma data
    const slotsForDate = timeSlots.filter(s => s.date === slot.date);
    const isVolunteeredForDate = slotsForDate.some(s =>
      s.volunteers?.includes(volunteerName)
    );

    return !isVolunteeredForDate; // Exibe se o usuário não estiver voluntariado em nenhum horário nessa data
  };

  // Função canVolunteerForSlot
  // Verifica se o usuário pode se voluntariar para um TimeSlot (respeitando o limite).
  const canVolunteerForSlot = (slot: TimeSlot) => {
    if (isAdmin) return true; // Admins sempre podem se voluntariar

    // Calcula quantos horários o usuário já está voluntariado
    const userSlotCount = timeSlots.reduce((count, s) =>
      s.volunteers?.includes(volunteerName) ? count + 1 : count, 0
    );

    return userSlotCount < slotLimit; // Retorna true se o usuário não atingiu o limite de horários
  };

  // Função sortVolunteers
  // Ordena a lista de voluntários com base na patente militar (usando getMilitaryRankWeight).
  const sortVolunteers = (volunteers: string[]) => {
    if (!volunteers) return []; // Retorna array vazio se a lista de voluntários for nula/vazia

    return volunteers.sort((a, b) => { // Ordena usando a função de comparação
      const rankA = a.split(" ")[0]; // Extrai a patente do nome do voluntário A
      const rankB = b.split(" ")[0]; // Extrai a patente do nome do voluntário B
      return getMilitaryRankWeight(rankB) - getMilitaryRankWeight(rankA); // Ordena por peso da patente (maior patente primeiro)
    });
  };

  // Agrupa os TimeSlots por data usando a função groupTimeSlotsByDate
  const groupedTimeSlots = groupTimeSlotsByDate(timeSlots);

  // Calcula o total de horários que o usuário está voluntariado
  const userSlotCount = timeSlots.reduce((count, slot) =>
    slot.volunteers?.includes(volunteerName) ? count + 1 : count, 0
  );

  // Estado para gerenciar qual voluntário está sendo removido (para o AlertDialog de confirmação)
  const [volunteerToRemove, setVolunteerToRemove] = useState<{ name: string; timeSlot: TimeSlot } | null>(null);

  // Função handleRemoveVolunteer
  // Lida com a remoção de um voluntário de um TimeSlot (ação administrativa).
  const handleRemoveVolunteer = async (timeSlot: TimeSlot, volunteerName: string) => {
    try {
      // Prepara os dados atualizados do TimeSlot
      const updatedSlot = {
        ...timeSlot,
        slots_used: timeSlot.slots_used - 1, // Decrementa o número de vagas usadas
        volunteers: (timeSlot.volunteers || []).filter(v => v !== volunteerName) // Remove o voluntário da lista
      };

      // Atualiza o TimeSlot no Firebase usando dataOperations
      const result = await dataOperations.update(
        updatedSlot,
        {
          date: timeSlot.date,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time
        }
      );

      if (!result.success) { // Verifica se a atualização foi bem-sucedida
        throw new Error('Falha ao remover voluntário');
      }

      toast({ // Exibe notificação de sucesso
        title: "Sucesso! ✅",
        description: `${volunteerName} foi removido deste horário.`
      });
    } catch (error) {
      console.error('Erro ao remover voluntário:', error);
      toast({ // Exibe notificação de erro
        title: "Erro ⛔",
        description: "Não foi possível remover o voluntário.",
        variant: "destructive"
      });
    }
  };

  // Renderiza uma mensagem de loading enquanto os horários estão sendo carregados
  if (isLoading) {
    return <div className="p-4">Carregando horários...</div>;
  }

  // Renderização principal do componente TimeSlotsList
  return (
    <div className="space-y-6 p-4">
      {/* Componente TimeSlotLimitControl para gerenciar o limite de horários */}
      <TimeSlotLimitControl
        slotLimit={slotLimit}
        onUpdateLimit={handleUpdateSlotLimit}
        userSlotCount={userSlotCount}
        isAdmin={isAdmin}
      />

      {/* Mapeia as datas agrupadas para renderizar cada seção de data */}
      {Object.entries(groupedTimeSlots).sort().map(([date, slots]) => {
        const isDatePast = isPast(parseISO(date)); // Verifica se a data já passou
        const isCollapsed = isDatePast; // Define se a seção de data deve estar colapsada (datas passadas sempre colapsadas)

        // Ordena os horários dentro de cada data por hora de início (do menor para o maior)
        const sortedSlots = [...slots].sort((a, b) => {
          const timeA = a.start_time;
          const timeB = b.start_time;
          return timeA.localeCompare(timeB); // Compara as strings de hora lexicograficamente
        });

        return (
          <div key={date} className="bg-white rounded-lg shadow-sm">
            <div className="p-4 md:p-5">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    {/* Ícone de calendário (cor cinza para datas passadas, azul para futuras) */}
                    <CalendarDays className={`h-5 w-5 ${isDatePast ? 'text-gray-500' : 'text-blue-500'}`} />
                    {/* Cabeçalho da data formatado */}
                    <h3 className="font-medium text-lg text-gray-800">
                      {formatDateHeader(date)}
                    </h3>
                  </div>
                  {/* Badge "Extra Encerrada" para datas passadas, "Extra" para datas futuras */}
                  <Badge variant={isDatePast ? "outline" : "secondary"} className={`${isDatePast ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                    {isDatePast ? "Extra Encerrada" : "Extra"}
                  </Badge>
                </div>
              </div>

              {/* Renderiza os horários SOMENTE se a data NÃO estiver colapsada (ou seja, não for data passada) */}
              {!isCollapsed && (
                <div className="space-y-3 mt-4">
                  {/* Mapeia os horários ordenados para renderizar cada item de horário */}
                  {sortedSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`border rounded-lg p-4 space-y-2 transition-all ${isSlotFull(slot) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {/* Ícone de relógio */}
                            <Clock className="h-4 w-4 text-blue-500" />
                            {/* Exibe o horário de início e fim e a duração calculada */}
                            <p className="font-medium text-gray-900">
                              {slot.start_time?.slice(0, 5)} às {slot.end_time?.slice(0, 5)} - {calculateTimeDifference(slot.start_time, slot.end_time)}
                            </p>
                          </div>
                          {/* Badge indicando a disponibilidade de vagas */}
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${isSlotFull(slot) ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            <span className="text-sm font-medium">
                              {isSlotFull(slot)
                                ? 'Vagas Esgotadas'
                                : `${slot.total_slots - slot.slots_used} ${slot.total_slots - slot.slots_used === 1 ? 'vaga disponível' : 'vagas disponíveis'}`
                              }
                            </span>
                          </div>
                        </div>
                        {/* Renderiza os botões de "Voluntário" ou "Desmarcar" condicionalmente */}
                        {shouldShowVolunteerButton(slot) && (
                          isVolunteered(slot) ? (
                            <Button
                              onClick={() => handleUnvolunteer(slot)} // Botão "Desmarcar" se já estiver voluntariado
                              variant="destructive"
                              size="sm"
                              className="shadow-sm hover:shadow"
                            >
                              Desmarcar
                            </Button>
                          ) : !isSlotFull(slot) && canVolunteerForSlot(slot) && (
                            <Button
                              onClick={() => handleVolunteer(slot)} // Botão "Voluntário" se puder se voluntariar e o slot não estiver cheio
                              className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow"
                              size="sm"
                            >
                              Voluntário
                            </Button>
                          )
                        )}
                      </div>
                      {/* Renderiza a lista de voluntários se houver */}
                      {slot.volunteers && slot.volunteers.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium mb-2 text-gray-700">Voluntários:</p>
                          <div className="space-y-1">
                            {/* Mapeia a lista de voluntários ordenados para exibir cada nome */}
                            {sortVolunteers(slot.volunteers).map((volunteer, index) => (
                              <div key={index} className="text-sm text-gray-600 pl-2 border-l-2 border-gray-300 flex justify-between items-center">
                                <span>{volunteer}</span>
                                {/* Botão "X" (apenas para admins) para remover um voluntário */}
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500"
                                    onClick={() => setVolunteerToRemove({ name: volunteer, timeSlot: slot })} // Ao clicar, prepara para remover o voluntário
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* AlertDialog para confirmação de remoção de voluntário (ação administrativa) */}
      <AlertDialog
        open={!!volunteerToRemove} // Abre o dialog se volunteerToRemove tiver um valor (ou seja, se um voluntário estiver sendo removido)
        onOpenChange={() => setVolunteerToRemove(null)} // Limpa volunteerToRemove ao fechar o dialog
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover voluntário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {volunteerToRemove?.name} deste horário?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (volunteerToRemove) {
                  handleRemoveVolunteer(volunteerToRemove.timeSlot, volunteerToRemove.name); // Chama a função para remover o voluntário
                  setVolunteerToRemove(null); // Limpa volunteerToRemove após a ação
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeSlotsList;
