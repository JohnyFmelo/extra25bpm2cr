
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { BarChart3, TrendingUp, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface NatureStats {
  total: number;
  types: number;
  categories: number;
}

interface NatureRanking {
  natureza: string;
  count: number;
  percentage: number;
}

interface ExtractedRgpms {
  main: string[];
  support: string[];
}

interface TcoData {
  id: string;
  tcoNumber: string;
  createdAt: Date;
  natureza: string;
  fileName: string;
  userId: string;
  rgpmsExtracted: ExtractedRgpms;
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
  
  return naturezaParts.join('_')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || "Não especificada";
};

const extractRGPMsFromFilename = (fileName: string | undefined | null): ExtractedRgpms => {
  const emptyResult: ExtractedRgpms = {
    main: [],
    support: []
  };
  if (!fileName) return emptyResult;
  const parts = fileName.split('_');
  if (parts.length < 5) return emptyResult;
  const rgpmSegmentWithExtension = parts[parts.length - 1];
  const rgpmStringWithoutExtension = rgpmSegmentWithExtension.replace(/\.pdf$/i, "");
  if (!rgpmStringWithoutExtension.match(/^\d/)) return emptyResult;
  const [mainRgpmsStr, supportRgpmsStr] = rgpmStringWithoutExtension.split('.');
  const parseRgpmsFromString = (rgpmStr: string | undefined): string[] => {
    if (!rgpmStr) return [];
    const rgpmsList: string[] = [];
    for (let i = 0; i < rgpmStr.length; i += 6) {
      const rgpm = rgpmStr.substring(i, i + 6);
      if (rgpm.length === 6 && /^\d{6}$/.test(rgpm)) rgpmsList.push(rgpm);
    }
    return rgpmsList;
  };
  return {
    main: parseRgpmsFromString(mainRgpmsStr),
    support: parseRgpmsFromString(supportRgpmsStr)
  };
};

const TCONatureRanking: React.FC = () => {
  const [stats, setStats] = useState<NatureStats>({
    total: 0,
    types: 0,
    categories: 0
  });
  const [ranking, setRanking] = useState<NatureRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchAllTcos = async () => {
      try {
        setIsLoading(true);
        
        const { data: userFolders, error: foldersError } = await supabase.storage
          .from(BUCKET_NAME)
          .list('tcos/');

        if (foldersError) {
          console.error("Erro ao buscar pastas de usuários:", foldersError);
          setIsLoading(false);
          return;
        }

        let allTcos: TcoData[] = [];
        const natureCountMap = new Map<string, number>();

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
            
            const rgpmsExtracted = extractRGPMsFromFilename(fileName);
            const natureza = extractTcoNatureFromFilename(fileName);
            
            return {
              id: file.id || fileName,
              tcoNumber: finalTcoNumber,
              createdAt: new Date(file.created_at || Date.now()),
              natureza: natureza,
              fileName: fileName,
              userId: folder.name,
              rgpmsExtracted: rgpmsExtracted
            };
          }) || [];

          allTcos = [...allTcos, ...userTcos];

          userTcos.forEach(tco => {
            const current = natureCountMap.get(tco.natureza) || 0;
            natureCountMap.set(tco.natureza, current + 1);
          });
        }

        const total = allTcos.length;
        const uniqueNatures = natureCountMap.size;
        
        if (total === 0) {
          setStats({
            total: 0,
            types: 0,
            categories: 0
          });
          setRanking([]);
          setIsLoading(false);
          return;
        }

        setStats({
          total,
          types: uniqueNatures,
          categories: uniqueNatures // Para simplificar, consideramos tipos e categorias iguais
        });

        const natureRanking: NatureRanking[] = Array.from(natureCountMap.entries())
          .map(([natureza, count]) => ({
            natureza,
            count,
            percentage: Math.round((count / total) * 100)
          }))
          .sort((a, b) => b.count - a.count);

        setRanking(natureRanking);

      } catch (error) {
        console.error("Erro ao processar TCOs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTcos();
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
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

  const getProgressBarColor = (index: number) => {
    if (index === 0) return "bg-red-500";
    if (index === 1) return "bg-green-500";
    return "bg-green-400";
  };

  const getRankingNumberColor = (index: number) => {
    if (index === 0) return "bg-yellow-400 text-blue-600";
    if (index === 1) return "bg-gray-300 text-gray-600";
    if (index === 2) return "bg-orange-400 text-white";
    return "bg-white/20 text-white";
  };

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
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

        {/* Ranking Completo Button */}
        <div className="bg-white/10 rounded-lg p-4">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-center gap-2 bg-yellow-400 text-blue-600 py-2 px-4 rounded-lg font-semibold text-sm mb-4 hover:bg-yellow-300 transition-colors">
                <span>🏆 RANKING COMPLETO</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4">
              {/* Mobile Layout */}
              <div className="block md:hidden space-y-4">
                {ranking.map((nature, index) => (
                  <div key={nature.natureza} className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRankingNumberColor(index)}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-bold">{nature.count}</div>
                        <div className="text-xs text-white/80">TCOs</div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm mb-1">{nature.natureza}</h4>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-white/80 mb-1">
                        <span>Percentual</span>
                        <span>{nature.percentage}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressBarColor(index)}`}
                          style={{ width: `${nature.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block space-y-3">
                {ranking.map((nature, index) => (
                  <div key={nature.natureza} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRankingNumberColor(index)}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm break-words">{nature.natureza}</div>
                        <div className="text-xs text-white/80">{nature.count} TCOs</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressBarColor(index)}`}
                            style={{ width: `${nature.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{nature.count}</div>
                        <div className="text-xs text-white/80">ocorrências</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Period Info */}
        <div className="flex justify-between items-center mt-4 text-xs text-white/60">
          <span>Total: {stats.total} TCOs</span>
          <span>Período: Maio - Junho 2025</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TCONatureRanking;
