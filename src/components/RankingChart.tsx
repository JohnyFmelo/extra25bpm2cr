import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { ChartContainer } from "./ui/chart";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
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
              } else if (volunteerData && typeof volunteerData.nome === 'string') { // Exemplo alternativo
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
                } else {
                  // console.warn(`Datas inválidas para a viagem ${doc.id} do voluntário ${volunteerName}`);
                }

                const currentTrips = userTripsMap.get(volunteerName) || 0;
                userTripsMap.set(volunteerName, currentTrips + 1);
              } else {
                // console.warn("Voluntário sem nome ou com nome inválido encontrado na viagem:", doc.id, "Dados:", volunteerData);
              }
            });
          }
        });

        let chartData: any[];

        if (rankingType === "allowances") {
          chartData = Array.from(userAllowancesMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // REMOVIDO .slice(0, 10)
            // Se quiser manter uma ordenação, mas exibir todos, mantenha o .sort()
            // Se não precisar de ordenação específica e quiser todos, pode remover o .sort() também,
            // mas geralmente é bom ter uma ordenação (por valor ou por nome).
        } else { // rankingType === "trips"
          chartData = Array.from(userTripsMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // REMOVIDO .slice(0, 10)
        }

        // Filtra nomes vazios ou undefined caso ainda existam por algum motivo
        chartData = chartData.filter(item => item.name && item.name.trim() !== "");

        setData(chartData);
      } catch (error)
{
        console.error("Error fetching ranking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [rankingType]);

  return (
    <Card className="shadow-md">
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
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-96"> {/* Aumentei altura para loading/sem dados */}
            <span className="text-gray-500">Carregando dados...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <span className="text-gray-500">Nenhum dado para exibir no ranking.</span>
          </div>
        ) : (
          // Se houver muitos dados, o ChartContainer pode precisar de uma altura maior
          // ou você pode querer adicionar uma rolagem ao CardContent.
          <ChartContainer className="h-[600px]" config={{}}> {/* Aumentei altura para mais dados */}
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 10,
                right: 30,
                left: 150, // Aumentei ainda mais para nomes potencialmente longos
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: '#333' }} // Diminuí um pouco a fonte se houver muitos nomes
                width={140} // Ajuste conforme necessário
                interval={0} // Tenta mostrar todos os ticks
              />
              <Tooltip
                formatter={(value: number, name, props) => {
                  return [
                    `${value} ${rankingType === "allowances" ? "diárias" : "viagens"}`,
                    `Viajante: ${props.payload.name}`
                  ];
                }}
                cursor={{ fill: 'rgba(200, 200, 200, 0.3)' }}
              />
              <Bar
                dataKey="value"
                fill={rankingType === "allowances" ? "#4f46e5" : "#10b981"}
                radius={[0, 4, 4, 0]}
                barSize={15} // Pode diminuir o tamanho da barra se houver muitas
                name={rankingType === "allowances" ? "Total de Diárias" : "Total de Viagens"}
              />
              <Legend formatter={(value) => <span style={{ color: '#333' }}>{value}</span>} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingChart;
