import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { ChartContainer } from "./ui/chart";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { collection, query, getDocs, orderBy } from "firebase/firestore"; // Removido 'limit' se não for usado para buscar TODOS os dados para o ranking
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
        // Se você quiser o ranking com base em TODOS os dados, remova o 'limit'.
        // Se for intencional pegar apenas as viagens mais recentes para o ranking, mantenha ou ajuste o limit.
        const q = query(travelsRef, orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);

        const userAllowancesMap = new Map<string, number>();
        const userTripsMap = new Map<string, number>();

        querySnapshot.forEach((doc) => {
          const travelData = doc.data();
          if (travelData.volunteers && Array.isArray(travelData.volunteers)) {
            travelData.volunteers.forEach((volunteerData: any) => {
              let volunteerName: string | undefined;

              // *** AJUSTE PRINCIPAL AQUI ***
              // Tente determinar o nome do voluntário.
              // Cenário 1: volunteerData é uma string (o próprio nome)
              if (typeof volunteerData === 'string') {
                volunteerName = volunteerData;
              }
              // Cenário 2: volunteerData é um objeto com uma propriedade 'name'
              else if (volunteerData && typeof volunteerData.name === 'string') {
                volunteerName = volunteerData.name;
              }
              // Cenário 3: volunteerData é um objeto com uma propriedade 'nome' (exemplo alternativo)
              else if (volunteerData && typeof volunteerData.nome === 'string') {
                volunteerName = volunteerData.nome;
              }
              // Adicione mais 'else if' se a estrutura for outra

              if (volunteerName && volunteerName.trim() !== "") { // Garante que o nome não seja vazio
                // Track allowances (days)
                const startDate = new Date(travelData.startDate);
                const endDate = new Date(travelData.endDate);
                // Garante que as datas são válidas antes de calcular
                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
                  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

                  const currentAllowances = userAllowancesMap.get(volunteerName) || 0;
                  userAllowancesMap.set(volunteerName, currentAllowances + days);
                } else {
                  console.warn(`Datas inválidas para a viagem ${doc.id} do voluntário ${volunteerName}`);
                }

                // Track trips count
                const currentTrips = userTripsMap.get(volunteerName) || 0;
                userTripsMap.set(volunteerName, currentTrips + 1);
              } else {
                // console.warn("Voluntário sem nome ou com nome inválido encontrado na viagem:", doc.id, "Dados do voluntário:", volunteerData);
              }
            });
          }
        });

        let chartData: any[];

        if (rankingType === "allowances") {
          chartData = Array.from(userAllowancesMap.entries())
            .map(([name, value]) => ({ name, value })) // 'name' já é a string do nome
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Pega o Top 10
        } else { // rankingType === "trips"
          chartData = Array.from(userTripsMap.entries())
            .map(([name, value]) => ({ name, value })) // 'name' já é a string do nome
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Pega o Top 10
        }

        setData(chartData);
      } catch (error) {
        console.error("Error fetching ranking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [rankingType]); // A dependência `db` não é necessária aqui, pois `db` em si não muda.

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
          <div className="flex justify-center items-center h-80">
            <span className="text-gray-500">Carregando dados...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-80">
            <span className="text-gray-500">Nenhum dado para exibir no ranking.</span>
          </div>
        ) : (
          <ChartContainer className="h-80" config={{}}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 10,
                right: 30,
                left: 120, // Aumentei um pouco para nomes mais longos
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name" // Crucial: deve corresponder à propriedade 'name' no seu chartData
                tick={{ fontSize: 12, fill: '#333' }} // Ajuste de cor para melhor leitura
                width={110} // Aumentei um pouco
                interval={0} // Garante que todos os ticks sejam mostrados se couberem
              />
              <Tooltip
                formatter={(value, name, props) => {
                  // props.payload.name é o nome do viajante
                  // value é o número de diárias/viagens
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
                barSize={20}
                // A legenda já pega o nome da série automaticamente, mas pode ser explícito
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
