import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card"; // Seus componentes UI
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
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

// Tipo para os dados que o RankingChart espera receber
interface TravelerData {
  name: string;
  totalAllowances: number; // Diárias já calculadas (0.5, 1, etc.)
  totalTrips: number;
}

interface RankingChartProps {
  allTravelersData: TravelerData[]; // Prop para receber os dados
}

const RankingChart: React.FC<RankingChartProps> = ({ allTravelersData }) => {
  const [rankingType, setRankingType] = useState<"allowances" | "trips">("allowances");
  const [chartDisplayData, setChartDisplayData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Pode ser usado para transição inicial

  useEffect(() => {
    setLoading(true);
    if (allTravelersData && allTravelersData.length > 0) {
      let processedData: any[];

      if (rankingType === "allowances") {
        processedData = allTravelersData
          .map(traveler => ({
            name: traveler.name,
            value: traveler.totalAllowances, // Usa as diárias calculadas
          }))
          .filter(item => item.value > 0) // Mostrar apenas quem tem diárias
          .sort((a, b) => b.value - a.value);
      } else { // rankingType === "trips"
        processedData = allTravelersData
          .map(traveler => ({
            name: traveler.name,
            value: traveler.totalTrips,
          }))
          .filter(item => item.value > 0) // Mostrar apenas quem tem viagens
          .sort((a, b) => b.value - a.value);
      }
      setChartDisplayData(processedData);
    } else {
      setChartDisplayData([]); // Limpa se não houver dados
    }
    setLoading(false);
  }, [rankingType, allTravelersData]); // Re-processa quando o tipo de ranking ou os dados de entrada mudam

  const chartHeight = Math.max(300, chartDisplayData.length * 35 + 60);

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
        {loading ? ( // Pode ser um loading mais simples aqui, já que os dados brutos vêm de fora
          <div className="flex justify-center items-center" style={{ height: chartHeight }}>
            <span className="text-gray-500">Processando ranking...</span>
          </div>
        ) : chartDisplayData.length === 0 ? (
          <div className="flex justify-center items-center" style={{ height: chartHeight }}>
            <span className="text-gray-500">Nenhum dado para exibir no ranking.</span>
          </div>
        ) : (
          <div style={{ width: '100%', height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDisplayData}
                layout="vertical"
                margin={{ top: 20, right: 50, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" allowDecimals={true} /> {/* Permitir decimais para 0.5 diárias */}
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 12, fill: '#333' }}
                  interval={0}
                />
                <Tooltip
                  formatter={(value: number, name, props) => {
                    // O `value` aqui será o total de diárias (pode ser decimal) ou viagens
                    return [
                      `${value} ${rankingType === "allowances" ? "diárias" : "viagens"}`,
                      `Viajante: ${props.payload.name}`
                    ];
                  }}
                  cursor={{ fill: 'rgba(200, 200, 200, 0.3)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar
                  dataKey="value"
                  fill={rankingType === "allowances" ? "#4f46e5" : "#10b981"}
                >
                  <LabelList
                    dataKey="value"
                    position="right"
                    offset={5}
                    style={{ fill: '#333', fontSize: 12 }}
                    formatter={(val: number) => {
                        // Formatar para mostrar decimais apenas se houver
                        return Number.isInteger(val) ? `${val}` : `${val.toFixed(1)}`;
                    }}
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
