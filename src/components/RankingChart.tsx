
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trophy, Medal, Award, Calendar, DollarSign } from "lucide-react";

const RankingList = () => {
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

        let processedData: any[];
        if (rankingType === "allowances") {
          processedData = Array.from(userAllowancesMap.entries()).map(([name, value]) => ({
            name,
            value
          })).sort((a, b) => b.value - a.value);
        } else {
          processedData = Array.from(userTripsMap.entries()).map(([name, value]) => ({
            name,
            value
          })).sort((a, b) => b.value - a.value);
        }

        processedData = processedData.filter(item => item.name && item.name.trim() !== "" && item.value > 0);
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
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">
            {position}
          </div>
        );
    }
  };

  const formatValue = (value: number) => {
    if (rankingType === "allowances") {
      return value.toFixed(1);
    }
    return value.toFixed(0);
  };

  const getProgressWidth = (value: number, maxValue: number) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  const maxValue = data.length > 0 ? data[0].value : 0;

  return (
    <Card className="shadow-lg w-full border-0 bg-gradient-to-br from-slate-50 to-white">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Ranking de {rankingType === "allowances" ? "Diárias" : "Viagens"}
            </h2>
          </div>
          <Tabs 
            value={rankingType} 
            onValueChange={(value) => setRankingType(value as "allowances" | "trips")} 
            className="w-auto"
          >
            <TabsList className="border border-slate-200 bg-slate-400">
              <TabsTrigger 
                value="allowances" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                Diárias
              </TabsTrigger>
              <TabsTrigger 
                value="trips" 
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                Viagens
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-slate-500 font-medium">Carregando dados...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="p-4 bg-slate-100 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-slate-400" />
            </div>
            <span className="text-slate-500 font-medium">Nenhum dado para exibir no ranking.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => {
              const position = index + 1;
              const isTopThree = position <= 3;
              
              return (
                <div
                  key={`${item.name}-${position}`}
                  className={`
                    relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-in slide-in-from-bottom-4
                    ${isTopThree 
                      ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                    }
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Progress bar background */}
                  <div 
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out
                      ${rankingType === "allowances" 
                        ? 'bg-gradient-to-r from-blue-100 to-blue-50' 
                        : 'bg-gradient-to-r from-green-100 to-green-50'
                      }
                    `}
                    style={{ width: `${getProgressWidth(item.value, maxValue)}%` }}
                  />
                  
                  <div className="relative flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getRankIcon(position)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate text-lg">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Posição #{position}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className={`text-2xl font-bold
                          ${rankingType === "allowances" ? 'text-blue-600' : 'text-green-600'}
                        `}>
                          {formatValue(item.value)}
                        </div>
                        <div className="text-sm text-slate-500">
                          {rankingType === "allowances" ? "diárias" : "viagens"}
                        </div>
                      </div>
                      
                      {isTopThree && (
                        <div className={`w-2 h-12 rounded-full
                          ${position === 1 ? 'bg-yellow-400' : 
                            position === 2 ? 'bg-gray-400' : 'bg-amber-500'}
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
  );
};

export default RankingList;
