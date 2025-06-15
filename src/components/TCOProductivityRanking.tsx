
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Trophy, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface TCOStats {
  total: number;
  averagePerDay: number;
  activeDays: number;
  lastUpdate: string;
}

interface UserRanking {
  userId: string;
  userName: string;
  tcoCount: number;
  lastActivity: string;
}

interface TcoData {
  id: string;
  tcoNumber: string;
  createdAt: Date;
  natureza: string;
  fileName: string;
  userId: string;
}

const BUCKET_NAME = 'tco-pdfs';

const extractTcoDisplayNumber = (fullTcoNumber: string | undefined | null): string => {
  if (!fullTcoNumber) return "-";
  let numberPart = "";
  const match = fullTcoNumber.match(/^TCO[-_]([^_-]+)/i);
  if (match && match[1]) numberPart = match[1];
  else if (fullTcoNumber.toUpperCase().startsWith("TCO-")) numberPart = fullTcoNumber.substring(4);
  else return fullTcoNumber;
  
  if (numberPart) {
    const num = parseInt(numberPart, 10);
    if (!isNaN(num)) return String(num).padStart(2, '0');
    return numberPart;
  }
  return "-";
};

const extractTcoNatureFromFilename = (fileName: string | undefined | null): string => {
  if (!fileName) return "Não especificada";
  const parts = fileName.split('_');
  if (parts.length < 4) return "Não especificada";
  
  let naturezaParts: string[] = [];
  const lastPart = parts[parts.length - 1];
  const rgpmSegmentPotentially = lastPart.replace(/\.pdf$/i, "");
  
  if (parts.length >= 5 && /^\d/.test(rgpmSegmentPotentially)) {
    naturezaParts = parts.slice(3, parts.length - 1);
  } else {
    const lastNaturePart = parts[parts.length - 1].replace(/\.pdf$/i, "");
    naturezaParts = parts.slice(3, parts.length - 1);
    naturezaParts.push(lastNaturePart);
  }
  
  if (naturezaParts.length === 0) return "Não especificada";
  
  return naturezaParts.join('_')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || "Não especificada";
};

