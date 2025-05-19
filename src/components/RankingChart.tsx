import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { ChartContainer } from "./ui/chart"; // Seu ChartContainer
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer, // Importar ResponsiveContainer
  LabelList,          // Importar LabelList
} from "recharts";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const RankingChart = () => {
  const [rankingType, setRankingType] = useState<"allowances" | "trips">("allowances");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRankingData = async () => {
      setLoading(true);
      try {
        const travelsRef = collection(db, "travels");
        const q = query(travelsRef, orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);

        const userAllowancesMap = new Map<string, number>();
        const userTripsMap = new Map<string, number>();

        querySnapshot.forEach((doc) => {
          const travelData = doc.data();
          if (travelData.volunteers && Array.isArray(travelData.volunteers)) {
            travelData.volunteers.forEach((volunteerData: any) => {
              let volunteerName: string | undefined;

              if (typeof volunteerData === 'string') {
                volunteerName = volunteerData;
              } else if (volunteerData && typeof volunteerData.name === 'string') {
                volunteerName = volunteerData.name;
              } else if (volunteerData && typeof volunteerData.nome === 'string') {
                volunteerName = volunteerData.nome;
              }
              // Adicione mais 'else if' se a estrutura dos seus dados for outra

              if (volunteerName && volunteerName.trim() !== "") {
                const startDate = new Date(travelData.startDate);
                const endDate = new Date(travelData.endDate);

                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
                  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
                  const currentAllowances = userAllowancesMap.get(volunteerName) || 0;
                  userAllowancesMap.set(volunteerName, currentAllowances + days);
                }

                const currentTrips = userTripsMap.get(volunteerName) || 0;
                userTripsMap.set(volunteerName, currentTrips + 1);
              }
            });
          }
        });

        let processedChartData: any[];

        if (rankingType === "allowances") {
          processedChartData = Array.from(userAllowancesMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        } else {
          processedChartData = Array.from(userTripsMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        }

        // Filtra nomes vazios ou undefined
        processedChartData = processedChartData.filter(item => item.name && item.name.trim() !== "" && item.value > 0);

        setData(processedChartData);
      } catch (error) {
        console.error("Error fetching ranking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [rankingType]);

  // Calcular uma altura dinâmica para o gráfico se houver muitos itens,
  // ou definir uma altura fixa grande e permitir rolagem no CardContent.
  // Por exemplo, 30px por item + margens.
  const chartHeight = Math.max(300, data.length * 35 + 60); // Mínimo 300px, aumenta com itens

  return (
    <Card className="shadow-md w-full"> {/* Garante que o Card ocupe a largura disponível */}
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Ranking</h2>
          <Tabs value={rankingType} onValueChange={(value) => setRankingType(value as "allowances" | "trips")} className="w-auto">
            <TabsList>
              <TabsTrigger value="allowances">Diárias</TabsTrigger>
              <TabsTrigger value="trips">Viagens</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      {/* Adicionar overflow-y-auto se o conteúdo do card puder exceder a altura da tela */}
      <CardContent className="p-6 overflow-y-auto" style={{ maxHeight: '80vh' }}> {/* Limita altura e permite scroll */}
        {loading ? (
          <div className="flex justify-center items-center" style={{ height: chartHeight }}>
            <span className="text-gray-500">Carregando dados...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center" style={{ height: chartHeight }}>
            <span className="text-gray-500">Nenhum dado para exibir no ranking.</span>
          </div>
        ) : (
          // Seu ChartContainer precisa permitir que ResponsiveContainer funcione.
          // Idealmente, ChartContainer seria apenas um div com `width: 100%` e uma altura definida.
          // Vou assumir que seu ChartContainer funciona como um wrapper simples.
          // Se ChartContainer já for o ResponsiveContainer, ajuste.
          <div style={{ width: '100%', height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{
                  top: 20, // Espaço para títulos/etc.
                  right: 50, // Espaço para os labels das barras
                  left: 10,  // Espaço para o início do YAxis
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name" // Nome do viajante aqui
                  width={150}    // Largura para o eixo Y (ajuste conforme o tamanho dos nomes)
                  tick={{ fontSize: 12, fill: '#333' }}
                  interval={0} // Mostrar todos os ticks (nomes)
                />
                <Tooltip
                  formatter={(value: number, name, props) => {
                    return [
                      `${value} ${rankingType === "allowances" ? "diárias" : "viagens"}`,
                      `Viajante: ${props.payload.name}` // Nome do viajante no tooltip
                    ];
                  }}
                  cursor={{ fill: 'rgba(200, 200, 200, 0.3)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar
                  dataKey="value" // Diárias ou Viagens
                  fill={rankingType === "allowances" ? "#4f46e5" : "#10b981"}
                  radius={[0, 4, 4, 0]}
                  // barSize={20} // Pode ser dinâmico ou removido para auto-ajuste
                >
                  <LabelList
                    dataKey="value" // O valor a ser exibido
                    position="right"  // Posição do label (à direita da barra)
                    offset={5}        // Pequeno deslocamento da ponta da barra
                    style={{ fill: '#333', fontSize: 12 }} // Estilo do label
                    formatter={(value: number) => `${value}`} // Formata para mostrar apenas o número
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingChart;
