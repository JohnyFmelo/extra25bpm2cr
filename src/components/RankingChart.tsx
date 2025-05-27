import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trophy, Medal, Award } from "lucide-react";

const RankingList = () => {
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
              } else if (volunteerData?.name) {
                volunteerName = volunteerData.name;
              } else if (volunteerData?.nome) {
                volunteerName = volunteerData.nome;
              }

              if (volunteerName && volunteerName.trim() !== "") {
                const startDate = new Date(travelData.startDate);
                const endDate = new Date(travelData.endDate);

                let calculatedDays = 0;
                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
                  const diff = endDate.getTime() - startDate.getTime();
                  const days = Math.floor(diff / (1000 * 3600 * 24));

                  calculatedDays = startDate.toDateString() === endDate.toDateString() ? 0.5 : days + 0.5;
                  calculatedDays = Math.max(0, calculatedDays);

                  const currentAllowances = userAllowancesMap.get(volunteerName) || 0;
                  userAllowancesMap.set(volunteerName, currentAllowances + calculatedDays);
                }

                const currentTrips = userTripsMap.get(volunteerName) || 0;
                userTripsMap.set(volunteerName, currentTrips + 1);
              }
            });
          }
        });

        // Unificação das métricas
        const combinedData = Array.from(userAllowancesMap.entries()).map(([name, allowances]) => {
          const trips = userTripsMap.get(name) || 0;
          const totalScore = allowances + trips; // Aqui você pode ajustar os pesos
          return { name, allowances, trips, totalScore };
        }).sort((a, b) => b.totalScore - a.totalScore);

        setData(combinedData.filter(item => item.name.trim() !== "" && item.totalScore > 0));
      } catch (error) {
        console.error("Error fetching ranking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, []);

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

  const getProgressWidth = (value: number, maxValue: number) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  const maxValue = data.length > 0 ? data[0].totalScore : 0;

  return (
    <Card className="shadow-lg w-full border-0 bg-gradient-to-br from-slate-50 to-white">
      <CardHeader className="pb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Ranking de Participações
        </h2>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-slate-500 font-medium">Carregando dados...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-12">
            <Trophy className="w-8 h-8 text-slate-400 mb-4" />
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
                    relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02]
                    ${isTopThree 
                      ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                    }
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div 
                    className={`absolute inset-y-0 left-0
                      bg-gradient-to-r from-blue-100 to-blue-50
                    `}
                    style={{ width: `${getProgressWidth(item.totalScore, maxValue)}%` }}
                  />
                  
                  <div className="relative flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      {getRankIcon(position)}
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg">{item.name}</h3>
                        <p className="text-sm text-slate-500">Posição #{position}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {item.totalScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {item.trips} viagens • {item.allowances.toFixed(1)} diárias
                      </div>
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
