import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
// import { ChartContainer } from "./ui/chart"; // Removido se o div com style for suficiente
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
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

          // <<< IMPORTANTE: CONFIRMAR NOME DO CAMPO >>>
          // Assumindo que os voluntários que REALMENTE viajaram estão em um campo como 'selectedVolunteers'
          // Se o nome do campo for diferente (ex: 'participants', 'actualTravelers'), ajuste abaixo.
          const participants = travelData.selectedVolunteers || travelData.volunteers; // Fallback para 'volunteers' se 'selectedVolunteers' não existir

          if (participants && Array.isArray(participants)) {
            participants.forEach((volunteerData: any) => {
              let volunteerName: string | undefined;

              // Lógica para extrair o nome do voluntário (ajuste se necessário)
              if (typeof volunteerData === 'string') {
                volunteerName = volunteerData;
              } else if (volunteerData && typeof volunteerData.name === 'string') {
                volunteerName = volunteerData.name;
              } else if (volunteerData && typeof volunteerData.nome === 'string') {
                volunteerName = volunteerData.nome;
              }
              // Adicione mais 'else if' para outras estruturas de dados do voluntário

              if (volunteerName && volunteerName.trim() !== "") {
                // --- Contagem de Diárias (Allowances) ---
                const startDate = new Date(travelData.startDate);
                const endDate = new Date(travelData.endDate);
                let calculatedDays = 0;

                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
                  // Calcula o número de "noites" ou dias completos entre as datas
                  const timeDiff = endDate.getTime() - startDate.getTime();
                  const fullDaysInteger = Math.floor(timeDiff / (1000 * 3600 * 24));

                  // Se startDate e endDate são o mesmo dia, fullDaysInteger será 0.
                  // Nesse caso, é 0.5 diária.
                  // Se for mais de um dia, são os dias inteiros + 0.5 para o último dia.
                  if (startDate.toDateString() === endDate.toDateString()) {
                    calculatedDays = 0.5;
                  } else {
                    // Ex: Viagem de 2 dias (dia 1 e dia 2) -> fullDaysInteger = 1.
                    // Deveria ser 1 dia inteiro + 0.5 = 1.5
                    // Então, (fullDaysInteger) + 0.5
                    // Ex: Viagem de 6 dias (dia 1 ao dia 6) -> fullDaysInteger = 5
                    // Deveria ser 5 dias inteiros + 0.5 = 5.5
                    calculatedDays = fullDaysInteger + 0.5;
                  }

                  // Garante que não seja negativo se algo der muito errado, embora improvável com endDate >= startDate
                  calculatedDays = Math.max(0, calculatedDays);

                  const currentAllowances = userAllowancesMap.get(volunteerName) || 0;
                  userAllowancesMap.set(volunteerName, currentAllowances + calculatedDays);
                }

                // --- Contagem de Viagens (Trips) ---
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
        } else { // rankingType === "trips"
          processedChartData = Array.from(userTripsMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        }

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

  const chartHeight = Math.max(300, data.length * 35 + 70); // Aumentei um pouco a base e por item

  const formatLabelValue = (value: number) => {
    if (rankingType === "allowances") {
      // Mostra uma casa decimal para diárias (X.5 ou X.0)
      return value.toFixed(1);
    }
    // Mostra como inteiro para viagens
    return value.toFixed(0);
  };

  return (
    <Card className="shadow-md w-full">
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
      <CardContent className="p-6 overflow-y-auto" style={{ maxHeight: '80vh' }}>
        {loading ? (
          <div className="flex justify-center items-center" style={{ height: chartHeight }}>
            <span className="text-gray-500">Carregando dados...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center" style={{ height: chartHeight }}>
            <span className="text-gray-500">Nenhum dado para exibir no ranking.</span>
          </div>
        ) : (
          <div style={{ width: '100%', height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 20, right: 60, left: 10, bottom: 20 }} // Aumentei margem direita para labels
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  allowDecimals={rankingType === "allowances"} // Permite decimais para diárias
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 12, fill: '#333' }}
                  interval={0}
                />
                <Tooltip
                  formatter={(value: number, name, props) => {
                    const formattedValue = rankingType === "allowances" ? value.toFixed(1) : value.toFixed(0);
                    return [
                      `${formattedValue} ${rankingType === "allowances" ? "diárias" : "viagens"}`,
                      `Viajante: ${props.payload.name}`
                    ];
                  }}
                  cursor={{ fill: 'rgba(200, 200, 200, 0.3)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar
                  dataKey="value"
                  fill={rankingType === "allowances" ? "#4f46e5" : "#10b981"}
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    dataKey="value"
                    position="right"
                    offset={5}
                    style={{ fill: '#333', fontSize: 12 }}
                    formatter={formatLabelValue} // Usa a função de formatação
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
