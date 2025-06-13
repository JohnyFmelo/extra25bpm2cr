
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trophy, TrendingUp } from "lucide-react";

interface TCOStats {
  total: number;
  averagePerDay: number;
  activeDays: number;
  lastUpdate: string;
}

const TCOProductivityRanking = () => {
  const [stats, setStats] = useState<TCOStats>({
    total: 0,
    averagePerDay: 0,
    activeDays: 0,
    lastUpdate: ""
  });
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchTCOStats = async () => {
      if (!user.nome) return;
      
      setLoading(true);
      try {
        const tcosRef = collection(db, "tcos");
        const q = query(tcosRef, where("condutor", "==", user.nome));
        const querySnapshot = await getDocs(q);

        const tcos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const total = tcos.length;
        
        // Calcular dias únicos com TCOs
        const uniqueDates = new Set(
          tcos.map((tco: any) => {
            const date = tco.dataOcorrencia || tco.createdAt?.toDate?.()?.toISOString()?.split('T')[0];
            return date;
          }).filter(Boolean)
        );
        
        const activeDays = uniqueDates.size;
        const averagePerDay = activeDays > 0 ? total / activeDays : 0;
        
        // Última atualização
        const sortedTcos = tcos.sort((a: any, b: any) => {
          const dateA = new Date(a.dataOcorrencia || a.createdAt?.toDate?.() || 0);
          const dateB = new Date(b.dataOcorrencia || b.createdAt?.toDate?.() || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        const lastUpdate = sortedTcos.length > 0 
          ? new Date(sortedTcos[0].dataOcorrencia || sortedTcos[0].createdAt?.toDate?.()).toLocaleDateString('pt-BR')
          : new Date().toLocaleDateString('pt-BR');

        setStats({
          total,
          averagePerDay: Math.round(averagePerDay * 10) / 10,
          activeDays,
          lastUpdate
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas de TCOs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTCOStats();
  }, [user.nome]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded mb-2"></div>
            <div className="h-6 bg-white/20 rounded mb-4"></div>
            <div className="flex justify-between">
              <div className="h-8 bg-white/20 rounded w-16"></div>
              <div className="h-8 bg-white/20 rounded w-16"></div>
              <div className="h-8 bg-white/20 rounded w-16"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ranking Produtividade
            </h3>
            <p className="text-sm text-white/80">Condutores - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
          </div>
          <Trophy className="h-6 w-6 text-yellow-300" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Stats Row */}
        <div className="flex justify-between items-center mb-4 bg-white/10 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-white/80">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.averagePerDay}</div>
            <div className="text-xs text-white/80">Média/dia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.activeDays}</div>
            <div className="text-xs text-white/80">Dias</div>
          </div>
        </div>

        {/* User Ranking */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-black">1</span>
              </div>
              <div>
                <div className="font-semibold text-sm">{user.nome || "CONDUTOR"}</div>
                <div className="text-xs text-white/80">{stats.total} atividades</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">100%</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="text-center mt-3">
          <p className="text-xs text-white/70">
            ⏰ Última atualização: {stats.lastUpdate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TCOProductivityRanking;
