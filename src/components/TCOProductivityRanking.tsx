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

interface OfficerRanking {
  rgpm: string;
  officerName: string;
  graduacao: string;
  tcoCount: number;
  lastActivity: string;
}

interface ExtractedRgpms {
  main: string[];
  support: string[];
}

interface OfficerInfo {
  rgpm: string;
  graduacao: string;
  nome: string;
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

const TCOProductivityRanking: React.FC = () => {
  const [stats, setStats] = useState<TCOStats>({
    total: 0,
    averagePerDay: 0,
    activeDays: 0,
    lastUpdate: ""
  });
  const [ranking, setRanking] = useState<OfficerRanking[]>([]);
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
        const officerTcoCountMap = new Map<string, { count: number; lastActivity: string; officerInfo?: OfficerInfo }>();

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
            const rgpmsExtracted = extractRGPMsFromFilename(fileName);
            
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

          // Processar RGPMs de cada TCO para contar participação dos militares
          userTcos.forEach(tco => {
            const tcoDate = tco.createdAt.toLocaleDateString('pt-BR');
            
            // Contar participação do condutor (primeiro da guarnição principal)
            if (tco.rgpmsExtracted.main.length > 0) {
              const conductorRgpm = tco.rgpmsExtracted.main[0];
              const current = officerTcoCountMap.get(conductorRgpm) || { count: 0, lastActivity: '' };
              officerTcoCountMap.set(conductorRgpm, {
                count: current.count + 1,
                lastActivity: tcoDate > current.lastActivity ? tcoDate : current.lastActivity,
                officerInfo: current.officerInfo
              });
            }

            // Contar participação dos demais da guarnição principal
            tco.rgpmsExtracted.main.slice(1).forEach(rgpm => {
              const current = officerTcoCountMap.get(rgpm) || { count: 0, lastActivity: '' };
              officerTcoCountMap.set(rgpm, {
                count: current.count + 1,
                lastActivity: tcoDate > current.lastActivity ? tcoDate : current.lastActivity,
                officerInfo: current.officerInfo
              });
            });
          });
        }

        // Buscar informações dos oficiais no banco de dados
        const allRgpms = Array.from(officerTcoCountMap.keys());
        if (allRgpms.length > 0) {
          const { data: officersData, error: officersError } = await supabase
            .from('police_officers')
            .select('rgpm, graduacao, nome')
            .in('rgpm', allRgpms);

          if (!officersError && officersData) {
            officersData.forEach(officer => {
              const current = officerTcoCountMap.get(officer.rgpm);
              if (current) {
                officerTcoCountMap.set(officer.rgpm, {
                  ...current,
                  officerInfo: officer as OfficerInfo
                });
              }
            });
          }
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

        // Criar ranking de militares
        const officerRanking: OfficerRanking[] = Array.from(officerTcoCountMap.entries())
          .filter(([_, data]) => data.count > 0)
          .map(([rgpm, data]) => ({
            rgpm,
            officerName: data.officerInfo?.nome || 'Militar não identificado',
            graduacao: data.officerInfo?.graduacao || '',
            tcoCount: data.count,
            lastActivity: data.lastActivity
          }))
          .sort((a, b) => b.tcoCount - a.tcoCount);

        setRanking(officerRanking);

      } catch (error) {
        console.error("Erro ao processar TCOs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTcos();
  }, []);

  const handleCardClick = () => {
    window.open('/ranking-tco', '_blank');
  };

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

  // Encontrar posição do usuário atual no ranking (se ele tiver RGPM)
  const currentUserRgpm = user.rgpm;
  const currentUserRank = currentUserRgpm ? ranking.findIndex(r => r.rgpm === currentUserRgpm) + 1 : 0;
  const currentUserData = currentUserRgpm ? ranking.find(r => r.rgpm === currentUserRgpm) : null;

  return (
    <Card 
      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-300" />
              Ranking TCO - Militares
            </h3>
            <p className="text-sm text-white/80">Participação de militares nos TCOs • Clique para ver o ranking completo</p>
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
            <div className="text-2xl font-bold">{stats.averagePerDay}</div>
            <div className="text-xs text-white/80">Média/dia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{ranking.length}</div>
            <div className="text-xs text-white/80">Militares</div>
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
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {currentUserData.graduacao} {currentUserData.officerName}
                  </div>
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
            <h4 className="text-sm font-semibold mb-3 text-center">🏆 TOP 3 MILITARES</h4>
            <div className="space-y-2">
              {ranking.slice(0, 3).map((officer, index) => (
                <div key={officer.rgpm} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      index === 0 ? 'bg-yellow-400 text-blue-600' :
                      index === 1 ? 'bg-gray-300 text-gray-600' :
                      'bg-orange-400 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {officer.graduacao} {officer.officerName}
                      </div>
                      <div className="text-xs text-white/70">{officer.tcoCount} TCOs</div>
                    </div>
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
