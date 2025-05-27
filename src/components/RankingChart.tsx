import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trophy, Medal, Award, Calendar, DollarSign } from "lucide-react";

// Types
interface RankingItem {
  name: string;
  value: number;
}

type RankingType = "allowances" | "trips";

interface TravelData {
  startDate: string;
  endDate: string;
  selectedVolunteers?: Array<string | { name?: string; nome?: string }>;
  volunteers?: Array<string | { name?: string; nome?: string }>;
}

// Utility Functions
const calculateDays = (startDate: Date, endDate: Date): number => {
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
    return 0;
  }
  const timeDiff = endDate.getTime() - startDate.getTime();
  const fullDays = Math.floor(timeDiff / (1000 * 3600 * 24));
  return startDate.toDateString() === endDate.toDateString() ? 0.5 : fullDays + 0.5;
};

const processTravelData = (
  querySnapshot: any,
  rankingType: RankingType
): RankingItem[] => {
  const userAllowancesMap = new Map<string, number>();
  const userTripsMap = new Map<string, number>();

  querySnapshot.forEach((doc: any) => {
    const travelData: TravelData = doc.data();
    const participants = travelData.selectedVolunteers || travelData.volunteers;

    if (Array.isArray(participants)) {
      participants.forEach((volunteerData) => {
        const volunteerName =
          typeof volunteerData === "string"
            ? volunteerData
            : volunteerData?.name || volunteerData?.nome;

        if (volunteerName && volunteerName.trim()) {
          // Calculate Allowances
          const startDate = new Date(travelData.startDate);
          const endDate = new Date(travelData.endDate);
          const days = calculateDays(startDate, endDate);
          if (days > 0) {
            userAllowancesMap.set(
              volunteerName,
              (userAllowancesMap.get(volunteerName) || 0) + days
            );
          }

          // Count Trips
          userTripsMap.set(
            volunteerName,
            (userTripsMap.get(volunteerName) || 0) + 1
          );
        }
      });
    }
  });

  const map = rankingType === "allowances" ? userAllowancesMap : userTripsMap;
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.name.trim() && item.value > 0)
    .sort((a, b) => b.value - a.value);
};

// Components
const RankIcon: React.FC<{ position: number }> = ({ position }) => {
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

const RankingItem: React.FC<{
  item: RankingItem;
  position: number;
  maxValue: number;
  rankingType: RankingType;
}> = ({ item, position, maxValue, rankingType }) => {
  const isTopThree = position <= 3;
  const progressWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
  const formatValue = (value: number) =>
    rankingType === "allowances" ? value.toFixed(1) : value.toFixed(0);

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02]
        ${isTopThree ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"}
      `}
    >
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
          rankingType === "allowances"
            ? "bg-gradient-to-r from-blue-100 to-blue-50"
            : "bg-gradient-to-r from-green-100 to-green-50"
        }`}
        style={{ width: `${progressWidth}%` }}
      />
      <div className="relative flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <RankIcon position={position} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 truncate text-lg">
              {item.name}
            </h3>
            <p className="text-sm text-slate-500">Posição #{position}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div
              className={`text-2xl font-bold ${
                rankingType === "allowances" ? "text-blue-600" : "text-green-600"
              }`}
            >
              {formatValue(item.value)}
            </div>
            <div className="text-sm text-slate-500">
              {rankingType === "allowances" ? "diárias" : "viagens"}
            </div>
          </div>
          {isTopThree && (
            <div
              className={`w-2 h-12 rounded-full ${
                position === 1
                  ? "bg-yellow-400"
                  : position === 2
                  ? "bg-gray-400"
                  : "bg-amber-500"
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const RankingList: React.FC = () => {
  const [rankingType, setRankingType] = useState<RankingType>("allowances");
  const [data, setData] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankingData = async () => {
      setLoading(true);
      setError(null);
      try {
        const travelsRef = collection(db, "travels");
        const q = query(travelsRef, orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);
        const processedData = processTravelData(querySnapshot, rankingType);
        setData(processedData);
      } catch (error) {
        console.error("Error fetching ranking data:", error);
        setError("Falha ao carregar os dados do ranking.");
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [rankingType]);

  return (
    <Card className="shadow-lg w-full border-0 bg-gradient-to-br from-slate-50 to-white">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              {rankingType === "allowances" ? (
                <DollarSign className="w-6 h-6 text-white" />
              ) : (
                <Calendar className="w-6 h-6 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Ranking de {rankingType === "allowances" ? "Diárias" : "Viagens"}
            </h2>
          </div>
          <Tabs
            value={rankingType}
            onValueChange={(value) => setRankingType(value as RankingType)}
            className="w-auto"
          >
            <TabsList className="bg-slate-100 border border-slate-200">
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
        ) : error ? (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="p-4 bg-red-100 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-red-400" />
            </div>
            <span className="text-red-500 font-medium">{error}</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="p-4 bg-slate-100 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-slate-400" />
            </div>
            <span className="text-slate-500 font-medium">
              Nenhum dado para exibir no ranking.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => (
              <RankingItem
                key={`${item.name}-${index + 1}`}
                item={item}
                position={index + 1}
                maxValue={data[0].value}
                rankingType={rankingType}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingList;
