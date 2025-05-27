// src/components/RankingList.tsx

import React, { useEffect, useState, useMemo } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Trophy, Medal, Award, Calendar, DollarSign, BarChart2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

// --- Tipos e Constantes ---
type RankingType = "allowances" | "trips";

interface RankingItem {
  name: string;
  value: number;
}

const RANKING_CONFIG = {
  allowances: {
    label: "Diárias",
    icon: <DollarSign className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-500",
    gradient: "from-blue-100 to-blue-50",
  },
  trips: {
    label: "Viagens",
    icon: <Calendar className="w-5 h-5" />,
    color: "text-green-600",
    bgColor: "bg-green-500",
    gradient: "from-green-100 to-green-50",
  },
};

// --- Componentes Filhos para Melhor Organização ---

const RankingItemCard = ({
  item,
  index,
  maxValue,
  rankingType,
}: {
  item: RankingItem;
  index: number;
  maxValue: number;
  rankingType: RankingType;
}) => {
  const position = index + 1;
  const isTopThree = position <= 3;
  const config = RANKING_CONFIG[rankingType];

  const getRankIcon = (pos: number) => {
    if (pos === 1) return <Trophy className="w-7 h-7 text-yellow-500" />;
    if (pos === 2) return <Medal className="w-7 h-7 text-gray-400" />;
    if (pos === 3) return <Award className="w-7 h-7 text-amber-600" />;
    return (
      <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
        {pos}
      </div>
    );
  };

  const formatValue = (value: number) => {
    return rankingType === "allowances" ? value.toFixed(1) : value.toString();
  };

  const progressWidth = useMemo(() => {
    return maxValue > 0 ? (item.value / maxValue) * 100 : 0;
  }, [item.value, maxValue]);

  return (
    <motion.div
      className="relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, delay: index * 0.05 }}
      layout
    >
      {/* Barra de Progresso no Fundo */}
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${config.gradient}`}
        style={{ width: `${progressWidth}%` }}
      />

      <div className="relative flex items-center justify-between p-3 sm:p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 w-8 text-center">{getRankIcon(position)}</div>
          <p className="font-semibold text-slate-800 truncate">{item.name}</p>
        </div>
        <div className={`text-xl font-bold ${config.color}`}>
          {formatValue(item.value)}
        </div>
      </div>
    </motion.div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3 pt-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-4 w-1/4" />
      </div>
    ))}
  </div>
);

// --- Componente Principal ---

const RankingList = () => {
  const [rankingType, setRankingType] = useState<RankingType>("allowances");
  const [rankings, setRankings] = useState<{ [key in RankingType]: RankingItem[] }>({
    allowances: [],
    trips: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAndProcessRankings = async () => {
      setLoading(true);
      try {
        const travelsRef = collection(db, "travels");
        const q = query(travelsRef, orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);

        const userAllowances = new Map<string, number>();
        const userTrips = new Map<string, number>();

        querySnapshot.forEach(doc => {
          const travelData = doc.data();
          const participants = travelData.selectedVolunteers || travelData.volunteers;
          if (!participants || !Array.isArray(participants)) return;

          participants.forEach((volunteer: any) => {
            const name = (volunteer?.name || volunteer?.nome || volunteer || "").trim();
            if (!name) return;

            // Contagem de Viagens
            userTrips.set(name, (userTrips.get(name) || 0) + 1);

            // Contagem de Diárias
            const startDate = new Date(travelData.startDate);
            const endDate = new Date(travelData.endDate);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
            
            const timeDiff = endDate.getTime() - startDate.getTime();
            let days = 0;
            if (startDate.toDateString() === endDate.toDateString()) {
              days = 0.5; // Meia diária para viagens no mesmo dia
            } else {
              days = Math.floor(timeDiff / (1000 * 3600 * 24)) + 0.5;
            }
            userAllowances.set(name, (userAllowances.get(name) || 0) + Math.max(0, days));
          });
        });

        const processMap = (map: Map<string, number>): RankingItem[] => 
          Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .filter(item => item.value > 0);

        setRankings({
          allowances: processMap(userAllowances),
          trips: processMap(userTrips),
        });

      } catch (error) {
        console.error("Error fetching ranking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessRankings();
  }, []); // <-- Dependência vazia! Busca os dados apenas uma vez.

  const currentData = rankings[rankingType];
  const maxValue = currentData.length > 0 ? currentData[0].value : 0;
  const config = RANKING_CONFIG[rankingType];

  return (
    <Card className="w-full shadow-md border-slate-200/80">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-3">
            <BarChart2 className="w-6 h-6 text-slate-500"/>
            <CardTitle className="text-xl font-bold text-slate-800">Ranking de Voluntários</CardTitle>
        </div>
        <Tabs
          value={rankingType}
          onValueChange={(value) => setRankingType(value as RankingType)}
        >
          <TabsList>
            <TabsTrigger value="allowances" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Diárias
            </TabsTrigger>
            <TabsTrigger value="trips" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Viagens
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-6 pb-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading">
              <LoadingSkeleton />
            </motion.div>
          ) : currentData.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <Trophy className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Nenhum dado encontrado</h3>
              <p className="text-sm text-slate-500">Ainda não há dados para exibir no ranking.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="data" 
              className="space-y-2"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden"
              animate="visible"
            >
              <div className="flex justify-between text-xs font-semibold text-slate-500 px-4 py-1">
                <span>POSIÇÃO / NOME</span>
                <span>{config.label.toUpperCase()}</span>
              </div>
              {currentData.map((item, index) => (
                <RankingItemCard
                  key={`${item.name}-${rankingType}`}
                  item={item}
                  index={index}
                  maxValue={maxValue}
                  rankingType={rankingType}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default RankingList;
