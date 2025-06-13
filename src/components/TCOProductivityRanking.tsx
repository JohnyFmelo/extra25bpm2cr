import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Trophy, Award, Star } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  BUCKET_NAME,
  TcoData, // Reutilizando a interface TcoData
  extractRGPMsFromFilename,
} from "./TCOmeus (4)"; // CORREÇÃO: O caminho da importação foi atualizado para corresponder ao nome do arquivo fornecido.

interface RankedOfficer {
  rgpm: string;
  count: number;
  rank: number;
  nome?: string;
  graduacao?: string;
}

const TCOProductivityRanking: React.FC = () => {
  const [ranking, setRanking] = useState<RankedOfficer[]>([]);
  const [currentUserStats, setCurrentUserStats] = useState<RankedOfficer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Obtém o usuário do localStorage. O RGPM é esperado em 'registration'.
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);

  useEffect(() => {
    const fetchAndProcessTcos = async () => {
      setIsLoading(true);
      try {
        // 1. Buscar todos os TCOs do sistema, espelhando a lógica de TCOmeus
        const { data: folders, error: foldersError } = await supabase.storage
          .from(BUCKET_NAME)
          .list('tcos');

        if (foldersError) {
          console.error("Erro ao listar pastas de TCOs:", foldersError);
          return;
        }

        const allFilePromises = (folders || [])
            .filter(folder => folder.name && folder.name !== '.emptyFolderPlaceholder')
            .map(folder => supabase.storage.from(BUCKET_NAME).list(`tcos/${folder.name}/`));

        const allFileResults = await Promise.all(allFilePromises);

        const allTcos: Partial<TcoData>[] = [];
        allFileResults.forEach((result, index) => {
          if (result.data) {
            result.data.forEach(file => {
              allTcos.push({
                fileName: file.name,
                // Extrai RGPMs da guarnição principal e de apoio
                rgpmsExtracted: extractRGPMsFromFilename(file.name),
              });
            });
          }
        });

        // 2. Calcular produtividade por RGPM (Condutor + Guarnição Principal)
        const productivityMap = new Map<string, number>();
        allTcos.forEach(tco => {
          if (tco.rgpmsExtracted) {
            tco.rgpmsExtracted.main.forEach(rgpm => {
              productivityMap.set(rgpm, (productivityMap.get(rgpm) || 0) + 1);
            });
          }
        });

        if (productivityMap.size === 0) {
            setRanking([]);
            setCurrentUserStats(null);
            setIsLoading(false);
            return;
        }

        // 3. Buscar detalhes dos policiais ranqueados
        const allRgpms = Array.from(productivityMap.keys());
        const { data: officersData, error: officersError } = await supabase
          .from('police_officers')
          .select('rgpm, nome, graduacao')
          .in('rgpm', allRgpms);

        if (officersError) {
          console.error("Erro ao buscar detalhes dos policiais:", officersError);
        }

        const officersMap = new Map(officersData?.map(o => [o.rgpm, o]));

        // 4. Montar e classificar o ranking
        const rankedList: RankedOfficer[] = Array.from(productivityMap.entries())
          .map(([rgpm, count]) => {
            const officerDetails = officersMap.get(rgpm);
            return {
              rgpm,
              count,
              rank: 0, // será definido após ordenar
              nome: officerDetails?.nome || 'Desconhecido',
              graduacao: officerDetails?.graduacao || 'Policial'
            };
          })
          .sort((a, b) => b.count - a.count)
          .map((officer, index) => ({ ...officer, rank: index + 1 }));

        setRanking(rankedList);

        // 5. Encontrar as estatísticas do usuário logado (usando user.registration para RGPM)
        if (user.registration) {
          const userStats = rankedList.find(o => o.rgpm === user.registration);
          setCurrentUserStats(userStats || {
              rgpm: user.registration,
              count: 0,
              rank: 0,
              nome: user.warName || user.nome || "Você",
              graduacao: user.rank || ""
          });
        }

      } catch (error) {
        console.error("Erro ao processar o ranking de produtividade:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessTcos();
  }, [user.registration, user.warName, user.nome, user.rank]);

  const topThree = ranking.slice(0, 3);

  const getMedal = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Award className="h-5 w-5 text-gray-300" />;
    if (rank === 3) return <Star className="h-5 w-5 text-orange-400" />;
    return <span className="font-bold text-sm w-5 text-center text-gray-400">{rank}</span>;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="h-5 bg-white/20 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-1/2 mb-6"></div>
            <div className="space-y-3">
                <div className="h-12 bg-white/10 rounded-lg"></div>
                <div className="h-12 bg-white/10 rounded-lg"></div>
                <div className="h-12 bg-white/10 rounded-lg"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg">
      <CardHeader className="pb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-300" />
          Ranking de Produtividade
        </h3>
        <p className="text-sm text-white/70">TCOs registrados pela guarnição principal.</p>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Top 3 Ranking */}
        <div className="space-y-2">
            {topThree.length > 0 ? topThree.map((officer) => (
                <div key={officer.rgpm} className="flex items-center bg-white/10 hover:bg-white/20 transition-colors p-2.5 rounded-lg">
                    <div className="flex-shrink-0 w-6 flex justify-center items-center">{getMedal(officer.rank)}</div>
                    <div className="ml-3 flex-grow min-w-0">
                        <p className="font-semibold text-sm truncate">{`${officer.graduacao} ${officer.nome}`}</p>
                        <p className="text-xs text-white/60">RGPM: {officer.rgpm}</p>
                    </div>
                    <div className="text-right ml-2">
                        <p className="font-bold text-lg">{officer.count}</p>
                        <p className="text-xs text-white/60">TCOs</p>
                    </div>
                </div>
            )) : (
                <div className="text-center py-6 text-white/60 text-sm">Nenhum dado para exibir o ranking.</div>
            )}
        </div>

        {/* Current User Stats */}
        {user.registration && currentUserStats && (
          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3 mt-4">
            <h4 className="font-semibold text-sm text-blue-300 mb-2">Sua Posição</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-gray-900 font-bold flex-shrink-0">
                  {currentUserStats.rank > 0 ? currentUserStats.rank : "-"}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{currentUserStats.graduacao} {currentUserStats.nome}</div>
                  <div className="text-xs text-white/70">{currentUserStats.count} TCOs registrados</div>
                </div>
              </div>
              {currentUserStats.rank > 0 && <div className="text-lg font-bold text-blue-300 ml-2">
                TOP {currentUserStats.rank}
              </div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TCOProductivityRanking;
