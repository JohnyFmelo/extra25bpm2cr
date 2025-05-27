import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Trophy, Award, Medal } from "lucide-react";

const RankingChart = () => {
  const [rankingType, setRankingType] = useState("allowances");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankingData = async () => {
      setLoading(true);
      try {
        // Simulando dados para demonstração
        // Substitua por sua lógica de Firebase
        const mockData = [
          { name: "João Silva", allowances: 15.5, trips: 8 },
          { name: "Maria Santos", allowances: 12.0, trips: 6 },
          { name: "Pedro Oliveira", allowances: 18.5, trips: 10 },
          { name: "Ana Costa", allowances: 9.5, trips: 5 },
          { name: "Carlos Ferreira", allowances: 14.0, trips: 7 },
          { name: "Lucia Pereira", allowances: 11.5, trips: 6 },
          { name: "Roberto Lima", allowances: 8.0, trips: 4 },
          { name: "Fernanda Alves", allowances: 16.5, trips: 9 },
        ];

        let processedData;
        if (rankingType === "allowances") {
          processedData = mockData
            .map(item => ({ name: item.name, value: item.allowances }))
            .sort((a, b) => b.value - a.value);
        } else {
          processedData = mockData
            .map(item => ({ name: item.name, value: item.trips }))
            .sort((a, b) => b.value - a.value);
        }

        setData(processedData);
      } catch (error) {
        console.error("Error fetching ranking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [rankingType]);

  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Award className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
            {position}
          </div>
        );
    }
  };

  const getPositionStyle = (position) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
      default:
        return "bg-white border-gray-200 hover:bg-gray-50";
    }
  };

  const formatValue = (value) => {
    if (rankingType === "allowances") {
      return `${value.toFixed(1)} diárias`;
    }
    return `${value} viagens`;
  };

  return (
    <Card className="shadow-md w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Ranking</h2>
          <Tabs
            value={rankingType}
            onValueChange={(value) => setRankingType(value)}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="allowances">Diárias</TabsTrigger>
              <TabsTrigger value="trips">Viagens</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-gray-500">Carregando dados...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <span className="text-gray-500">Nenhum dado para exibir no ranking.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => {
              const position = index + 1;
              return (
                <div
                  key={item.name}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${getPositionStyle(position)}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getPositionIcon(position)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {position === 1 ? "🏆 Líder" : `${position}º lugar`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-800">
                      {formatValue(item.value)}
                    </div>
                    {position <= 3 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {position === 1 && "🔥 Top performer"}
                        {position === 2 && "⭐ Excelente"}
                        {position === 3 && "👏 Muito bom"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingChart;
