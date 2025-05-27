import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trophy, Medal, Award, Calendar, DollarSign, MapPin, User, TrendingUp } from "lucide-react";

const RankingList = () => {
  const [rankingType, setRankingType] = useState<"allowances" | "trips">("allowances");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({ totalAllowances: 0, totalTrips: 0, totalUsers: 0 });

  useEffect(() => {
    const fetchRankingData = async () => {
      setLoading(true);
      try {
        const travelsRef = collection(db, "travels");
        const q = query(travelsRef, orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);

        const userAllowancesMap = new Map<string, number>();
        const userTripsMap = new Map<string, number>();

        querySnapshot.forEach(doc => {
          const travelData = doc.data();
          const participants = travelData.selectedVolunteers || travelData.volunteers;

          if (participants && Array.isArray(participants)) {
            participants.forEach((volunteerData: any) => {
              let volunteerName: string | undefined;

              if (typeof volunteerData === 'string') {
                volunteerName = volunteerData;
              } else if (volunteerData && typeof volunteerData.name === 'string') {
                volunteerName = volunteerData.name;
              } else if (volunteerData && typeof volunteerData.nome === 'string') {
                volunteerName = volunteerData.nome;
              }

              if (volunteerName && volunteerName.trim() !== "") {
                // Contagem de Diárias (Allowances)
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

                // Contagem de Viagens (Trips)
                const currentTrips = userTripsMap.get(volunteerName) || 0;
                userTripsMap.set(volunteerName, currentTrips + 1);
              }
            });
          }
        });

        // Calcular estatísticas
        const totalAllowances = Array.from(userAllowancesMap.values()).reduce((a, b) => a + b, 0);
        const totalTrips = Array.from(userTripsMap.values()).reduce((a, b) => a + b, 0);
        const totalUsers = new Set([...userAllowancesMap.keys(), ...userTripsMap.keys()]).size;

        setStats({ totalAllowances, totalTrips, totalUsers });

        // Processar dados unificados
        const userDataMap = new Map();
        
        // Combinar dados de diárias e viagens
        [...userAllowancesMap.keys(), ...userTripsMap.keys()].forEach(name => {
          if (!userDataMap.has(name)) {
            userDataMap.set(name, {
              name,
              allowances: userAllowancesMap.get(name) || 0,
              trips: userTripsMap.get(name) || 0
            });
          }
        });

        let processedData = Array.from(userDataMap.values());
        
        // Ordenar com base no tipo selecionado
        if (rankingType === "allowances") {
          processedData.sort((a, b) => b.allowances - a.allowances);
        } else {
          processedData.sort((a, b) => b.trips - a.trips);
        }

        // Filtrar dados válidos
        processedData = processedData.filter(item => 
          item.name && item.name.trim() !== "" && 
          (item.allowances > 0 || item.trips > 0)
        );

        setData(processedData);
      } catch (error) {
        console.error("Error fetching ranking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [rankingType]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-7 h-7 text-yellow-500 drop-shadow-sm" />;
      case 2:
        return <Medal className="w-7 h-7 text-gray-400 drop-shadow-sm" />;
      case 3:
        return <Award className="w-7 h-7 text-amber-600 drop-shadow-sm" />;
      default:
        return (
          <div className="w-7 h-7 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-sm font-bold text-slate-700 shadow-inner">
            {position}
          </div>
        );
    }
  };

  const formatValue = (value: number, type: string) => {
    if (type === "allowances") {
      return value.toFixed(1);
    }
    return value.toFixed(0);
  };

  const getProgressWidth = (item: any) => {
    const maxPrimaryValue = data.length > 0 ? 
      (rankingType === "allowances" ? data[0].allowances : data[0].trips) : 0;
    const primaryValue = rankingType === "allowances" ? item.allowances : item.trips;
    return maxPrimaryValue > 0 ? (primaryValue / maxPrimaryValue) * 100 : 0;
  };

  const getGradientClasses = (position: number) => {
    if (position === 1) return 'from-yellow-100 via-yellow-50 to-amber-50 border-yellow-300';
    if (position === 2) return 'from-gray-100 via-gray-50 to-slate-50 border-gray-300';
    if (position === 3) return 'from-amber-100 via-amber-50 to-orange-50 border-amber-300';
    return 'from-white to-slate-50 border-slate-200';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card com Estatísticas */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Ranking de Performance</h1>
                <p className="text-slate-600">Acompanhe o desempenho dos voluntários</p>
              </div>
            </div>
            
            <Tabs 
              value={rankingType} 
              onValueChange={(value) => setRankingType(value as "allowances" | "trips")} 
              className="w-auto"
            >
              <TabsList className="bg-white/70 backdrop-blur border border-blue-200 shadow-lg">
                <TabsTrigger 
                  value="allowances" 
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Diárias
                </TabsTrigger>
                <TabsTrigger 
                  value="trips" 
                  className="data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Viagens
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-white/50 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total de Diárias</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalAllowances.toFixed(1)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-white/50 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total de Viagens</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalTrips}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-white/50 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Voluntários Ativos</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking Card */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Trophy className="w-7 h-7 text-yellow-500" />
              Ranking de {rankingType === "allowances" ? "Diárias" : "Viagens"}
            </h2>
            <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {data.length} participantes
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-6">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 absolute top-0 left-0"></div>
                </div>
                <span className="text-slate-500 font-medium">Carregando ranking...</span>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="p-6 bg-slate-100 rounded-full mb-6">
                <Trophy className="w-12 h-12 text-slate-400" />
              </div>
              <span className="text-slate-500 font-medium text-lg">Nenhum dado disponível para o ranking.</span>
              <span className="text-slate-400 text-sm mt-2">Os dados aparecerão aqui quando houver viagens registradas.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((item, index) => {
                const position = index + 1;
                const isTopThree = position <= 3;
                const primaryValue = rankingType === "allowances" ? item.allowances : item.trips;
                const secondaryValue = rankingType === "allowances" ? item.trips : item.allowances;
                
                return (
                  <div
                    key={`${item.name}-${position}`}
                    className={`
                      relative overflow-hidden rounded-2xl border-2 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] cursor-pointer transform-gpu
                      ${isTopThree 
                        ? `bg-gradient-to-r ${getGradientClasses(position)} shadow-lg` 
                        : 'bg-gradient-to-r from-white to-slate-50 border-slate-200 hover:border-slate-300 shadow-md'
                      }
                    `}
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animation: 'slideInUp 0.6s ease-out forwards'
                    }}
                  >
                    {/* Progress bar background */}
                    <div 
                      className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out opacity-30
                        ${rankingType === "allowances" 
                          ? 'bg-gradient-to-r from-blue-200 to-blue-100' 
                          : 'bg-gradient-to-r from-green-200 to-green-100'
                        }
                      `}
                      style={{ width: `${getProgressWidth(item)}%` }}
                    />
                    
                    <div className="relative flex items-center justify-between p-6">
                      <div className="flex items-center space-x-5">
                        <div className="flex-shrink-0">
                          {getRankIcon(position)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 truncate text-xl mb-1">
                            {item.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {item.allowances.toFixed(1)} diárias
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {item.trips} viagens
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-3xl font-bold mb-1
                            ${rankingType === "allowances" ? 'text-blue-600' : 'text-green-600'}
                          `}>
                            {formatValue(primaryValue, rankingType)}
                          </div>
                          <div className="text-sm text-slate-500 font-medium">
                            {rankingType === "allowances" ? "diárias" : "viagens"}
                          </div>
                          {secondaryValue > 0 && (
                            <div className="text-xs text-slate-400 mt-1">
                              +{formatValue(secondaryValue, rankingType === "allowances" ? "trips" : "allowances")} {rankingType === "allowances" ? "viagens" : "diárias"}
                            </div>
                          )}
                        </div>
                        
                        {isTopThree && (
                          <div className={`w-3 h-16 rounded-full shadow-inner
                            ${position === 1 ? 'bg-gradient-to-b from-yellow-400 to-yellow-500' : 
                              position === 2 ? 'bg-gradient-to-b from-gray-400 to-gray-500' : 
                              'bg-gradient-to-b from-amber-500 to-amber-600'}
                          `} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingList;
