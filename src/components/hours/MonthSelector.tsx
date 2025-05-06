// Exemplo de como usar em src/components/hours/UserSelector.tsx (ou similar)
// ---------- EXEMPLO DE USO - Adapte à sua estrutura ----------

import React, { useState, useEffect } from 'react';
import { MonthSelector } from './MonthSelector'; // Ajuste o caminho
import { UserHoursDisplay } from './UserHoursDisplay'; // Ajuste o caminho
import { HoursData } from '@/types/hours'; // Ajuste o caminho
import { User } from '@/types/user'; // Supondo que você tenha um tipo User
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"; // Exemplo usando Sheet

// Definição dos meses (IMPORTANTE ter acesso aqui também)
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
const getCurrentMonthValue = () => {
    const monthIndex = new Date().getMonth(); // 0 = Janeiro, 11 = Dezembro
    return months[monthIndex]?.value || months[0].value; // Retorna o valor ou o primeiro mês
}

export const UserSelector = () => { // Nome hipotético do componente pai
  const [selectedMonthValue, setSelectedMonthValue] = useState<string>(getCurrentMonthValue());
  const [usersDataForMonth, setUsersDataForMonth] = useState<HoursData[]>([]); // Dados de TODOS os usuários para o mês
  const [selectedUserData, setSelectedUserData] = useState<HoursData | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Efeito para buscar dados quando o mês muda
  useEffect(() => {
    const fetchDataForMonth = async (month: string) => {
      setIsLoadingData(true);
      console.log(`Buscando dados para o mês: ${month}`);
      // --- SUBSTITUA PELA SUA LÓGICA REAL DE BUSCA DE DADOS ---
      // Exemplo:
      // const data = await yourApi.getHoursData(month);
      // setUsersDataForMonth(data);
      // Simulando uma busca:
      await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay
      // Dados fictícios para exemplo - você buscará isso do Firebase/API
      const dummyData: HoursData[] = [
         { Matricula: '12345', Nome: 'Fulano de Tal', "Total Geral": "40,5", "Horas 25° BPM": "01/05:8h | 03/05:8h", Saiop: "10/05/8h", Sinfra: "15/05/8h|20/05/8.5h"},
         { Matricula: '67890', Nome: 'Ciclana Souza', "Total Geral": "32", "Horas 25° BPM": "", Saiop: "02/05:8h|09/05:8h|16/05:8h|23/05:8h", Sinfra: "" },
      ];
      setUsersDataForMonth(dummyData);
      // --- FIM DA LÓGICA DE BUSCA ---
      setIsLoadingData(false);
      setSelectedUserData(null); // Limpa seleção anterior ao mudar mês
      setShowDetailsSheet(false); // Fecha a sheet ao mudar mês
    };

    fetchDataForMonth(selectedMonthValue);
  }, [selectedMonthValue]); // Dependência: selectedMonthValue

  const handleMonthChange = (newValue: string) => {
    setSelectedMonthValue(newValue);
  };

  // Função para encontrar o LABEL do mês baseado no VALUE
  const getMonthLabel = (value: string): string => {
    const month = months.find(m => m.value === value);
    return month ? month.label : value; // Retorna o label ou o value como fallback
  };

  // Função chamada quando um usuário é selecionado na sua UI (ex: clique numa linha da tabela)
  const handleUserSelect = (userData: HoursData) => {
    setSelectedUserData(userData);
    setShowDetailsSheet(true); // Abre a sheet/modal
  };

  const handleCloseDetails = () => {
    setShowDetailsSheet(false);
    // Não precisa limpar selectedUserData aqui, pois a Sheet só será renderizada se showDetailsSheet=true
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Consulta de Horas</h1>
      <div className="max-w-xs"> {/* Limita largura do seletor */}
          <MonthSelector
            value={selectedMonthValue}
            onChange={handleMonthChange}
          />
      </div>


      {/* --- Sua UI para listar os usuários (Tabela, Lista, etc.) --- */}
      {isLoadingData ? (
        <p>Carregando dados para {getMonthLabel(selectedMonthValue)}...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrícula</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Horas</th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Ver Detalhes</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {usersDataForMonth.map((user) => (
                        <tr key={user.Matricula} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.Nome}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.Matricula}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user["Total Geral"]?.replace('.',',')}h</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button variant="link" size="sm" onClick={() => handleUserSelect(user)}>
                                    Ver Detalhes
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {usersDataForMonth.length === 0 && (
                        <tr>
                           <td colSpan={4} className="text-center py-4 text-sm text-gray-500">Nenhum dado encontrado para {getMonthLabel(selectedMonthValue)}.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      )}
      {/* --- Fim da UI de listagem --- */}


      {/* Sheet (ou Modal) para exibir os detalhes */}
      <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg"> {/* Ajuste largura e overflow */}
          <SheetHeader>
            <SheetTitle>Detalhes das Horas</SheetTitle>
            <SheetDescription>
                Visualização detalhada das horas trabalhadas.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
             {/* Renderiza UserHoursDisplay APENAS se houver dados */}
             {selectedUserData && (
               <UserHoursDisplay
                 data={selectedUserData} // Passa os dados do usuário selecionado
                 onClose={handleCloseDetails}
                 monthName={getMonthLabel(selectedMonthValue)} // <<< PASSA O LABEL DO MÊS AQUI
               />
             )}
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
};

// Não se esqueça de exportar o componente se necessário
// export default UserSelector;
