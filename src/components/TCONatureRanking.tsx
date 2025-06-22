import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { BarChart3, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
interface NatureStats {
  total: number;
  types: number;
  categories: number;
  lastUpdate: string;
}
interface NatureRanking {
  nature: string;
  count: number;
  percentage: number;
}
const BUCKET_NAME = 'tco-pdfs';
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
  return naturezaParts.join('_').replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') || "Não especificada";
};
const TCONatureRanking: React.FC = () => {
  const [stats, setStats] = useState<NatureStats>({
    total: 0,
    types: 0,
    categories: 0,
    lastUpdate: ""
  });
  const [ranking, setRanking] = useState<NatureRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchNatureStats = async () => {
      try {
        setIsLoading(true);
        const {
          data: userFolders,
          error: foldersError
        } = await supabase.storage.from(BUCKET_NAME).list('tcos/');
        if (foldersError) {
          console.error("Erro ao buscar pastas de usuários:", foldersError);
          setIsLoading(false);
          return;
        }
        const natureCountMap = new Map<string, number>();
        let totalTcos = 0;
        for (const folder of userFolders || []) {
          if (folder.name === '.emptyFolderPlaceholder') continue;
          const {
            data: userFiles,
            error: filesError
          } = await supabase.storage.from(BUCKET_NAME).list(`tcos/${folder.name}/`);
          if (filesError) {
            console.error(`Erro ao buscar TCOs do usuário ${folder.name}:`, filesError);
            continue;
          }
          userFiles?.forEach(file => {
            const nature = extractTcoNatureFromFilename(file.name);
            const current = natureCountMap.get(nature) || 0;
            natureCountMap.set(nature, current + 1);
            totalTcos++;
          });
        }
        if (totalTcos === 0) {
          setStats({
            total: 0,
            types: 0,
            categories: 0,
            lastUpdate: new Date().toLocaleDateString('pt-BR')
          });
          setRanking([]);
          setIsLoading(false);
          return;
        }
        const natureRanking: NatureRanking[] = Array.from(natureCountMap.entries()).map(([nature, count]) => ({
          nature,
          count,
          percentage: Math.round(count / totalTcos * 100)
        })).sort((a, b) => b.count - a.count);
        const uniqueTypes = new Set(natureRanking.map(item => item.nature)).size;
        setStats({
          total: totalTcos,
          types: uniqueTypes,
          categories: uniqueTypes,
          // Para este contexto, tipos e categorias são similares
          lastUpdate: new Date().toLocaleDateString('pt-BR')
        });
        setRanking(natureRanking);
      } catch (error) {
        console.error("Erro ao processar naturezas dos TCOs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNatureStats();
  }, []);
  if (isLoading) {
    return <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
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
      </Card>;
  }
  const getProgressBarColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-orange-500';
      case 1:
        return 'bg-green-500';
      case 2:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };
  return <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-yellow-300" />
              Ranking TCO - Naturezas
            </h3>
            <p className="text-sm text-white/80">Distribuição por tipo de ocorrência</p>
          </div>
          <TrendingUp className="h-8 w-8 text-white/60" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Stats Row */}
        <div className="flex justify-between items-center mb-4 bg-white/10 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-white/80">Total TCOs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.types}</div>
            <div className="text-xs text-white/80">Tipos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.categories}</div>
            <div className="text-xs text-white/80">Categorias</div>
          </div>
        </div>

        {/* Ranking Completo Badge */}
        {ranking.length > 0 && <div className="mb-4">
            
          </div>}

        {/* Nature Ranking */}
        {ranking.length > 0 && <div className="space-y-4">
            {ranking.slice(0, 3).map((nature, index) => <div key={nature.nature} className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${index === 0 ? 'bg-yellow-400 text-blue-600' : index === 1 ? 'bg-gray-300 text-gray-600' : index === 2 ? 'bg-orange-400 text-white' : 'bg-white/20 text-white'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm break-words">
                      {nature.nature}
                    </div>
                    <div className="text-xs text-white/80">
                      {nature.count} TCO{nature.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{nature.count}</div>
                    <div className="text-xs text-white/80">ocorrências</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-white/80">Percentual</span>
                    <span className="text-sm font-semibold">{nature.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className={`h-2 rounded-full ${getProgressBarColor(index)}`} style={{
                width: `${nature.percentage}%`
              }}></div>
                  </div>
                </div>
              </div>)}
            
            {/* Period Info */}
            <div className="text-center text-sm text-white/80 mt-4">
              <div>Total: {stats.total} TCOs</div>
              <div>Período: Maio - Junho 2025</div>
            </div>
          </div>}
      </CardContent>
    </Card>;
};
export default TCONatureRanking;