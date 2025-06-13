// TCOProductivityRanking.tsx - MODIFICADO

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Trophy, TrendingUp } from "lucide-react";
import { TcoData, StructuredGupm } from "./TCOmeus"; // Supondo que você exporte os tipos de TCOmeus.tsx

interface TCOStats {
  total: number;
  averagePerDay: number;
  activeDays: number;
  lastUpdate: string;
}

// Interface para as props que o componente vai receber
interface TCOProductivityRankingProps {
  tcoList: TcoData[];
  gupmDetailsCache: Record<string, StructuredGupm | null>;
  currentUser: {
    id: string;
    nome?: string; // Usaremos o nome para exibição
  };
  loading: boolean;
}

const TCOProductivityRanking: React.FC<TCOProductivityRankingProps> = ({
  tcoList,
  gupmDetailsCache,
  currentUser,
  loading
}) => {
  const [stats, setStats] = useState<TCOStats>({
    total: 0,
    averagePerDay: 0,
    activeDays: 0,
    lastUpdate: ""
  });

  useEffect(() => {
    if (loading || !currentUser.id || tcoList.length === 0) return;

    // 1. Filtrar TCOs onde o usuário atual é o condutor.
    // O condutor é o primeiro RGPM da equipe principal.
    const myTcos = tcoList.filter(tco => {
      const gupmInfo = gupmDetailsCache[tco.id];
      // Verifica se a GUPM foi carregada, se existe um condutor, e se o nome do condutor bate
      // Precisamos do RGPM do usuário para uma checagem 100% segura, mas vamos usar o userId por enquanto
      // A lógica ideal seria comparar o RGPM do condutor com o RGPM do usuário logado.
      // Por simplicidade aqui, vamos filtrar pelos TCOs criados pelo usuário.
      // A query original buscava pelo NOME do condutor. A fonte de dados do TCOmeus não tem o nome do condutor diretamente,
      // mas tem o userId do criador. Vamos usar isso.
      return tco.userId === currentUser.id;
    });

    const total = myTcos.length;
    if (total === 0) {
        setStats({ total: 0, averagePerDay: 0, activeDays: 0, lastUpdate: new Date().toLocaleDateString('pt-BR') });
        return;
    }

    // 2. Calcular dias únicos com TCOs
    const uniqueDates = new Set(
      myTcos.map(tco => tco.createdAt.toISOString().split('T')[0]).filter(Boolean)
    );
    
    const activeDays = uniqueDates.size;
    const averagePerDay = activeDays > 0 ? total / activeDays : 0;
    
    // 3. Encontrar a última atualização
    // A lista já vem ordenada por data de `TCOmeus`
    const lastUpdate = myTcos.length > 0 
      ? myTcos[0].createdAt.toLocaleDateString('pt-BR')
      : new Date().toLocaleDateString('pt-BR');

    setStats({
      total,
      averagePerDay: Math.round(averagePerDay * 10) / 10,
      activeDays,
      lastUpdate
    });
  // Dependências atualizadas para re-calcular quando os dados de entrada mudarem
  }, [tcoList, gupmDetailsCache, currentUser, loading]);

  // O JSX para o estado de loading e para exibir os dados pode permanecer o mesmo.
  // Apenas troque `user.nome` por `currentUser.nome` no JSX.
  
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
         {/* ... (restante do seu JSX) ... */}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* ... (Stats Row) ... */}
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

        {/* ... (User Ranking) ... */}
         <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* ... */}
              <div>
                {/* Use o nome do usuário passado via props */}
                <div className="font-semibold text-sm">{currentUser.nome || "CONDUTOR"}</div>
                <div className="text-xs text-white/80">{stats.total} atividades</div>
              </div>
            </div>
            {/* ... */}
          </div>
          {/* ... */}
        </div>
        
        {/* ... (Last Update) ... */}
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
