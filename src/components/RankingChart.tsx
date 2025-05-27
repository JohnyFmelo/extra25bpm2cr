return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-slate-50 w-full overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white pb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Ranking de Viajantes</h2>
          </div>
          <Tabs
            value={rankingType}
            onValueChange={(value) => setRankingType(value)}
            className="w-auto"
          >
            <TabsList className="bg-white/20 border-white/30">
              <TabsTrigger 
                value="allowances" 
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-white/90"
              >
                Diárias
              </TabsTrigger>
              <TabsTrigger 
                value="trips"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-white/90"
              >
                Viagens
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-4 text-white/80 text-sm">
          {rankingType === "allowances" 
            ? "Ranking baseado no total de diárias recebidas" 
            : "Ranking baseado no número de viagens realizadas"
          }
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-16 px-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-indigo-300 opacity-20"></div>
            </div>
            <span className="text-slate-600 mt-4 font-medium">Carregando ranking...</span>
            <span className="text-slate-400 text-sm mt-1">Analisando dados de viagens</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-16 px-6">
            <div className="text-6xl mb-4">📊</div>
            <span className="text-slate-600 text-lg font-medium">Nenhum dado encontrado</span>
            <span className="text-slate-400 text-sm mt-2">Não há dados para exibir no ranking atual</span>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {data.map((item, index) => {
              const position = index + 1;
              return (
                <div
                  key={item.name}
                  className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-300 ${getPositionStyle(position)}`}
                >
                  <div className="flex iimport React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Trophy, Award, Medal, Crown, Star, TrendingUp } from "lucide-react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const RankingChart = () => {
  const [rankingType, setRankingType] = useState("allowances");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankingData = async () => {
      setLoading(true);
      try {
        const travelsRef = collection(db, "travels");
        const q = query(travelsRef, orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);
        
        const userAllowancesMap = new Map();
        const userTripsMap = new Map();

        querySnapshot.forEach(doc => {
          const travelData = doc.data();
          const participants = travelData.selectedVolunteers || travelData.volunteers;

          if (participants && Array.isArray(participants)) {
            participants.forEach((volunteerData) => {
              let volunteerName;

              if (typeof volunteerData === 'string') {
                volunteerName = volunteerData;
              } else if (volunteerData && typeof volunteerData.name === 'string') {
                volunteerName = volunteerData.name;
              } else if (volunteerData && typeof volunteerData.nome === 'string') {
                volunteerName = volunteerData.nome;
              }

              if (volunteerName && volunteerName.trim() !== "") {
                // Contagem de Diárias
                const startDate = new Date(travelData.startDate);
                const endDate = new Date(travelData.endDate);
                let calculatedDays = 0;
                
                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
                  const timeDiff = endDate.getTime() - startDate.getTime();
                  const fullDaysInteger = Math.floor(timeDiff / (1000 * 3600 * 24));

                  if (startDate.toDateString() === endDate.toDateString()) {
                    calculatedDays = 0.5;
                  } else {
                    calculatedDays = fullDaysInteger + 0.5;
                  }

                  calculatedDays = Math.max(0, calculatedDays);
                  const currentAllowances = userAllowancesMap.get(volunteerName) || 0;
                  userAllowancesMap.set(volunteerName, currentAllowances + calculatedDays);
                }

                // Contagem de Viagens
                const currentTrips = userTripsMap.get(volunteerName) || 0;
                userTripsMap.set(volunteerName, currentTrips + 1);
              }
            });
          }
        });

        let processedChartData;
        if (rankingType === "allowances") {
          processedChartData = Array.from(userAllowancesMap.entries()).map(([name, value]) => ({
            name,
            value
          })).sort((a, b) => b.value - a.value);
        } else {
          processedChartData = Array.from(userTripsMap.entries()).map(([name, value]) => ({
            name,
            value
          })).sort((a, b) => b.value - a.value);
        }
        
        processedChartData = processedChartData.filter(item => 
          item.name && item.name.trim() !== "" && item.value > 0
        );
        
        setData(processedChartData);
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
        return <Crown className="w-7 h-7 text-yellow-500 drop-shadow-sm" />;
      case 2:
        return <Trophy className="w-6 h-6 text-slate-400 drop-shadow-sm" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600 drop-shadow-sm" />;
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300 flex items-center justify-center text-sm font-bold text-slate-600 shadow-sm">
            {position}
          </div>
        );
    }
  };

  const getPositionStyle = (position) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-br from-yellow-50 via-yellow-100 to-amber-50 border-2 border-yellow-300 shadow-lg transform hover:scale-[1.02] transition-all duration-300";
      case 2:
        return "bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100 border-2 border-slate-300 shadow-md transform hover:scale-[1.01] transition-all duration-300";
      case 3:
        return "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-2 border-amber-300 shadow-md transform hover:scale-[1.01] transition-all duration-300";
      default:
        return "bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-md transform hover:scale-[1.005] transition-all duration-200";
    }
  };

  const getPositionBadge = (position) => {
    switch (position) {
      case 1:
        return (
          <div className="flex items-center space-x-1 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Star className="w-3 h-3" />
            <span>CAMPEÃO</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center space-x-1 bg-slate-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <TrendingUp className="w-3 h-3" />
            <span>VICE</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center space-x-1 bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Award className="w-3 h-3" />
            <span>3º LUGAR</span>
          </div>
        );
      default:
        return (
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            #{position}
          </div>
        );
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
