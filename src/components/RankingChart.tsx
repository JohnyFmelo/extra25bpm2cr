
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ChartContainer, ChartLegend } from "./ui/chart";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
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
        
        const userTrackingMap = new Map();
        const userTripsMap = new Map();

        querySnapshot.forEach((doc) => {
          const travelData = doc.data();
          if (travelData.volunteers) {
            travelData.volunteers.forEach((volunteer: any) => {
              // Track allowances (days)
              const startDate = new Date(travelData.startDate);
              const endDate = new Date(travelData.endDate);
              const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
              
              const currentAllowances = userTrackingMap.get(volunteer.name) || 0;
              userTrackingMap.set(volunteer.name, currentAllowances + days);
              
              // Track trips count
              const currentTrips = userTripsMap.get(volunteer.name) || 0;
              userTripsMap.set(volunteer.name, currentTrips + 1);
            });
          }
        });

        // Convert maps to arrays and sort
        let chartData: any[];
        
        if (rankingType === "allowances") {
          chartData = Array.from(userTrackingMap.entries())
            .map(([name, days]) => ({ name, value: days }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
        } else {
          chartData = Array.from(userTripsMap.entries())
            .map(([name, trips]) => ({ name, value: trips }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
        }

        setData(chartData);
      } catch (error) {
        console.error("Error fetching ranking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [rankingType]);

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
        ) : (
          <ChartContainer className="h-80" config={{}}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 10,
                right: 30,
                left: 100,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                width={100} 
              />
              <Tooltip 
                formatter={(value) => [
                  `${value} ${rankingType === "allowances" ? "diárias" : "viagens"}`,
                  ""
                ]}
              />
              <Bar 
                dataKey="value" 
                fill={rankingType === "allowances" ? "#4f46e5" : "#10b981"} 
                radius={[0, 4, 4, 0]} 
                barSize={20}
                name={rankingType === "allowances" ? "Diárias" : "Viagens"}
              />
              <Legend />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingChart;