const TCOProductivityRanking: React.FC = () => {
  const [stats, setStats] = useState<TCOStats>({
    total: 0,
    averagePerDay: 0,
    activeDays: 0,
    lastUpdate: ""
  });
  const [ranking, setRanking] = useState<UserRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchAllTcos = async () => {
      try {
        setIsLoading(true);
        
        // Buscar todas as pastas de usuários no Supabase Storage
        const { data: userFolders, error: foldersError } = await supabase.storage
          .from(BUCKET_NAME)
          .list('tcos/');

        if (foldersError) {
          console.error("Erro ao buscar pastas de usuários:", foldersError);
          setIsLoading(false);
          return;
        }

        let allTcos: TcoData[] = [];
        const userRankingMap = new Map<string, UserRanking>();

        // Para cada pasta de usuário, buscar os TCOs
        for (const folder of userFolders || []) {
          if (folder.name === '.emptyFolderPlaceholder') continue;
          
          const { data: userFiles, error: filesError } = await supabase.storage
            .from(BUCKET_NAME)
            .list(`tcos/${folder.name}/`);

          if (filesError) {
            console.error(`Erro ao buscar TCOs do usuário ${folder.name}:`, filesError);
            continue;
          }

          const userTcos: TcoData[] = userFiles?.map(file => {
            const fileName = file.name;
            const tcoMatch = fileName.match(/TCO[-_]([^_-]+)/i);
            let tcoIdentifierPart = tcoMatch ? tcoMatch[1] : fileName.replace(/\.pdf$/i, "");
            let finalTcoNumber = tcoIdentifierPart.toUpperCase().startsWith("TCO-") 
              ? tcoIdentifierPart 
              : `TCO-${tcoIdentifierPart}`;
            
            const natureza = extractTcoNatureFromFilename(fileName);
            
            return {
              id: file.id || fileName,
              tcoNumber: finalTcoNumber,
              createdAt: new Date(file.created_at || Date.now()),
              natureza: natureza,
              fileName: fileName,
              userId: folder.name
            };
          }) || [];

          allTcos = [...allTcos, ...userTcos];

          // Buscar informações do usuário do localStorage ou usar ID como fallback
          let userName = folder.name;
          try {
            // Tentar buscar dados do usuário salvo no localStorage se for o usuário atual
            if (folder.name === user.id) {
              userName = user.warName || user.nome || folder.name;
            }
          } catch (error) {
            console.log("Erro ao obter nome do usuário:", error);
          }

          // Calcular última atividade do usuário
          const sortedUserTcos = userTcos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          const lastActivity = sortedUserTcos.length > 0 
            ? sortedUserTcos[0].createdAt.toLocaleDateString('pt-BR')
            : '';

          userRankingMap.set(folder.name, {
            userId: folder.name,
            userName: userName,
            tcoCount: userTcos.length,
            lastActivity: lastActivity
          });
        }

        // Calcular estatísticas gerais
        const total = allTcos.length;
        
        if (total === 0) {
          setStats({
            total: 0,
            averagePerDay: 0,
            activeDays: 0,
            lastUpdate: new Date().toLocaleDateString('pt-BR')
          });
          setRanking([]);
          setIsLoading(false);
          return;
        }

        // Calcular dias únicos com TCOs
        const uniqueDates = new Set(
          allTcos.map(tco => tco.createdAt.toISOString().split('T')[0]).filter(Boolean)
        );
        
        const activeDays = uniqueDates.size;
        const averagePerDay = activeDays > 0 ? total / activeDays : 0;
        
        // Encontrar a última atualização geral
        const sortedAllTcos = allTcos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const lastUpdate = sortedAllTcos.length > 0 
          ? sortedAllTcos[0].createdAt.toLocaleDateString('pt-BR')
          : new Date().toLocaleDateString('pt-BR');

        setStats({
          total,
          averagePerDay: Math.round(averagePerDay * 10) / 10,
          activeDays,
          lastUpdate
        });

        // Criar ranking ordenado por quantidade de TCOs
        const sortedRanking = Array.from(userRankingMap.values())
          .filter(user => user.tcoCount > 0)
          .sort((a, b) => b.tcoCount - a.tcoCount);

        setRanking(sortedRanking);

      } catch (error) {
        console.error("Erro ao processar TCOs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTcos();
  }, [user.id]);

  if (isLoading) {
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

  // Encontrar posição do usuário atual no ranking
  const currentUserRank = ranking.findIndex(r => r.userId === user.id) + 1;
  const currentUserData = ranking.find(r => r.userId === user.id);

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-300" />
              Ranking TCO Geral
            </h3>
            <p className="text-sm text-white/80">Estatísticas de todos os usuários</p>
          </div>
          <TrendingUp className="h-8 w-8 text-white/60" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Stats Row */}
        <div className="flex justify-between items-center mb-4 bg-white/10 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-white/80">Total Geral</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.averagePerDay}</div>
            <div className="text-xs text-white/80">Média/dia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{ranking.length}</div>
            <div className="text-xs text-white/80">Usuários</div>
          </div>
        </div>

        {/* Current User Position */}
        {currentUserData && (
          <div className="bg-white/10 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  {currentUserRank}º
                </div>
                <div>
                  <div className="font-semibold text-sm">{currentUserData.userName}</div>
                  <div className="text-xs text-white/80">{currentUserData.tcoCount} TCOs</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">SUA POSIÇÃO</div>
                <div className="text-xs text-white/80">no ranking</div>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Ranking */}
        {ranking.length > 0 && (
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3 text-center">🏆 TOP 3</h4>
            <div className="space-y-2">
              {ranking.slice(0, 3).map((rankUser, index) => (
                <div key={rankUser.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-400 text-blue-600' :
                      index === 1 ? 'bg-gray-300 text-gray-600' :
                      'bg-orange-400 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{rankUser.userName}</div>
                      <div className="text-xs text-white/70">{rankUser.tcoCount} TCOs</div>
                    </div>
                  </div>
                  <div className="text-xs text-white/70">
                    {rankUser.lastActivity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
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
